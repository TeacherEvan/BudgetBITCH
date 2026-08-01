import pytest
import numpy as np
from PIL import Image
from hf_bot.engine import ReceiptExtractionEngine
from hf_bot.schema import ExtractionResponse

def test_engine_initialization():
    engine = ReceiptExtractionEngine(use_vlm=False)
    assert engine is not None

def test_engine_extract_from_synthetic_image():
    # Create white canvas
    arr = np.full((300, 300, 3), 255, dtype=np.uint8)
    pil_img = Image.fromarray(arr)

    engine = ReceiptExtractionEngine(use_vlm=False)
    response = engine.extract(pil_img)

    assert isinstance(response, ExtractionResponse)
    assert response.success is True
    assert response.data is not None
    assert response.data.merchant_name is not None
    assert response.data.total_amount >= 0.0

def test_engine_extract_text_fallback():
    raw_text = """
    TARGET STORE #1234
    08/01/2026
    ORGANIC MILK  $3.50
    BREAD         $2.50
    SUBTOTAL      $6.00
    TAX           $0.50
    TOTAL         $6.50
    PAID VISA CARD
    """
    engine = ReceiptExtractionEngine(use_vlm=False)
    financials = engine.parse_raw_text(raw_text)

    assert financials.merchant_name == "TARGET STORE #1234"
    assert financials.total_amount == 6.50
    assert financials.subtotal_amount == 6.00
    assert financials.tax_amount == 0.50
    assert financials.currency == "USD"
    assert financials.currency_symbol == "$"
    assert financials.date == "2026-08-01"
    assert financials.category == "groceries"
