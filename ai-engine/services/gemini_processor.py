"""
services/gemini_processor.py — AI-Powered OCR & Entity Extraction
"""

import io
import json
import time
from google import genai
from google.genai import types
from config import GEMINI_MODEL, GEMINI_FALLBACK_MODELS, gemini_api_key_list

_clients: list[genai.Client] = []
_client_cursor = 0

IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/tiff",
}

# Max longest edge sent to Gemini — smaller = faster upload + inference.
MAX_IMAGE_EDGE = int(__import__("os").getenv("GEMINI_MAX_IMAGE_EDGE", "1600"))


def _get_clients() -> list[genai.Client]:
    global _clients
    if _clients:
        return _clients

    keys = gemini_api_key_list()
    if not keys:
        raise ValueError(
            "No Gemini API key configured. Set GEMINI_API_KEY or GEMINI_API_KEYS in .env"
        )

    _clients = [genai.Client(api_key=key) for key in keys]
    return _clients


def _next_client() -> genai.Client:
    global _client_cursor
    clients = _get_clients()
    client = clients[_client_cursor % len(clients)]
    _client_cursor += 1
    return client


def _model_candidates() -> list[str]:
    models: list[str] = []
    for name in [GEMINI_MODEL, *GEMINI_FALLBACK_MODELS.split(",")]:
        cleaned = name.strip()
        if cleaned and cleaned not in models:
            models.append(cleaned)
    return models or ["gemini-2.5-flash-lite", "gemini-2.5-flash"]


def _is_model_not_found_error(exc: Exception) -> bool:
    if hasattr(exc, "code") and getattr(exc, "code", None) == 404:
        return True
    if hasattr(exc, "status_code") and getattr(exc, "status_code", None) == 404:
        return True
    msg = str(exc).lower()
    return "404" in msg or ("not found" in msg and "model" in msg)


def _is_rate_limit_error(exc: Exception) -> bool:
    if hasattr(exc, "code") and getattr(exc, "code", None) == 429:
        return True
    if hasattr(exc, "status_code") and getattr(exc, "status_code", None) == 429:
        return True
    msg = str(exc).lower()
    return "429" in msg or "resource exhausted" in msg or "rate limit" in msg


def _is_retryable_gemini_error(exc: Exception) -> bool:
    if hasattr(exc, "code") and getattr(exc, "code", None) in {429, 503}:
        return True
    if hasattr(exc, "status_code") and getattr(exc, "status_code", None) in {429, 503}:
        return True
    msg = str(exc).lower()
    return any(
        token in msg
        for token in ("503", "429", "unavailable", "high demand", "resource exhausted", "overloaded")
    )


def _maybe_compress_image(file_bytes: bytes, mime_type: str) -> tuple[bytes, str]:
    """Downscale large photos/screenshots so Gemini receives fewer tokens faster."""
    if mime_type not in IMAGE_MIME_TYPES:
        return file_bytes, mime_type

    if len(file_bytes) < 400_000 and mime_type == "image/jpeg":
        return file_bytes, mime_type

    try:
        from PIL import Image

        image = Image.open(io.BytesIO(file_bytes))
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")

        if max(image.size) > MAX_IMAGE_EDGE:
            image.thumbnail((MAX_IMAGE_EDGE, MAX_IMAGE_EDGE), Image.Resampling.LANCZOS)

        out = io.BytesIO()
        image.save(out, format="JPEG", quality=82, optimize=True)
        return out.getvalue(), "image/jpeg"
    except Exception:
        return file_bytes, mime_type


def _call_model(client: genai.Client, model: str, contents: list) -> str:
    try:
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=types.GenerateContentConfig(
                temperature=0.1,
                response_mime_type="application/json",
            ),
        )
        return response.text
    except Exception as exc:
        msg = str(exc).lower()
        if "response_mime_type" in msg or "response mime" in msg:
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=types.GenerateContentConfig(temperature=0.1),
            )
            return response.text
        raise


def _generate_with_fallback(contents: list) -> str:
    """Try models × API keys with short backoff. Rotates keys on 429."""
    backoff_seconds = [0.5, 1.5, 3]
    last_error: Exception | None = None
    clients = _get_clients()

    for model in _model_candidates():
        for client in clients:
            for attempt, delay in enumerate(backoff_seconds):
                try:
                    return _call_model(client, model, contents)
                except Exception as exc:
                    last_error = exc
                    if _is_model_not_found_error(exc):
                        break
                    if _is_rate_limit_error(exc):
                        break
                    if _is_retryable_gemini_error(exc):
                        if attempt < len(backoff_seconds) - 1:
                            time.sleep(delay)
                            continue
                        break
                    raise

    raise ValueError(
        "Gemini is temporarily overloaded. Please wait a minute and try again."
    ) from last_error


EXTRACTION_PROMPT = """
You are an OCR system for Indian NGO donation registers and receipts.
Read the document and return ONLY valid JSON (no markdown) in this shape:
{
  "document_type": "handwritten_register" | "printed_register" | "receipt",
  "entries": [
    {
      "donor_name": "string or null",
      "amount": 1000,
      "date": "as written",
      "payment_mode": "UPI" | "Cash" | "Bank Transfer" | "Cheque" | "Card" | "Unknown",
      "confidence_score": 0.0
    }
  ]
}
Rules: amount must be a number; map GPay/PhonePe/Paytm to UPI; include every row; do not invent data.
"""


def process_image_or_pdf(file_bytes: bytes, mime_type: str) -> dict:
    if mime_type in IMAGE_MIME_TYPES:
        file_bytes, mime_type = _maybe_compress_image(file_bytes, mime_type)

    file_part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
    raw_text = _generate_with_fallback([file_part, EXTRACTION_PROMPT])

    cleaned_text = raw_text.strip()
    if cleaned_text.startswith("```json"):
        cleaned_text = cleaned_text[7:]
    elif cleaned_text.startswith("```"):
        cleaned_text = cleaned_text[3:]
    if cleaned_text.endswith("```"):
        cleaned_text = cleaned_text[:-3]
    cleaned_text = cleaned_text.strip()

    try:
        parsed = json.loads(cleaned_text)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Gemini returned invalid JSON. Raw response:\n{raw_text}\nParse error: {e}"
        ) from e

    return {
        "document_type": parsed.get("document_type", "handwritten_register"),
        "entries": parsed.get("entries", []),
    }
