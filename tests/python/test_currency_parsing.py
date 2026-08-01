import pytest
from hf_bot.currency_parser import detect_currency_symbol, parse_amount, parse_date, infer_category

def test_detect_currency_symbol():
    assert detect_currency_symbol("Total: $45.20") == ("USD", "$")
    assert detect_currency_symbol("Totaal: € 12.50") == ("EUR", "€")
    assert detect_currency_symbol("Amount: £85.00") == ("GBP", "£")
    assert detect_currency_symbol("Paid: R120.00 at Woolworths") == ("ZAR", "R")
    assert detect_currency_symbol("合計: ¥3,500") == ("JPY", "¥")
    assert detect_currency_symbol("Total: C$ 55.00") == ("CAD", "C$")
    assert detect_currency_symbol("Total: A$ 99.00") == ("AUD", "A$")
    assert detect_currency_symbol("Total: ₹ 450.00") == ("INR", "₹")

def test_parse_amount():
    assert parse_amount("$45.20") == 45.20
    assert parse_amount("€ 1,234.50") == 1234.50
    assert parse_amount("R 120.00") == 120.00
    assert parse_amount("12.50 EUR") == 12.50
    assert parse_amount("No amount here") == 0.0

def test_parse_date():
    assert parse_date("Date: 2026-08-01") == "2026-08-01"
    assert parse_date("Date: 08/01/2026", currency="USD") == "2026-08-01"
    assert parse_date("Date: 01/08/2026", currency="EUR") == "2026-08-01"
    assert parse_date("Date: 01-Aug-2026") == "2026-08-01"

def test_infer_category():
    assert infer_category("Starbucks Coffee", "Flat white") == "dining"
    assert infer_category("Target Store", "Milk, Bread, Eggs") == "groceries"
    assert infer_category("Shell Oil", "Unleaded Fuel") == "travel"
    assert infer_category("Uber Trip", "Ride fare") == "travel"
    assert infer_category("Random Unknown Shop", "Something") == "other"
