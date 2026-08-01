"""
Pydantic Schemas for Receipt OCR & Financial Variable Extraction
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class LineItem(BaseModel):
    description: str = Field(..., description="Line item description or name")
    qty: Optional[float] = Field(default=1.0, description="Quantity purchased")
    unit_price: Optional[float] = Field(default=None, description="Price per single unit")
    total_price: Optional[float] = Field(default=None, description="Total cost of the line item")


class FinancialVariables(BaseModel):
    merchant_name: str = Field(default="Merchant", description="Extracted store or business name")
    total_amount: float = Field(default=0.0, description="Final total transaction amount paid")
    tax_amount: Optional[float] = Field(default=None, description="Extracted sales tax or VAT amount")
    subtotal_amount: Optional[float] = Field(default=None, description="Pre-tax subtotal amount")
    currency: str = Field(default="USD", description="3-letter ISO currency code (USD, EUR, GBP, ZAR, JPY, etc.)")
    currency_symbol: str = Field(default="$", description="Currency symbol ($ , €, £, R, ¥, ₹, ₱)")
    date: Optional[str] = Field(default=None, description="ISO format transaction date (YYYY-MM-DD)")
    time: Optional[str] = Field(default=None, description="Transaction time (HH:MM)")
    category: str = Field(default="other", description="Inferred category (groceries, dining, supplies, travel, utilities, other)")
    payment_method: Optional[str] = Field(default=None, description="Payment method used (card, cash, apple_pay, transfer)")
    line_items: List[LineItem] = Field(default_factory=list, description="Parsed breakdown of receipt items")
    confidence_score: float = Field(default=1.0, description="Confidence score of OCR/AI extraction (0.0 to 1.0)")


class ExtractionResponse(BaseModel):
    success: bool = Field(..., description="True if extraction succeeded")
    data: Optional[FinancialVariables] = Field(default=None, description="Extracted financial data fields")
    message: str = Field(default="", description="Status or error message")
    processing_time_ms: float = Field(default=0.0, description="Processing duration in milliseconds")
