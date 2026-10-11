from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_active_user, require_teacher_or_admin
from app.core.audit import log_audit_event
from app.models.user import User
from app.models.academic import Grade, Enrollment, Course
from app.models.student import Student
from app.schemas.academic import GradeCreate, GradeUpdate, GradeResponse
from app.services.gpa_calculator import GPACalculator

router = APIRouter(prefix="/grades", tags=["Grades & Assessment"])

@router.post("", response_model=GradeResponse, status_code=status.HTTP_201_CREATED)
def record_grade(
    grade_in: GradeCreate,
    current_user: User = Depends(require_teacher_or_admin),
    db: Session = Depends(get_db)
):
    enr = db.query(Enrollment).filter(Enrollment.id == grade_in.enrollment_id).first()
    if not enr:
        raise HTTPException(status_code=404, detail="Enrollment record not found")

    if enr.grade:
        raise HTTPException(
            status_code=400,
            detail=f"Grade already recorded for this enrollment (Grade ID: {enr.grade.id}). Use PATCH to modify."
        )

    policy = GPACalculator.get_active_policy(db)

    # Determine letter grade and points
    if grade_in.letter_grade and grade_in.grade_points is not None:
        letter = grade_in.letter_grade.upper()
        points = grade_in.grade_points
        passed = grade_in.is_passed if grade_in.is_passed is not None else (points >= policy.pass_min_points)
    else:
        letter, points, passed = GPACalculator.score_to_grade_points(grade_in.numeric_score, policy)

    grade = Grade(
        enrollment_id=enr.id,
        letter_grade=letter,
        numeric_score=grade_in.numeric_score,
        grade_points=points,
        is_passed=passed,
        counts_in_gpa=grade_in.counts_in_gpa,
        graded_by_user_id=current_user.id
    )
    db.add(grade)
    enr.status = "COMPLETED"
    db.commit()
    db.refresh(grade)

    # Recalculate student GPA and completion credits
    GPACalculator.update_student_academic_summary(enr.student_id, db)

    log_audit_event(
        db=db,
        action="GRADE_RECORD",
        resource_type="grade",
        resource_id=str(grade.id),
        user_id=current_user.id,
        details={
            "student_id": enr.student_id,
            "course_id": enr.course_id,
            "letter_grade": letter,
            "numeric_score": float(grade_in.numeric_score),
            "grade_points": float(points)
        }
    )

    return grade

@router.patch("/{grade_id}", response_model=GradeResponse)
def update_grade(
    grade_id: int,
    grade_update: GradeUpdate,
    current_user: User = Depends(require_teacher_or_admin),
    db: Session = Depends(get_db)
):
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(status_code=404, detail="Grade record not found")

    policy = GPACalculator.get_active_policy(db)
    update_data = grade_update.model_dump(exclude_unset=True)

    if "numeric_score" in update_data and "letter_grade" not in update_data:
        letter, points, passed = GPACalculator.score_to_grade_points(update_data["numeric_score"], policy)
        grade.letter_grade = letter
        grade.grade_points = points
        grade.is_passed = passed

    for k, v in update_data.items():
        setattr(grade, k, v)

    grade.graded_by_user_id = current_user.id
    db.commit()
    db.refresh(grade)

    # Recalculate student GPA
    if grade.enrollment:
        GPACalculator.update_student_academic_summary(grade.enrollment.student_id, db)

    log_audit_event(
        db=db,
        action="GRADE_UPDATE",
        resource_type="grade",
        resource_id=str(grade.id),
        user_id=current_user.id,
        details=update_data
    )

    return grade
