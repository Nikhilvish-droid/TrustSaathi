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

# --- Gemini API Key ---
# Some setups use GEMINI_API_KEY and others use GOOGLE_API_KEY.
# We accept either, but Gemini API Studio keys should be stored here.
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

# --- Developer 2's Backend URL ---
# This is the URL where we'll forward the extracted data.
# os.getenv("BACKEND_API_URL", "") provides an empty string as default,
# meaning if the variable isn't set, we just won't forward data (graceful fallback).
BACKEND_API_URL: str = os.getenv("BACKEND_API_URL", "")

# --- Backend API Key ---
# This must match AI_SERVICE_API_KEY in the Node backend .env file.
BACKEND_API_KEY: str = os.getenv("BACKEND_API_KEY", "")

# --- Gemini model ---
# Primary model + comma-separated fallbacks when Google returns 503 high demand.
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_FALLBACK_MODELS: str = os.getenv(
    "GEMINI_FALLBACK_MODELS",
    "gemini-1.5-flash,gemini-2.0-flash-lite",
)
