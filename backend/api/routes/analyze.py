"""POST /analyze — trigger the full multi-agent analysis pipeline."""
from __future__ import annotations
import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.database.models import Document, AnalysisResult
from backend.schemas.schemas import AnalyzeRequest, AnalysisResultOut
from backend.agents.orchestrator_agent import OrchestratorAgent
from backend.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)
_orchestrator = OrchestratorAgent()


@router.post("/analyze", response_model=AnalysisResultOut, status_code=status.HTTP_200_OK)
def analyze_document(
    payload: AnalyzeRequest,
    db: Session = Depends(get_db),
) -> AnalysisResultOut:
    """Run the full multi-agent pipeline on an already-uploaded document."""
    doc: Document | None = db.get(Document, payload.document_id)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document {payload.document_id} not found.",
        )

    logger.info("Starting analysis for document %d (%s)", doc.id, doc.filename)
    print(f"\n[Analyze] === New analysis request ===")
    print(f"[Analyze] Current document id  : {doc.id}")
    print(f"[Analyze] Current document name: {doc.filename}")
    print(f"[Analyze] File path            : {doc.file_path}")

    try:
        result = _orchestrator.run(
            file_path=str(doc.file_path),
            document_id=doc.id,
        )
    except Exception as exc:
        logger.exception("Pipeline failed for document %d", doc.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis pipeline error: {exc}",
        ) from exc

    # Persist / update the extracted text and document type
    doc.raw_text = result.get("raw_text", "")
    doc.document_type = result.get("document_type", "autre")

    report = result.get("report", {})

    # Upsert AnalysisResult
    existing: AnalysisResult | None = (
        db.query(AnalysisResult).filter_by(document_id=doc.id).first()
    )
    if existing:
        analysis = existing
    else:
        analysis = AnalysisResult(document_id=doc.id)
        db.add(analysis)

    analysis.summary = report.get("summary", "")
    analysis.anomalies = report.get("anomalies_detectees", [])
    analysis.risk_score = report.get("score_risque", 0.0)

    db.commit()
    db.refresh(analysis)

    logger.info(
        "Analysis complete for document %d — risk_score=%.4f", doc.id, analysis.risk_score
    )
    print(f"[Analyze] Result — document_id={doc.id}, risk_score={analysis.risk_score:.4f}, anomalies={len(analysis.anomalies or [])}")
    return AnalysisResultOut.model_validate(analysis)
