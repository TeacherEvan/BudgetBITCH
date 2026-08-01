import pytest
import gradio as gr
from app import demo, process_receipt_gradio

def test_gradio_demo_blocks_instance():
    assert isinstance(demo, gr.Blocks)

def test_process_receipt_gradio_handles_none():
    json_out, html_out, csv_out = process_receipt_gradio(None)
    assert "No image provided" in json_out["message"]
    assert "Upload or take a photo" in html_out
    assert csv_out is None
