import pytest
import numpy as np
from PIL import Image
from hf_bot.preprocessing import preprocess_receipt_image, auto_deskew, enhance_contrast

def test_enhance_contrast():
    # Create synthetic noisy low-contrast image
    arr = np.random.randint(100, 150, (100, 100, 3), dtype=np.uint8)
    pil_img = Image.fromarray(arr)
    enhanced = enhance_contrast(pil_img)
    assert isinstance(enhanced, Image.Image)
    assert enhanced.size == (100, 100)

def test_auto_deskew():
    arr = np.zeros((100, 100, 3), dtype=np.uint8)
    pil_img = Image.fromarray(arr)
    deskewed = auto_deskew(pil_img)
    assert isinstance(deskewed, Image.Image)
    assert deskewed.size == (100, 100)

def test_preprocess_receipt_image():
    arr = np.full((200, 200, 3), 200, dtype=np.uint8)
    pil_img = Image.fromarray(arr)
    processed, metadata = preprocess_receipt_image(pil_img)
    assert isinstance(processed, Image.Image)
    assert "width" in metadata
    assert "height" in metadata
    assert metadata["width"] == 200
    assert metadata["height"] == 200
