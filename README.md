---
title: International Receipt OCR & Financial Data Extraction Bot
emoji: 🧾
colorFrom: amber
colorTo: slate
sdk: gradio
sdk_version: 4.44.0
app_file: app.py
pinned: false
license: mit
short_description: Multi-currency receipt scanner & financial field extractor for Budget Boss
---

# International Receipt OCR & Financial Data Extraction Bot (`EvilEvan`)

An advanced, AI-powered receipt scanning and financial data extraction service optimized for Hugging Face Spaces.

## Features
- **Multi-Currency & International Symbol Recognition**: Supports USD (`$`), EUR (`€`), GBP (`£`), ZAR (`R`), JPY (`¥`), CAD (`$`), AUD (`$`), SGD (`$`), INR (`₹`), PHP (`₱`), CHF (`CHF`), etc.
- **Hybrid VLM + OCR Architecture**: Uses Transformer Vision-Language Models (`Donut`) with fallback to `EasyOCR` + Pydantic NLP field parsing.
- **Image Preprocessing Pipeline**: Automatic deskewing, orientation correction, CLAHE contrast enhancement, and shadow removal using OpenCV.
- **Structured Financial Extraction**: Extracts `merchant_name`, `total_amount`, `tax_amount`, `subtotal_amount`, `currency`, `date`, `time`, `category`, `payment_method`, and `line_items`.
- **Dual Mode**: Interactive Gradio Web UI + REST API endpoints.

## Local Running
```bash
pip install -r requirements.txt
python app.py
```

## Running Tests
```bash
pytest tests/python
```

## Deploying to Hugging Face
Set your `HF_TOKEN` environment variable and run:
```bash
python scripts/deploy_to_hf.py --username EvilEvan --space receipt-ocr-bot
```
