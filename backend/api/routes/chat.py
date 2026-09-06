"""POST /chat — RAG-powered Q&A on an uploaded document."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.database.models import Document
from backend.schemas.schemas import ChatRequest, ChatResponse
from backend.agents.rag_agent import RAGAgent
from backend.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)
_rag = RAGAgent()


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    """
    Answer a natural-language question about a specific document
    using the RAG pipeline (ChromaDB + Llama 3).
    """
    doc: Document | None = db.get(Document, payload.document_id)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document {payload.document_id} not found.",
        )

    logger.info(
        "Chat — document %d | question: %s", payload.document_id, payload.question[:80]
    )

    result = _rag.answer(
        document_id=payload.document_id,
        question=payload.question,
    )

    return ChatResponse(answer=result["answer"], sources=result["sources"])
