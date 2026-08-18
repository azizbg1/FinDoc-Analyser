"""LLM service — thin wrapper around LangChain + Ollama."""
from __future__ import annotations

from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

from backend.config import OLLAMA_BASE_URL, OLLAMA_MODEL
from backend.utils.logger import get_logger

logger = get_logger(__name__)

_llm: OllamaLLM | None = None


def get_llm() -> OllamaLLM:
    global _llm
    if _llm is None:
        _llm = OllamaLLM(
            base_url=OLLAMA_BASE_URL,
            model=OLLAMA_MODEL,
            temperature=0.1,
        )
        logger.info("LLM initialised: %s @ %s", OLLAMA_MODEL, OLLAMA_BASE_URL)
    return _llm


def classify_with_llm(text: str, keyword_hint: str) -> str:
    """
    Ask Llama 3 to confirm / refine the document type.
    keyword_hint is the preliminary result from NLP.
    """
    prompt = PromptTemplate.from_template(
        """Tu es un expert en documents financiers.
Voici un extrait du document (500 premiers caractères) :

{text}

La classification préliminaire est : {hint}

Réponds UNIQUEMENT avec un de ces mots (sans explication) :
facture | reçu | bon de commande | rapport financier | autre"""
    )
    chain = prompt | get_llm() | StrOutputParser()
    result = chain.invoke({"text": text[:500], "hint": keyword_hint}).strip().lower()
    logger.info("LLM classification result: %s", result)
    valid = {"facture", "reçu", "bon de commande", "rapport financier", "autre"}
    return result if result in valid else keyword_hint


def summarize_document(text: str, doc_type: str) -> str:
    """Generate a structured summary of the financial document."""
    prompt = PromptTemplate.from_template(
        """Tu es un assistant financier expert.
Voici un document de type « {doc_type} » :

{text}

Génère un résumé structuré en français contenant :
1. Type et objet du document
2. Parties impliquées (émetteur, destinataire)
3. Montants clés et dates importantes
4. Points d'attention éventuels

Résumé :"""
    )
    chain = prompt | get_llm() | StrOutputParser()
    summary = chain.invoke({"text": text[:3000], "doc_type": doc_type})
    logger.info("Summary generated (%d chars)", len(summary))
    return summary.strip()
