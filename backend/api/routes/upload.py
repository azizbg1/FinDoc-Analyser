"""POST /upload — receive and persist a PDF file."""
from __future__ import annotations
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from backend.config import UPLOAD_DIR, MAX_FILE_SIZE_MB
from backend.database.connection import get_db
from backend.database.models import Document
from backend.schemas.schemas import DocumentOut
from backend.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

MAX_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


@router.post("/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> DocumentOut:
    """Upload a PDF document and persist its metadata to the database."""
    print(f"\n[Upload] === POST /api/upload ===")
    print(f"[Upload] FILE NAME = {file.filename}")

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted.",
        )

    # Read content and enforce size limit
    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {MAX_FILE_SIZE_MB} MB limit.",
        )

    # Save to disk with a unique name to avoid collisions
    unique_name = f"{uuid.uuid4().hex}_{file.filename}"
    save_path = UPLOAD_DIR / unique_name
    save_path.write_bytes(content)
    logger.info("File saved: %s", save_path)
    print(f"[Upload] File saved to: {save_path}")
    print(f"[Upload] File size: {len(content)} bytes")

    # Persist metadata
    doc = Document(filename=file.filename, file_path=str(save_path))
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return DocumentOut.model_validate(doc)
