"""ExtractionAgent — extracts raw text from an uploaded PDF."""
from __future__ import annotations
from pathlib import Path

from backend.services.ocr_service import extract_text_from_pdf
from backend.utils.logger import get_logger

logger = get_logger(__name__)


class ExtractionAgent:
    """
    Receives a path to a PDF and returns the raw extracted text.
    Acts as the first node in the LangGraph pipeline.
    """

    def run(self, state: dict) -> dict:
        """
        Expected keys in *state*:
          - file_path (str | Path): path to the uploaded PDF.

        Returns updated state with:
          - raw_text (str): extracted text content.
        """
        file_path = Path(state["file_path"])
        logger.info("ExtractionAgent — processing: %s", file_path.name)

        if not file_path.exists():
            raise FileNotFoundError(f"PDF not found: {file_path}")

        raw_text = extract_text_from_pdf(file_path)

        if not raw_text.strip():
            logger.warning("ExtractionAgent — no text extracted from %s", file_path.name)

        state["raw_text"] = raw_text
        logger.info(
            "ExtractionAgent — done (%d chars extracted)", len(raw_text)
        )
        return state
