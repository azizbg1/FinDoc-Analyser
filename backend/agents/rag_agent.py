"""RAGAgent — indexes documents and answers user questions via retrieval-augmented generation."""
from __future__ import annotations

from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

from backend.services.vector_store import index_document, query_document
from backend.services.llm_service import get_llm
from backend.utils.logger import get_logger

logger = get_logger(__name__)

_RAG_PROMPT = PromptTemplate.from_template(
    """Tu es un assistant financier expert.
Utilise UNIQUEMENT les extraits de document suivants pour répondre à la question.
Si la réponse n'est pas dans les extraits, dis-le clairement.

Extraits pertinents :
{context}

Question : {question}

Réponse :"""
)


class RAGAgent:
    """
    Manages two operations:
      1. index(document_id, text) — embeds and stores a document.
      2. answer(document_id, question) — retrieves context and calls the LLM.
    """

    def index(self, document_id: int, text: str) -> int:
        """Index a document. Returns the number of chunks stored."""
        logger.info("RAGAgent — indexing document %d", document_id)
        n = index_document(document_id, text)
        logger.info("RAGAgent — %d chunks indexed for document %d", n, document_id)
        return n

    def answer(self, document_id: int, question: str) -> dict:
        """
        Retrieve relevant chunks and generate an answer.

        Returns:
          {
            "answer": str,
            "sources": list[str]  # the retrieved chunks used as context
          }
        """
        logger.info("RAGAgent — answering question for document %d", document_id)
        chunks = query_document(document_id, question, n_results=5)

        if not chunks:
            return {
                "answer": "Aucun contexte trouvé pour ce document. Veuillez relancer l'indexation.",
                "sources": [],
            }

        context = "\n\n---\n\n".join(chunks)
        chain = _RAG_PROMPT | get_llm() | StrOutputParser()

        try:
            answer = chain.invoke({"context": context, "question": question}).strip()
        except Exception as exc:
            logger.error("RAGAgent — LLM call failed: %s", exc)
            answer = "Erreur lors de la génération de la réponse. Vérifiez qu'Ollama est disponible."

        logger.info("RAGAgent — answer generated (%d chars)", len(answer))
        return {"answer": answer, "sources": chunks}

    def run(self, state: dict) -> dict:
        """
        Pipeline node: index the document so RAG queries are ready.
        Expected keys: document_id (int), raw_text (str).
        """
        document_id: int = state["document_id"]
        raw_text: str = state.get("raw_text", "")
        self.index(document_id, raw_text)
        state["rag_indexed"] = True
        return state
