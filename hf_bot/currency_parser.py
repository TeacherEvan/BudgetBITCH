"""
International Currency, Date, & Financial Field Parser Engine
Supports multi-currency symbols ($ , €, £, R, ¥, ₹, ₱, ₩, CHF, A$, C$, NZ$) and date formats.
"""

import re
from typing import Tuple, Optional
from datetime import datetime


# Currency Symbol & Code Registry
CURRENCY_MAP = [
    (r"\bA\$\s*|AUD\b", "AUD", "A$"),
    (r"\bC\$\s*|CAD\b", "CAD", "C$"),
    (r"\bNZ\$\s*|NZD\b", "NZD", "NZ$"),
    (r"\bSG\$\s*|SGD\b", "SGD", "SG$"),
    (r"\bHK\$\s*|HKD\b", "HKD", "HK$"),
    (r"\bUS\$\s*|\$|USD\b", "USD", "$"),
    (r"€|EUR\b", "EUR", "€"),
    (r"£|GBP\b", "GBP", "£"),
    (r"\bR\s*\d|\bZAR\b", "ZAR", "R"),
    (r"¥|JPY\b|CNY\b", "JPY", "¥"),
    (r"₹|INR\b", "INR", "₹"),
    (r"₱|PHP\b", "PHP", "₱"),
    (r"₩|KRW\b", "KRW", "₩"),
    (r"\bCHF\b", "CHF", "CHF"),
]

# Category Keyword Matchers
CATEGORY_KEYWORDS = {
    "groceries": ["supermarket", "grocery", "walmart", "target", "woolworths", "pick n pay", "carrefour", "tESCO", "rewe", "milk", "bread", "food"],
    "dining": ["starbucks", "mcdonalds", "kfc", "burger", "cafe", "coffee", "restaurant", "bistro", "bar", "grill", "pizza", "subway"],
    "travel": ["uber", "bolt", "lyft", "grab", "shell", "bp", "chevron", "total", "petrol", "gas", "fuel", "parking", "airline", "flight"],
    "utilities": ["electricity", "water", "wifi", "internet", "verizon", "t-mobile", "vodafone", "telecom"],
    "supplies": ["office", "stationery", "staples", "paper", "hardware", "homedepot"],
}


def detect_currency_symbol(text: str) -> Tuple[str, str]:
    """Detect currency ISO code and symbol from raw receipt text."""
    for pattern, code, symbol in CURRENCY_MAP:
        if re.search(pattern, text, re.IGNORECASE):
            return code, symbol
    return "USD", "$"


def parse_amount(text: str) -> float:
    """Extract floating-point numerical monetary amount from text."""
    if not text:
        return 0.0
        
    # Match patterns like $45.20, 1,234.50, 120.00
    match = re.search(r"[\d,]+\.\d{2}\b", text)
    if match:
        cleaned = match.group(0).replace(",", "")
        try:
            return float(cleaned)
        except ValueError:
            pass
            
    # Simple integer / float fallback
    match_fallback = re.search(r"\b\d+[\.,]?\d*\b", text)
    if match_fallback:
        cleaned = match_fallback.group(0).replace(",", "")
        try:
            val = float(cleaned)
            return val if val > 0 else 0.0
        except ValueError:
            pass
            
    return 0.0


def parse_date(text: str, currency: str = "USD") -> Optional[str]:
    """Extract and normalize date to ISO YYYY-MM-DD format."""
    if not text:
        return None
        
    # YYYY-MM-DD
    iso_match = re.search(r"\b(20\d{2})[-/\.](0[1-9]|1[0-2])[-/\.](0[1-9]|[12]\d|3[01])\b", text)
    if iso_match:
        return f"{iso_match.group(1)}-{iso_match.group(2)}-{iso_match.group(3)}"
        
    # Slash/Dash dates: DD/MM/YYYY or MM/DD/YYYY
    slash_match = re.search(r"\b(0[1-9]|[12]\d|3[01])[-/\.](0[1-9]|[12]\d|3[01])[-/\.](20\d{2})\b", text)
    if slash_match:
        g1, g2, y = int(slash_match.group(1)), int(slash_match.group(2)), slash_match.group(3)
        if g1 > 12:  # g1 is day -> DD/MM/YYYY
            return f"{y}-{str(g2).zfill(2)}-{str(g1).zfill(2)}"
        elif g2 > 12:  # g2 is day -> MM/DD/YYYY
            return f"{y}-{str(g1).zfill(2)}-{str(g2).zfill(2)}"
        else:
            # Ambiguous dates: USD/CAD default to MM/DD/YYYY, others to DD/MM/YYYY
            if currency in ("USD", "CAD"):
                return f"{y}-{str(g1).zfill(2)}-{str(g2).zfill(2)}"
            else:
                return f"{y}-{str(g2).zfill(2)}-{str(g1).zfill(2)}"
        
    # DD-Mon-YYYY (e.g., 01-Aug-2026)
    mon_match = re.search(r"\b(\d{1,2})[-/\s]+([A-Za-z]{3})[-/\s]+(20\d{2})\b", text)
    if mon_match:
        day_str, mon_str, year_str = mon_match.group(1), mon_match.group(2), mon_match.group(3)
        try:
            dt = datetime.strptime(f"{day_str}-{mon_str}-{year_str}", "%d-%b-%Y")
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            pass
            
    return None


def infer_category(merchant: str, text: str) -> str:
    """Infer budget category from merchant name and receipt content."""
    combined = f"{merchant} {text}".lower()
    for cat, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in combined for kw in keywords):
            return cat
    return "other"
