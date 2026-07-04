"""
utils/standardizer.py — Data Cleaning & Standardization
========================================================
Contains three functions that clean raw extracted data into
the strict formats required by Developer 2's API contract:
  1. standardize_date()      → converts any date string to "YYYY-MM-DD"
  2. standardize_payment_mode() → normalizes payment modes to standard strings
  3. standardize_amount()    → strips symbols and converts to a clean float
"""

import re                              # Regular expressions — used to strip non-numeric chars from amounts
from dateutil import parser as dateparser  # Powerful date string parser that handles many formats automatically


# ──────────────────────────────────────────────────────────────────────────────
# 1. DATE STANDARDIZATION
# ──────────────────────────────────────────────────────────────────────────────

def standardize_date(date_string: str) -> str | None:
    """
    Converts a date string in ANY common format into "YYYY-MM-DD".

    How it works:
    - dateutil.parser.parse() is a smart parser that can understand formats like:
        "28/06/2026", "28-Jun-26", "June 28, 2026", "2026-06-28", "28 Jun 2026"
    - dayfirst=True tells the parser that in ambiguous cases (like "06/07/2026"),
      the FIRST number is the DAY, not the month. This is the Indian convention.
    - .strftime("%Y-%m-%d") formats the parsed datetime object into "YYYY-MM-DD".

    Args:
        date_string: The raw date string extracted from a document.

    Returns:
        A string in "YYYY-MM-DD" format, or None if parsing fails.

    Examples:
        standardize_date("28/06/2026")  → "2026-06-28"
        standardize_date("28-Jun-26")   → "2026-06-28"
        standardize_date("garbage")     → None
    """
    # If the input is empty or not a string, return None immediately
    if not date_string or not isinstance(date_string, str):
        return None

    try:
        # dateparser.parse() tries to intelligently parse the date string.
        # dayfirst=True: treats "28/06/2026" as June 28 (not 28th month which doesn't exist,
        # but more importantly, "06/07/2026" becomes July 6, not June 7).
        parsed_date = dateparser.parse(date_string, dayfirst=True)

        # .strftime("%Y-%m-%d") formats the datetime into our target format.
        # %Y = 4-digit year, %m = 2-digit month, %d = 2-digit day.
        return parsed_date.strftime("%Y-%m-%d")

    except (ValueError, TypeError, OverflowError):
        # If dateutil cannot parse the string at all, it raises ValueError.
        # TypeError if the input is somehow wrong type, OverflowError for extreme dates.
        # In all these cases, we return None to signal "could not parse".
        return None


# ──────────────────────────────────────────────────────────────────────────────
# 2. PAYMENT MODE STANDARDIZATION
# ──────────────────────────────────────────────────────────────────────────────

# Canonical values used across TrustSaathi (frontend dropdown + database).
CANONICAL_PAYMENT_MODES = ("UPI", "Cash", "Bank Transfer", "Cheque", "Card", "Unknown")

# Maps common raw labels (lowercase) to canonical payment modes.
PAYMENT_MODE_MAP: dict[str, str] = {
    # --- UPI variations ---
    "upi": "UPI",
    "gpay": "UPI",
    "google pay": "UPI",
    "googlepay": "UPI",
    "phonepe": "UPI",
    "phone pe": "UPI",
    "paytm": "UPI",
    "paytm upi": "UPI",
    "bhim": "UPI",
    "bhim upi": "UPI",

    # --- Cash variations ---
    "cash": "Cash",
    "by hand": "Cash",
    "naqad": "Cash",
    "hand": "Cash",
    "in hand": "Cash",

    # --- Bank Transfer variations ---
    "bank transfer": "Bank Transfer",
    "bank_transfer": "Bank Transfer",
    "bank": "Bank Transfer",
    "neft": "Bank Transfer",
    "rtgs": "Bank Transfer",
    "imps": "Bank Transfer",
    "wire": "Bank Transfer",
    "wire transfer": "Bank Transfer",
    "online": "Bank Transfer",
    "online transfer": "Bank Transfer",

    # --- Cheque variations ---
    "cheque": "Cheque",
    "check": "Cheque",
    "chq": "Cheque",
    "demand draft": "Cheque",
    "dd": "Cheque",
    "draft": "Cheque",

    # --- Card / digital terminal ---
    "card": "Card",
    "debit card": "Card",
    "credit card": "Card",
    "debit": "Card",
    "credit": "Card",
    "pos": "Card",
    "swipe": "Card",

    # --- Unknown / legacy engine values ---
    "unknown": "Unknown",
    "other": "Unknown",
    "na": "Unknown",
    "n/a": "Unknown",
}


def _match_payment_mode(cleaned: str) -> str | None:
    """Exact map lookup, then substring heuristics for compound labels."""
    if cleaned in PAYMENT_MODE_MAP:
        return PAYMENT_MODE_MAP[cleaned]

    if any(token in cleaned for token in ("upi", "gpay", "phonepe", "paytm", "bhim")):
        return "UPI"
    if "cash" in cleaned or "naqad" in cleaned:
        return "Cash"
    if any(token in cleaned for token in ("neft", "rtgs", "imps", "bank", "wire", "online transfer")):
        return "Bank Transfer"
    if any(token in cleaned for token in ("cheque", "check", "chq", "demand draft", "draft")):
        return "Cheque"
    if any(token in cleaned for token in ("card", "debit", "credit", "pos", "swipe")):
        return "Card"

    return None


def standardize_payment_mode(raw_mode: str) -> str:
    """
    Normalizes a raw payment mode string into one of:
    UPI, Cash, Bank Transfer, Cheque, Card, Unknown
    """
    if not raw_mode or not isinstance(raw_mode, str):
        return "Unknown"

    cleaned = raw_mode.strip().lower()
    if not cleaned or cleaned in {"none", "null", "-", "--"}:
        return "Unknown"

    matched = _match_payment_mode(cleaned)
    return matched if matched else "Unknown"


# ──────────────────────────────────────────────────────────────────────────────
# 3. AMOUNT STANDARDIZATION
# ──────────────────────────────────────────────────────────────────────────────

def standardize_amount(raw_amount) -> float | None:
    """
    Converts a raw amount value (which might contain currency symbols, commas,
    or other non-numeric characters) into a clean Python float.

    How it works:
    1. Convert the input to a string (in case it's already a number).
    2. Use regex to remove everything except digits and decimal points.
    3. Convert the cleaned string to a float.

    Args:
        raw_amount: The raw amount — could be a string like "₹1,500.00", "Rs 500",
                    or already a number like 1500 or 1500.0.

    Returns:
        A float like 1500.0, or None if conversion fails.

    Examples:
        standardize_amount("₹1,500.00")  → 1500.0
        standardize_amount("Rs. 500")     → 500.0
        standardize_amount(1500)          → 1500.0
        standardize_amount("N/A")         → None
    """
    # If input is None, return None immediately
    if raw_amount is None:
        return None

    # If it's already a plain number (int or float), just return it as float
    if isinstance(raw_amount, (int, float)):
        return float(raw_amount)

    try:
        # Convert to string in case it's some other type
        text = str(raw_amount)

        # re.sub(pattern, replacement, string) replaces all matches of `pattern`
        # with `replacement` in `string`.
        #
        # Pattern: r"[^\d.]"
        #   [^\d.]  means "any character that is NOT a digit (\d) and NOT a dot (.)"
        #   So this removes: ₹, Rs, commas, spaces, letters, etc.
        #
        # Examples:
        #   "₹1,500.00" → "1500.00"
        #   "Rs. 500"   → "500"  (the dot after Rs gets removed because it matches,
        #                          but wait — "." IS allowed by our pattern.
        #                          Actually "Rs. 500" → ".500" ... let me handle this)
        cleaned = re.sub(r"[^\d.]", "", text)

        # Edge case: if cleaning left us with an empty string or just dots
        if not cleaned or cleaned == ".":
            return None

        # Handle case where there might be leading dots (e.g., from "Rs. 500" → ".500")
        # .strip(".") would remove valid decimals, so instead we handle leading dots:
        # Actually re.sub(r"[^\d.]", "", "Rs. 500") gives ".500" — we need to handle this.
        # Let's strip leading dots that aren't part of a decimal number.
        cleaned = cleaned.lstrip(".")  # Remove leading dots: ".500" → "500"

        if not cleaned:
            return None

        return float(cleaned)

    except (ValueError, TypeError):
        # If float() conversion fails for any reason, return None
        return None
