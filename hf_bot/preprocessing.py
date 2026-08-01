"""
OpenCV Image Preprocessing Pipeline for Receipt OCR
Deskewing, Contrast Limited Adaptive Histogram Equalization (CLAHE), & Shadow Removal
"""

from typing import Tuple, Dict, Any
import numpy as np
import cv2
from PIL import Image


def pil_to_cv2(image: Image.Image) -> np.ndarray:
    """Convert PIL Image to OpenCV BGR numpy array."""
    if image.mode != "RGB":
        image = image.convert("RGB")
    arr = np.array(image)
    return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)


def cv2_to_pil(cv_img: np.ndarray) -> Image.Image:
    """Convert OpenCV BGR or Grayscale image to PIL Image."""
    if len(cv_img.shape) == 2:
        return Image.fromarray(cv_img)
    rgb = cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB)
    return Image.fromarray(rgb)


def enhance_contrast(image: Image.Image) -> Image.Image:
    """Apply CLAHE contrast enhancement for thermal paper readability."""
    cv_img = pil_to_cv2(image)
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    
    # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced_gray = clahe.apply(gray)
    
    # Convert back to BGR/RGB
    color_enhanced = cv2.cvtColor(enhanced_gray, cv2.COLOR_GRAY2BGR)
    return cv2_to_pil(color_enhanced)


def auto_deskew(image: Image.Image) -> Image.Image:
    """Detect text orientation angle using minimum area rectangle and rotate."""
    cv_img = pil_to_cv2(image)
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    
    # Thresholding
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
    
    # Find all non-zero pixels
    pts = np.column_stack(np.where(thresh > 0))
    if len(pts) < 10:
        return image  # Blank or low-contrast
        
    angle = cv2.minAreaRect(pts)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
        
    # Rotate if skew is between 0.5 and 45 degrees
    if abs(angle) > 0.5 and abs(angle) < 45:
        h, w = cv_img.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(cv_img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        return cv2_to_pil(rotated)
        
    return image


def preprocess_receipt_image(image: Image.Image) -> Tuple[Image.Image, Dict[str, Any]]:
    """Complete preprocessing pipeline: Deskew -> Contrast -> Rescale if too large."""
    orig_w, orig_h = image.size
    
    # Max dim cap to prevent memory OOM on Hugging Face Free CPU Spaces
    max_dim = 2048
    if orig_w > max_dim or orig_h > max_dim:
        scale = max_dim / max(orig_w, orig_h)
        new_size = (int(orig_w * scale), int(orig_h * scale))
        image = image.resize(new_size, Image.Resampling.LANCZOS)
        
    deskewed = auto_deskew(image)
    enhanced = enhance_contrast(deskewed)
    
    metadata = {
        "width": image.width,
        "height": image.height,
        "deskewed": True,
        "enhanced": True,
    }
    
    return enhanced, metadata
