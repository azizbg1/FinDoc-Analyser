"""OCR service using PaddleOCR to extract text from PDF/image files."""
from __future__ import annotations
import io
from pathlib import Path
from typing import Union

from paddleocr import PaddleOCR
import fitz  # PyMuPDF

from backend.utils.logger import get_logger

logger = get_logger(__name__)

# PaddleOCR is initialised once and reused (expensive constructor)
_ocr: PaddleOCR | None = None


def _get_ocr() -> PaddleOCR:
    global _ocr
    if _ocr is None:
        _ocr = PaddleOCR(use_angle_cls=True, lang="fr", show_log=False)
    return _ocr


def _pdf_to_images(pdf_path: Union[str, Path]) -> list[bytes]:
    """Render each PDF page as a PNG byte string."""
    doc = fitz.open(str(pdf_path))
    images: list[bytes] = []
    for page in doc:
        pix = page.get_pixmap(dpi=200)
        images.append(pix.tobytes("png"))
    doc.close()
    return images


def extract_text_from_pdf(pdf_path: Union[str, Path]) -> str:
    """
    Extract full text from a PDF file.

    Tries native text extraction first (fast).
    Falls back to PaddleOCR for scanned / image-only PDFs.
    """
    pdf_path = Path(pdf_path)
    logger.info("Extracting text from %s", pdf_path.name)
    print(f"\n[OCR] === extract_text_from_pdf ===")
    print(f"[OCR] FILE NAME = {pdf_path.name}")
    print(f"[OCR] Full path = {pdf_path}")

    # 1. Native text extraction via PyMuPDF
    doc = fitz.open(str(pdf_path))
    native_text = "\n".join(page.get_text() for page in doc).strip()
    doc.close()

    if len(native_text) > 50:
        logger.info("Native extraction succeeded (%d chars)", len(native_text))
        print(f"[OCR] Method = native PyMuPDF ({len(native_text)} chars)")
        print(f"[OCR] OCR TEXT =")
        print(native_text[:2000])  # Print first 2000 chars to avoid flooding logs
        if len(native_text) > 2000:
            print(f"[OCR] ... (truncated, total {len(native_text)} chars)")
        return native_text

    # 2. OCR fallback
    logger.info("Native text too short — switching to PaddleOCR")
    print(f"[OCR] Method = PaddleOCR (native text too short: {len(native_text)} chars)")
    ocr = _get_ocr()
    page_images = _pdf_to_images(pdf_path)
    lines: list[str] = []

    for idx, img_bytes in enumerate(page_images):
        result = ocr.ocr(img_bytes, cls=True)
        if result and result[0]:
            page_lines = [line[1][0] for line in result[0] if line and line[1]]
            lines.extend(page_lines)
        logger.debug("Page %d: %d lines extracted", idx + 1, len(page_lines) if result else 0)

    extracted = "\n".join(lines).strip()
    logger.info("OCR extraction completed (%d chars)", len(extracted))
    print(f"[OCR] OCR TEXT =")
    print(extracted[:2000])
    if len(extracted) > 2000:
        print(f"[OCR] ... (truncated, total {len(extracted)} chars)")
    return extracted
