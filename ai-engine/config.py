"""
config.py — Centralized Configuration Loader
=============================================
Loads environment variables from a .env file using python-dotenv,
then exposes them as simple Python variables for the rest of the app.
"""

import os                          # Built-in module to access environment variables
from pathlib import Path
from dotenv import load_dotenv     # Reads key=value pairs from a .env file and sets them as env vars

# Load the AI engine's local .env explicitly so it works even if the service
# is started from a different working directory.
load_dotenv(Path(__file__).resolve().parent / ".env")

# --- Gemini API Key(s) ---
# Single key: GEMINI_API_KEY=...
# Multiple keys (round-robin on rate limits): GEMINI_API_KEYS=key1,key2,key3
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""
GEMINI_API_KEYS: str = os.getenv("GEMINI_API_KEYS", "")


def gemini_api_key_list() -> list[str]:
    keys: list[str] = []
    for raw in (GEMINI_API_KEYS, GEMINI_API_KEY):
        if not raw:
            continue
        for part in raw.split(","):
            cleaned = part.strip()
            if cleaned and cleaned not in keys:
                keys.append(cleaned)
    return keys

# --- Developer 2's Backend URL ---
# This is the URL where we'll forward the extracted data.
# os.getenv("BACKEND_API_URL", "") provides an empty string as default,
# meaning if the variable isn't set, we just won't forward data (graceful fallback).
BACKEND_API_URL: str = os.getenv("BACKEND_API_URL", "")

# --- Backend API Key ---
# This must match AI_SERVICE_API_KEY in the Node backend .env file.
BACKEND_API_KEY: str = os.getenv("BACKEND_API_KEY", "")

# Primary model — flash-lite variants are fastest for OCR tables.
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
GEMINI_FALLBACK_MODELS: str = os.getenv(
    "GEMINI_FALLBACK_MODELS",
    "gemini-3.1-flash-lite,gemini-2.5-flash,gemini-3.5-flash",
)
