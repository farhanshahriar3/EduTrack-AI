from typing import Dict, Any, List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_admin
from app.core.audit import log_audit_event
from app.models.user import User
from app.services.csv_service import CSVService

router = APIRouter(prefix="/imports", tags=["CSV Import"])

@router.post("/preview")
async def preview_csv_upload(
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Parses and thoroughly validates an uploaded CSV file.
    Returns preview of first records, detected validation errors, and overall import statistics.
    Does not commit to the database until user confirms.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported")

    content_bytes = await file.read()
    try:
        content_str = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        try:
            content_str = content_bytes.decode("latin-1")
        except Exception:
            raise HTTPException(status_code=400, detail="Unable to decode CSV file format")

    results = CSVService.preview_and_validate_csv(content_str, db, max_preview_rows=10)
    return results

@router.post("/confirm")
def confirm_csv_import(
    records: List[Dict[str, Any]] = Body(..., embed=True),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Commits pre-validated CSV student records into the database within an ACID transaction.
    """
    if not records:
        raise HTTPException(status_code=400, detail="No validated records provided for import")

    imported_count = CSVService.execute_import(records, db)

    log_audit_event(
        db=db,
        action="CSV_IMPORT_CONFIRM",
        resource_type="student_import",
        resource_id=None,
        user_id=current_user.id,
        details={"records_imported": imported_count}
    )

    return {
        "success": True,
        "message": f"Successfully imported {imported_count} student records",
        "imported_count": imported_count
    }
