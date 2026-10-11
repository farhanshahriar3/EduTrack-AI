from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.core.security import require_teacher_or_admin, get_current_active_user
from app.core.audit import log_audit_event
from app.models.user import User
from app.models.student import Student
from app.services.csv_service import CSVService

router = APIRouter(prefix="/exports", tags=["CSV Export"])

@router.get("/students")
def export_students_csv(
    search: Optional[str] = Query(None),
    department_id: Optional[int] = Query(None),
    semester: Optional[int] = Query(None),
    academic_status: Optional[str] = Query(None),
    current_user: User = Depends(require_teacher_or_admin),
    db: Session = Depends(get_db)
):
    """
    Exports filtered student directory records as a sanitized CSV file.
    All fields are defended against formula injection vulnerabilities.
    """
    query = db.query(Student).filter(Student.is_archived == False)

    if search:
        s_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Student.registration_id.ilike(s_term),
                Student.first_name.ilike(s_term),
                Student.last_name.ilike(s_term),
                Student.email.ilike(s_term)
            )
        )

    if department_id:
        query = query.filter(Student.department_id == department_id)
    if semester:
        query = query.filter(Student.current_semester == semester)
    if academic_status:
        query = query.filter(Student.academic_status == academic_status.upper())

    students = query.order_by(Student.registration_id.asc()).all()
    csv_content = CSVService.export_students_csv(students)

    log_audit_event(
        db=db,
        action="CSV_EXPORT",
        resource_type="student_export",
        resource_id=None,
        user_id=current_user.id,
        details={
            "exported_count": len(students),
            "filters": {
                "search": search,
                "department_id": department_id,
                "semester": semester,
                "status": academic_status
            }
        }
    )

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=edutrack_students_export.csv"}
    )
