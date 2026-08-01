import pytest
from hf_bot.schema import LineItem, FinancialVariables, ExtractionResponse

def test_line_item_schema():
    item = LineItem(
        description="Organic Milk 1L",
        qty=2,
        unit_price=3.50,
        total_price=7.00
    )
    assert item.description == "Organic Milk 1L"
    assert item.qty == 2
    assert item.unit_price == 3.50
    assert item.total_price == 7.00

def test_financial_variables_schema():
    data = FinancialVariables(
        merchant_name="Target",
        total_amount=45.20,
        tax_amount=3.50,
        subtotal_amount=41.70,
        currency="USD",
        currency_symbol="$",
        date="2026-08-01",
        category="groceries",
        payment_method="card",
        line_items=[
            LineItem(description="Target Item 1", total_price=45.20)
        ],
        confidence_score=0.95
    )
    assert data.merchant_name == "Target"
    assert data.total_amount == 45.20
    assert data.currency == "USD"
    assert data.category == "groceries"
    assert len(data.line_items) == 1

def test_extraction_response_schema():
    resp = ExtractionResponse(
        success=True,
        data=FinancialVariables(
            merchant_name="Walmart",
            total_amount=12.99,
            currency="USD",
            currency_symbol="$"
        ),
        message="Successfully extracted receipt variables"
    )
    assert resp.success is True
    assert resp.data.merchant_name == "Walmart"
    assert resp.data.total_amount == 12.99
