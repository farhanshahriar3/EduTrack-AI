from typing import Optional, List
from math import ceil
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.core.database import get_db
from app.core.security import (
    get_current_active_user,
    require_admin,
    require_teacher_or_admin,
    get_password_hash
)
from app.core.audit import log_audit_event
from app.models.user import User
from app.models.student import Student
from app.models.department import Department
from app.models.academic import Enrollment, AcademicTerm, Grade, Course
from app.schemas.student import (
    StudentCreate,
    StudentUpdate,
    StudentResponse,
    StudentDetailResponse,
    PaginatedStudentResponse,
    SemesterSummary
)
from app.schemas.academic import EnrollmentResponse, GradeResponse
from app.services.gpa_calculator import GPACalculator
from app.services.ml_service import MLService

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("", response_model=PaginatedStudentResponse)
def list_students(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by name or registration ID"),
    department_id: Optional[int] = Query(None),
    semester: Optional[int] = Query(None, ge=1, le=12),
    academic_status: Optional[str] = Query(None),
    sort_by: str = Query("created_at", pattern="^(name|registration_id|cumulative_gpa|enrollment_date|created_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    include_archived: bool = Query(False),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Student)

    # Privacy Enforcement: Students can ONLY see their own profile
    if current_user.role == "STUDENT":
        if not current_user.student_profile:
            return PaginatedStudentResponse(items=[], total=0, page=page, page_size=page_size, total_pages=0)
        query = query.filter(Student.id == current_user.student_profile.id)
    else:
        if not include_archived:
            query = query.filter(Student.is_archived == False)

    # Search filter
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

    # Specific filters
    if department_id:
        query = query.filter(Student.department_id == department_id)
    if semester:
        query = query.filter(Student.current_semester == semester)
    if academic_status:
        query = query.filter(Student.academic_status == academic_status.upper())

    # Sorting
    sort_col = Student.created_at
    if sort_by == "name":
        sort_col = Student.first_name
    elif sort_by == "registration_id":
        sort_col = Student.registration_id
    elif sort_by == "cumulative_gpa":
        sort_col = Student.cumulative_gpa
    elif sort_by == "enrollment_date":
        sort_col = Student.enrollment_date

    query = query.order_by(desc(sort_col) if sort_order == "desc" else asc(sort_col))

    total = query.count()
    items_raw = query.offset((page - 1) * page_size).limit(page_size).all()

    # Map department fields
    items = []
    for s in items_raw:
        item_dict = {
            "id": s.id,
            "user_id": s.user_id,
            "registration_id": s.registration_id,
            "first_name": s.first_name,
            "last_name": s.last_name,
            "email": s.email,
            "phone": s.phone,
            "department_id": s.department_id,
            "department_name": s.department.name if s.department else None,
            "department_code": s.department.code if s.department else None,
            "enrollment_date": s.enrollment_date,
            "current_semester": s.current_semester,
            "academic_status": s.academic_status,
            "cumulative_gpa": s.cumulative_gpa,
            "completed_credits": s.completed_credits,
            "is_archived": s.is_archived,
            "created_at": s.created_at,
            "updated_at": s.updated_at
        }
        items.append(StudentResponse(**item_dict))

    return PaginatedStudentResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 0
    )

@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    student_in: StudentCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Duplicate registration ID check
    if db.query(Student).filter(Student.registration_id == student_in.registration_id).first():
        raise HTTPException(status_code=400, detail=f"Registration ID '{student_in.registration_id}' already exists")

    # Duplicate email check
    if db.query(Student).filter(Student.email == student_in.email).first():
        raise HTTPException(status_code=400, detail=f"Email '{student_in.email}' is already registered to a student")

    # Validate department
    dept = db.query(Department).filter(Department.id == student_in.department_id).first()
    if not dept:
        raise HTTPException(status_code=400, detail="Specified department does not exist")

    # Optional student user login creation
    linked_user_id = student_in.user_id
    if student_in.create_user_account and not linked_user_id:
        existing_user = db.query(User).filter(User.email == student_in.email).first()
        if existing_user:
            linked_user_id = existing_user.id
        else:
            default_pwd = student_in.password or "Student@2026"
            new_user = User(
                email=student_in.email,
                hashed_password=get_password_hash(default_pwd),
                full_name=f"{student_in.first_name} {student_in.last_name}",
                role="STUDENT",
                is_active=True
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            linked_user_id = new_user.id

    student = Student(
        registration_id=student_in.registration_id,
        first_name=student_in.first_name,
        last_name=student_in.last_name,
        email=student_in.email,
        phone=student_in.phone,
        department_id=student_in.department_id,
        enrollment_date=student_in.enrollment_date,
        current_semester=student_in.current_semester,
        academic_status=student_in.academic_status,
        user_id=linked_user_id,
        cumulative_gpa=Decimal("0.00"),
        completed_credits=0,
        is_archived=False
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    log_audit_event(
        db=db,
        action="STUDENT_CREATE",
        resource_type="student",
        resource_id=str(student.id),
        user_id=current_user.id,
        details={"registration_id": student.registration_id, "name": student.full_name}
    )

    return StudentResponse(
        id=student.id,
        user_id=student.user_id,
        registration_id=student.registration_id,
        first_name=student.first_name,
        last_name=student.last_name,
        email=student.email,
        phone=student.phone,
        department_id=student.department_id,
        department_name=dept.name,
        department_code=dept.code,
        enrollment_date=student.enrollment_date,
        current_semester=student.current_semester,
        academic_status=student.academic_status,
        cumulative_gpa=student.cumulative_gpa,
        completed_credits=student.completed_credits,
        is_archived=student.is_archived,
        created_at=student.created_at,
        updated_at=student.updated_at
    )

@router.get("/{student_id}", response_model=StudentDetailResponse)
def get_student_details(
    student_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Enforce Student Role Isolation
    if current_user.role == "STUDENT":
        if not current_user.student_profile or current_user.student_profile.id != student_id:
            raise HTTPException(status_code=403, detail="Access denied: Cannot access records of other students")

    # Calculate semester-by-semester summaries
    enrollments_query = (
        db.query(Enrollment)
        .filter(Enrollment.student_id == student_id)
        .join(AcademicTerm, AcademicTerm.id == Enrollment.term_id)
        .order_by(AcademicTerm.start_date.asc())
        .all()
    )

    enrollment_responses = []
    term_groups = {}

    for enr in enrollments_query:
        grade_resp = None
        if enr.grade:
            grade_resp = GradeResponse.model_validate(enr.grade)

        enr_resp = EnrollmentResponse(
            id=enr.id,
            student_id=enr.student_id,
            course_id=enr.course_id,
            term_id=enr.term_id,
            status=enr.status,
            course_code=enr.course.code if enr.course else None,
            course_title=enr.course.title if enr.course else None,
            credits=enr.course.credits if enr.course else None,
            term_code=enr.term.code if enr.term else None,
            student_name=student.full_name,
            registration_id=student.registration_id,
            grade=grade_resp,
            created_at=enr.created_at,
            updated_at=enr.updated_at
        )
        enrollment_responses.append(enr_resp)

        # Group for semester history
        term_id = enr.term_id
        if term_id not in term_groups:
            term_groups[term_id] = {
                "term_code": enr.term.code,
                "term_name": enr.term.name,
                "total_points": Decimal("0.0"),
                "total_credits": Decimal("0.0"),
                "courses_count": 0
            }
        term_groups[term_id]["courses_count"] += 1
        if enr.grade and enr.grade.counts_in_gpa and enr.course:
            cr = Decimal(str(enr.course.credits))
            gp = Decimal(str(enr.grade.grade_points))
            term_groups[term_id]["total_points"] += gp * cr
            term_groups[term_id]["total_credits"] += cr

    semester_history = []
    for tg in term_groups.values():
        if tg["total_credits"] > Decimal("0.0"):
            t_gpa = round(tg["total_points"] / tg["total_credits"], 2)
        else:
            t_gpa = Decimal("0.00")
        semester_history.append(SemesterSummary(
            term_code=tg["term_code"],
            term_name=tg["term_name"],
            term_gpa=t_gpa,
            term_credits=tg["total_credits"],
            courses_count=tg["courses_count"]
        ))

    # Academic support summary
    support_summary = None
    if current_user.role in ("ADMIN", "TEACHER"):
        support_summary = MLService.evaluate_support_need(student, db)

    return StudentDetailResponse(
        id=student.id,
        user_id=student.user_id,
        registration_id=student.registration_id,
        first_name=student.first_name,
        last_name=student.last_name,
        email=student.email,
        phone=student.phone,
        department_id=student.department_id,
        department_name=student.department.name if student.department else None,
        department_code=student.department.code if student.department else None,
        enrollment_date=student.enrollment_date,
        current_semester=student.current_semester,
        academic_status=student.academic_status,
        cumulative_gpa=student.cumulative_gpa,
        completed_credits=student.completed_credits,
        is_archived=student.is_archived,
        created_at=student.created_at,
        updated_at=student.updated_at,
        enrollments=enrollment_responses,
        semester_history=semester_history,
        academic_support_summary=support_summary
    )

@router.patch("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    student_update: StudentUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    update_dict = student_update.model_dump(exclude_unset=True)

    # Check unique registration_id if changed
    if "registration_id" in update_dict and update_dict["registration_id"] != student.registration_id:
        if db.query(Student).filter(Student.registration_id == update_dict["registration_id"]).first():
            raise HTTPException(status_code=400, detail="Registration ID is already in use")

    # Check unique email if changed
    if "email" in update_dict and update_dict["email"] != student.email:
        if db.query(Student).filter(Student.email == update_dict["email"]).first():
            raise HTTPException(status_code=400, detail="Email is already in use")

    for k, v in update_dict.items():
        setattr(student, k, v)

    db.commit()
    db.refresh(student)

    log_audit_event(
        db=db,
        action="STUDENT_UPDATE",
        resource_type="student",
        resource_id=str(student.id),
        user_id=current_user.id,
        details=update_dict
    )

    return StudentResponse(
        id=student.id,
        user_id=student.user_id,
        registration_id=student.registration_id,
        first_name=student.first_name,
        last_name=student.last_name,
        email=student.email,
        phone=student.phone,
        department_id=student.department_id,
        department_name=student.department.name if student.department else None,
        department_code=student.department.code if student.department else None,
        enrollment_date=student.enrollment_date,
        current_semester=student.current_semester,
        academic_status=student.academic_status,
        cumulative_gpa=student.cumulative_gpa,
        completed_credits=student.completed_credits,
        is_archived=student.is_archived,
        created_at=student.created_at,
        updated_at=student.updated_at
    )

@router.delete("/{student_id}")
def archive_student(
    student_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student.is_archived = True
    student.academic_status = "WITHDRAWN"
    db.commit()

    log_audit_event(
        db=db,
        action="STUDENT_ARCHIVE",
        resource_type="student",
        resource_id=str(student.id),
        user_id=current_user.id,
        details={"registration_id": student.registration_id, "name": student.full_name}
    )

    return {"message": f"Student '{student.registration_id}' safely archived and marked inactive"}
