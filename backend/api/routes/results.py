"""GET /results/{id} — retrieve the full analysis report for a document."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.database.models import Document, AnalysisResult
from backend.schemas.schemas import DocumentOut, AnalysisResultOut, FullReportOut
from backend.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("/results/{document_id}", response_model=FullReportOut)
def get_results(document_id: int, db: Session = Depends(get_db)) -> FullReportOut:
    """Return the document metadata and its latest analysis result."""
    doc: Document | None = db.get(Document, document_id)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document {document_id} not found.",
        )

    analysis: AnalysisResult | None = (
        db.query(AnalysisResult).filter_by(document_id=document_id).first()
    )

    return FullReportOut(
        document=DocumentOut.model_validate(doc),
        analysis=AnalysisResultOut.model_validate(analysis) if analysis else None,
    )


@router.get("/documents", response_model=list[DocumentOut])
def list_documents(
    skip: int = 0, limit: int = 20, db: Session = Depends(get_db)
) -> list[DocumentOut]:
    """Return a paginated list of all uploaded documents (for the history page)."""
    docs = db.query(Document).offset(skip).limit(limit).all()
    return [DocumentOut.model_validate(d) for d in docs]
