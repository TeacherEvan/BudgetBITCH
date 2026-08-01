"""
Hugging Face Space Entrypoint: International Receipt OCR & Financial Data Extraction Bot
Author: EvilEvan
Space: EvilEvan/receipt-ocr-bot
"""

import os
import tempfile
import csv
from typing import Tuple, Optional, Dict, Any
from PIL import Image
import gradio as gr

from hf_bot.engine import ReceiptExtractionEngine

# Initialize extraction engine
engine = ReceiptExtractionEngine(use_vlm=False)


def process_receipt_gradio(image: Optional[Image.Image]) -> Tuple[Dict[str, Any], str, Optional[str]]:
    """Gradio handler for receipt scanning & extraction."""
    if image is None:
        return (
            {"success": False, "message": "No image provided"},
            "<div style='color: #f87171; padding: 10px;'>Upload or take a photo of a receipt to begin.</div>",
            None
        )

    response = engine.extract(image)
    if not response.success or response.data is None:
        return (
            response.model_dump(),
            f"<div style='color: #f87171; padding: 10px;'>Extraction failed: {response.message}</div>",
            None
        )

    data = response.data
    
    # Generate HTML Card Preview
    html_card = f"""
    <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(251, 191, 36, 0.3); padding: 16px; border-radius: 16px; color: white;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #fbbf24; letter-spacing: 1px;">🧾 Extracted Receipt</span>
            <span style="font-size: 10px; background: rgba(52, 211, 153, 0.2); color: #34d399; padding: 2px 8px; border-radius: 12px; font-weight: bold; text-transform: uppercase;">
                {data.category}
            </span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 13px;">
            <div style="background: rgba(0, 0, 0, 0.3); padding: 8px; border-radius: 8px;">
                <span style="font-size: 10px; color: rgba(255,255,255,0.5); display: block;">Store / Merchant</span>
                <strong>{data.merchant_name}</strong>
            </div>
            <div style="background: rgba(0, 0, 0, 0.3); padding: 8px; border-radius: 8px;">
                <span style="font-size: 10px; color: rgba(255,255,255,0.5); display: block;">Total Amount</span>
                <strong style="color: #fbbf24; font-size: 15px;">{data.currency_symbol}{data.total_amount:.2f} ({data.currency})</strong>
            </div>
            <div style="background: rgba(0, 0, 0, 0.3); padding: 8px; border-radius: 8px;">
                <span style="font-size: 10px; color: rgba(255,255,255,0.5); display: block;">Pre-tax Subtotal</span>
                <span>{data.currency_symbol}{data.subtotal_amount:.2f}</span>
            </div>
            <div style="background: rgba(0, 0, 0, 0.3); padding: 8px; border-radius: 8px;">
                <span style="font-size: 10px; color: rgba(255,255,255,0.5); display: block;">Tax / VAT</span>
                <span>{data.currency_symbol}{data.tax_amount:.2f}</span>
            </div>
            <div style="background: rgba(0, 0, 0, 0.3); padding: 8px; border-radius: 8px;">
                <span style="font-size: 10px; color: rgba(255,255,255,0.5); display: block;">Date</span>
                <span>{data.date or 'N/A'}</span>
            </div>
            <div style="background: rgba(0, 0, 0, 0.3); padding: 8px; border-radius: 8px;">
                <span style="font-size: 10px; color: rgba(255,255,255,0.5); display: block;">Confidence Score</span>
                <span style="color: #34d399;">{int(data.confidence_score * 100)}%</span>
            </div>
        </div>
    </div>
    """

    # Generate CSV file export
    temp_dir = tempfile.gettempdir()
    csv_path = os.path.join(temp_dir, "receipt_export.csv")
    with open(csv_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Merchant", "Total Amount", "Currency", "Tax", "Date", "Category", "Payment Method"])
        writer.writerow([
            data.merchant_name,
            data.total_amount,
            data.currency,
            data.tax_amount or 0.0,
            data.date or "",
            data.category,
            data.payment_method or ""
        ])

    return response.model_dump(), html_card, csv_path


# Gradio UI Blocks
theme = gr.themes.Soft(
    primary_hue="amber",
    neutral_hue="slate",
).set(
    body_background_fill="*neutral_950",
    body_text_color="*neutral_50",
)

with gr.Blocks(theme=theme, title="International Receipt OCR & Financial Bot") as demo:
    gr.Markdown(
        """
        # 🧾 International Receipt OCR & Financial Data Extraction Bot
        ### Hugging Face Space by **EvilEvan** (`EvilEvan/receipt-ocr-bot`)
        Upload or take a photo of any receipt (USD `$`, EUR `€`, GBP `£`, ZAR `R`, JPY `¥`, CAD `$`, etc.) to automatically scan and extract financial variables into structured JSON & CSV formats.
        """
    )
    
    with gr.Row():
        with gr.Column(scale=1):
            image_input = gr.Image(type="pil", label="📷 Upload Receipt / Take Photo", sources=["upload", "clipboard", "webcam"])
            extract_btn = gr.Button("⚡ Scan & Extract Financial Variables", variant="primary")
            
        with gr.Column(scale=1):
            html_output = gr.HTML(label="Visual Summary Card")
            json_output = gr.JSON(label="Structured Financial Variables (JSON)")
            csv_output = gr.File(label="📥 Download CSV Ledger")

    extract_btn.click(
        fn=process_receipt_gradio,
        inputs=[image_input],
        outputs=[json_output, html_output, csv_output]
    )

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
