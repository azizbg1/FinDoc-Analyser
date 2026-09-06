"""SummaryAgent — generates a structured natural-language summary via Llama 3."""
from __future__ import annotations

from backend.services.llm_service import summarize_document
from backend.utils.logger import get_logger

logger = get_logger(__name__)


class SummaryAgent:
    """Calls the LLM to produce a human-readable summary of the document."""

    def run(self, state: dict) -> dict:
        """
        Expected keys in *state*:
          - raw_text (str)
          - document_type (str)

        Returns updated state with:
          - summary (str)
        """
        raw_text: str = state.get("raw_text", "")
        doc_type: str = state.get("document_type", "autre")
        logger.info("SummaryAgent — generating summary for document type: %s", doc_type)

        try:
            summary = summarize_document(raw_text, doc_type)
        except Exception as exc:
            logger.error("SummaryAgent — LLM call failed: %s", exc)
            summary = (
                "Résumé indisponible — le modèle LLM n'a pas pu être joint. "
                "Veuillez vérifier que Ollama est en cours d'exécution."
            )

        state["summary"] = summary
        logger.info("SummaryAgent — done (%d chars)", len(summary))
        return state
