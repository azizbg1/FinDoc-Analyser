"""Pydantic schemas for request / response validation."""
from __future__ import annotations
import datetime
from typing import Any, Optional
from pydantic import BaseModel, EmailStr, Field


# ── User ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


# ── Document ──────────────────────────────────────────────────────────────────

class DocumentOut(BaseModel):
    id: int
    filename: str
    upload_date: datetime.datetime
    document_type: str

    model_config = {"from_attributes": True}


# ── Anomaly ───────────────────────────────────────────────────────────────────

class AnomalyItem(BaseModel):
    """
    Représente une anomalie détectée dans un document financier.

    severity : HIGH | MEDIUM | LOW
    type     : missing_field | total_inconsistency | line_total_error |
               negative_amount | zero_amount | missing_tva |
               total_less_than_subtotal | invoice_number_format |
               statistical_outlier
    """
    type: str
    message: str               # description lisible de l'anomalie
    severity: str = "MEDIUM"  # HIGH | MEDIUM | LOW
    value: Optional[Any] = None


# ── Analysis ──────────────────────────────────────────────────────────────────

class AnalysisResultOut(BaseModel):
    id: int
    document_id: int
    summary: Optional[str]
    anomalies: Optional[list[AnomalyItem]]
    risk_score: float
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class FullReportOut(BaseModel):
    document: DocumentOut
    analysis: Optional[AnalysisResultOut]


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    document_id: int
    question: str = Field(..., min_length=1)


class ChatResponse(BaseModel):
    answer: str
    sources: list[str] = []


# ── Analyze ───────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    document_id: int
