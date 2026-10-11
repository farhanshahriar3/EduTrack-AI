from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_teacher_or_admin, get_current_active_user
from app.models.user import User
from app.models.student import Student
from app.schemas.ml import AcademicSupportInsightResponse, MLHealthResponse
from app.services.ml_service import MLService

router = APIRouter(prefix="/ml", tags=["ML Academic Support Intelligence"])

@router.get("/health", response_model=MLHealthResponse)
def get_ml_health_and_metrics(current_user: User = Depends(require_teacher_or_admin)):
    """Returns active model metadata, scikit-learn pipeline specifications, and baseline metrics."""
    metadata = MLService.get_metadata()
    return MLHealthResponse(
        status="HEALTHY",
        active_model="EduTrack Academic Support Risk Classifier",
        algorithm=metadata.get("algorithm", "LogisticRegression (scikit-learn with StandardScaler)"),
        version=metadata.get("model_version", "v1.2.0-lr"),
        metrics=metadata.get("test_metrics", {}),
        safeguards_active=True,
        description="Statistically grounded student support indicator designed solely to alert faculty for early advising."
    )

@router.get("/student-insights", response_model=List[AcademicSupportInsightResponse])
def get_all_student_insights(
    current_user: User = Depends(require_teacher_or_admin),
    db: Session = Depends(get_db)
):
    """
    Evaluates all active students and returns actionable indicators with contributing factors.
    Strictly isolated to authorized faculty and staff.
    """
    students = db.query(Student).filter(Student.is_archived == False).all()
    results = []
    
    for s in students:
        eval_res = MLService.evaluate_support_need(s, db)
        results.append(AcademicSupportInsightResponse(
            id=s.id,
            student_id=s.id,
            student_name=s.full_name,
            registration_id=s.registration_id,
            department_name=s.department.name if s.department else None,
            risk_level=eval_res["risk_level"],
            risk_score=eval_res["risk_score"],
            model_version=eval_res["model_version"],
            contributing_factors=eval_res["contributing_factors"],
            disclaimer=eval_res["disclaimer"],
            calculated_at=eval_res["calculated_at"]
        ))

    # Sort so students with highest risk appear first for advisors
    priority_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    results.sort(key=lambda x: (priority_order.get(x.risk_level, 3), -float(x.risk_score)))
    return results

@router.get("/student-insights/{student_id}", response_model=AcademicSupportInsightResponse)
def get_single_student_insight(
    student_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if current_user.role == "STUDENT":
        if not current_user.student_profile or current_user.student_profile.id != student_id:
            raise HTTPException(status_code=403, detail="Cannot access insights for other students")

    eval_res = MLService.evaluate_support_need(student, db)
    return AcademicSupportInsightResponse(
        id=student.id,
        student_id=student.id,
        student_name=student.full_name,
        registration_id=student.registration_id,
        department_name=student.department.name if student.department else None,
        risk_level=eval_res["risk_level"],
        risk_score=eval_res["risk_score"],
        model_version=eval_res["model_version"],
        contributing_factors=eval_res["contributing_factors"],
        disclaimer=eval_res["disclaimer"],
        calculated_at=eval_res["calculated_at"]
    )
