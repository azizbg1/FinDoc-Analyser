"""NLP service using spaCy for entity extraction and document classification hints."""
from __future__ import annotations
import re
from typing import Any

import spacy
from spacy.language import Language

from backend.utils.logger import get_logger

logger = get_logger(__name__)

# Try to load French model, fall back to multilingual
_nlp: Language | None = None


def _get_nlp() -> Language:
    global _nlp
    if _nlp is None:
        for model in ("fr_core_news_md", "fr_core_news_sm", "xx_ent_wiki_sm"):
            try:
                _nlp = spacy.load(model)
                logger.info("spaCy model loaded: %s", model)
                break
            except OSError:
                continue
        if _nlp is None:
            # Last resort: blank French model
            _nlp = spacy.blank("fr")
            logger.warning("No trained spaCy model found — using blank pipeline")
    return _nlp


# ── Keyword-based classification helpers ──────────────────────────────────────

_DOCUMENT_KEYWORDS: dict[str, list[str]] = {
    "facture": [
        "facture", "invoice", "numéro de facture", "date de facture",
        "montant ttc", "tva", "total ht", "échéance", "réf. facture",
    ],
    "reçu": [
        "reçu", "receipt", "ticket de caisse", "paiement reçu",
        "acquitté", "encaissement", "caisse",
    ],
    "bon de commande": [
        "bon de commande", "purchase order", "commande n°", "ordre d'achat",
        "référence commande", "bon d'achat",
    ],
    "rapport financier": [
        "rapport financier", "bilan", "compte de résultat", "flux de trésorerie",
        "rapport annuel", "états financiers", "financial report", "bilan comptable",
        "soldes intermédiaires",
    ],
}


def classify_document_type(text: str) -> str:
    """
    Return the most likely document type based on keyword frequency.
    Falls back to 'autre' when no strong match is found.
    """
    text_lower = text.lower()
    scores: dict[str, int] = {dtype: 0 for dtype in _DOCUMENT_KEYWORDS}

    for dtype, keywords in _DOCUMENT_KEYWORDS.items():
        for kw in keywords:
            scores[dtype] += text_lower.count(kw)

    best_type, best_score = max(scores.items(), key=lambda x: x[1])
    logger.debug("Classification scores: %s", scores)

    return best_type if best_score > 0 else "autre"


def extract_entities(text: str) -> dict[str, list[str]]:
    """Extract named entities and financial patterns from the text."""
    nlp = _get_nlp()
    doc = nlp(text[:100_000])  # spaCy max ~1M chars but keep it reasonable

    entities: dict[str, list[str]] = {
        "organisations": [],
        "personnes": [],
        "lieux": [],
        "dates": [],
        "montants": [],
    }

    for ent in doc.ents:
        label = ent.label_
        val = ent.text.strip()
        if label in ("ORG",):
            entities["organisations"].append(val)
        elif label in ("PER", "PERSON"):
            entities["personnes"].append(val)
        elif label in ("LOC", "GPE"):
            entities["lieux"].append(val)
        elif label in ("DATE", "TIME"):
            entities["dates"].append(val)
        elif label in ("MONEY", "CARDINAL"):
            entities["montants"].append(val)

    # Regex-based amount extraction (catches formats like "1 234,56 €")
    amount_pattern = re.compile(
        r"\b\d{1,3}(?:[\s.]\d{3})*(?:[,\.]\d{1,2})?\s*(?:€|EUR|DT|USD)?\b"
    )
    regex_amounts = amount_pattern.findall(text)
    entities["montants"].extend(regex_amounts)

    # Deduplicate
    for key in entities:
        entities[key] = list(dict.fromkeys(entities[key]))

    return entities


def extract_financial_values(text: str) -> list[float]:
    """
    Parse all numeric / monetary values from the text as floats.
    Used by anomaly detection.
    """
    # Match numbers with optional thousands separator and decimal
    pattern = re.compile(r"\b(\d{1,3}(?:[\s.]\d{3})*(?:[,]\d{1,2})?)\b")
    values: list[float] = []
    for match in pattern.finditer(text):
        raw = match.group(1).replace(" ", "").replace(".", "").replace(",", ".")
        try:
            values.append(float(raw))
        except ValueError:
            continue
    return values
