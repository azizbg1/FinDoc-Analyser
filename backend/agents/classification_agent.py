"""ClassificationAgent — identifies the type of financial document."""
from __future__ import annotations

from backend.services.nlp_service import classify_document_type
from backend.services.llm_service import classify_with_llm
from backend.utils.logger import get_logger

logger = get_logger(__name__)

VALID_TYPES = {"facture", "reçu", "bon de commande", "rapport financier", "autre"}


class ClassificationAgent:
    """
    Uses keyword-based NLP as a fast first pass,
    then asks Llama 3 to confirm / refine the result.
    """

    def run(self, state: dict) -> dict:
        """
        Expected keys in *state*:
          - raw_text (str)

        Returns updated state with:
          - document_type (str)
        """
        raw_text: str = state.get("raw_text", "")
        logger.info("ClassificationAgent — analysing document type")

        # 1. Fast keyword heuristic
        keyword_type = classify_document_type(raw_text)
        logger.debug("Keyword classification: %s", keyword_type)

        # 2. LLM confirmation
        try:
            llm_type = classify_with_llm(raw_text, keyword_type)
        except Exception as exc:
            logger.warning("LLM classification failed (%s) — using keyword result", exc)
            llm_type = keyword_type

        document_type = llm_type if llm_type in VALID_TYPES else keyword_type
        state["document_type"] = document_type
        logger.info("ClassificationAgent — document type: %s", document_type)
        return state
