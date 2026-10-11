from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_active_user, require_admin, require_teacher_or_admin
from app.core.audit import log_audit_event
from app.models.user import User
from app.models.department import Department
from app.models.academic import Course, AcademicTerm, Enrollment
from app.models.student import Student
from app.schemas.department import DepartmentCreate, DepartmentResponse
from app.schemas.academic import (
    CourseCreate,
    CourseResponse,
    AcademicTermCreate,
    AcademicTermResponse,
    EnrollmentCreate,
    EnrollmentResponse
)

router = APIRouter(tags=["Academic Infrastructure"])

# Departments
@router.get("/departments", response_model=List[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    results = []
    for d in depts:
        results.append(DepartmentResponse(
            id=d.id,
            code=d.code,
            name=d.name,
            description=d.description,
            student_count=len([s for s in d.students if not s.is_archived]),
            course_count=len(d.courses),
            created_at=d.created_at,
            updated_at=d.updated_at
        ))
    return results

@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    dept_in: DepartmentCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if db.query(Department).filter(Department.code == dept_in.code.upper()).first():
        raise HTTPException(status_code=400, detail=f"Department code '{dept_in.code}' already exists")
    
    dept = Department(
        code=dept_in.code.upper(),
        name=dept_in.name,
        description=dept_in.description
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)

    log_audit_event(
        db=db,
        action="DEPARTMENT_CREATE",
        resource_type="department",
        resource_id=str(dept.id),
        user_id=current_user.id,
        details={"code": dept.code, "name": dept.name}
    )

    return DepartmentResponse(
        id=dept.id,
        code=dept.code,
        name=dept.name,
        description=dept.description,
        student_count=0,
        course_count=0,
        created_at=dept.created_at,
        updated_at=dept.updated_at
    )

# Terms
@router.get("/terms", response_model=List[AcademicTermResponse])
def list_terms(db: Session = Depends(get_db)):
    return db.query(AcademicTerm).order_by(AcademicTerm.start_date.desc()).all()

@router.post("/terms", response_model=AcademicTermResponse, status_code=status.HTTP_201_CREATED)
def create_term(
    term_in: AcademicTermCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if db.query(AcademicTerm).filter(AcademicTerm.code == term_in.code.upper()).first():
        raise HTTPException(status_code=400, detail=f"Term code '{term_in.code}' already exists")

    if term_in.is_current:
        # unset other current terms
        db.query(AcademicTerm).update({"is_current": False})

    term = AcademicTerm(
        code=term_in.code.upper(),
        name=term_in.name,
        start_date=term_in.start_date,
        end_date=term_in.end_date,
        is_current=term_in.is_current
    )
    db.add(term)
    db.commit()
    db.refresh(term)

    return term

# Courses
@router.get("/courses", response_model=List[CourseResponse])
def list_courses(department_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Course)
    if department_id:
        query = query.filter(Course.department_id == department_id)
    courses = query.order_by(Course.code.asc()).all()

    results = []
    for c in courses:
        results.append(CourseResponse(
            id=c.id,
            code=c.code,
            title=c.title,
            department_id=c.department_id,
            department_name=c.department.name if c.department else None,
            credits=c.credits,
            instructor_id=c.instructor_id,
            instructor_name=c.instructor.full_name if c.instructor else None,
            description=c.description,
            created_at=c.created_at,
            updated_at=c.updated_at
        ))
    return results

@router.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    course_in: CourseCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if db.query(Course).filter(Course.code == course_in.code.upper()).first():
        raise HTTPException(status_code=400, detail=f"Course code '{course_in.code}' already exists")

    dept = db.query(Department).filter(Department.id == course_in.department_id).first()
    if not dept:
        raise HTTPException(status_code=400, detail="Department not found")

    course = Course(
        code=course_in.code.upper(),
        title=course_in.title,
        department_id=course_in.department_id,
        credits=course_in.credits,
        instructor_id=course_in.instructor_id,
        description=course_in.description
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    return CourseResponse(
        id=course.id,
        code=course.code,
        title=course.title,
        department_id=course.department_id,
        department_name=dept.name,
        credits=course.credits,
        instructor_id=course.instructor_id,
        instructor_name=course.instructor.full_name if course.instructor else None,
        description=course.description,
        created_at=course.created_at,
        updated_at=course.updated_at
    )

# Enrollments
@router.get("/enrollments", response_model=List[EnrollmentResponse])
def list_enrollments(
    student_id: Optional[int] = None,
    term_id: Optional[int] = None,
    course_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Enrollment)
    if current_user.role == "STUDENT":
        if not current_user.student_profile:
            return []
        query = query.filter(Enrollment.student_id == current_user.student_profile.id)
    elif student_id:
        query = query.filter(Enrollment.student_id == student_id)

    if term_id:
        query = query.filter(Enrollment.term_id == term_id)
    if course_id:
        query = query.filter(Enrollment.course_id == course_id)

    enrollments = query.all()
    results = []
    for enr in enrollments:
        results.append(EnrollmentResponse(
            id=enr.id,
            student_id=enr.student_id,
            course_id=enr.course_id,
            term_id=enr.term_id,
            status=enr.status,
            course_code=enr.course.code if enr.course else None,
            course_title=enr.course.title if enr.course else None,
            credits=enr.course.credits if enr.course else None,
            term_code=enr.term.code if enr.term else None,
            student_name=enr.student.full_name if enr.student else None,
            registration_id=enr.student.registration_id if enr.student else None,
            grade=enr.grade,
            created_at=enr.created_at,
            updated_at=enr.updated_at
        ))
    return results

@router.post("/enrollments", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
def create_enrollment(
    enr_in: EnrollmentCreate,
    current_user: User = Depends(require_teacher_or_admin),
    db: Session = Depends(get_db)
):
    # Verify student exists
    student = db.query(Student).filter(Student.id == enr_in.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    course = db.query(Course).filter(Course.id == enr_in.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    term = db.query(AcademicTerm).filter(AcademicTerm.id == enr_in.term_id).first()
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")

    # Check duplicate enrollment
    existing = db.query(Enrollment).filter(
        Enrollment.student_id == enr_in.student_id,
        Enrollment.course_id == enr_in.course_id,
        Enrollment.term_id == enr_in.term_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student is already enrolled in this course for this term")

    enr = Enrollment(
        student_id=enr_in.student_id,
        course_id=enr_in.course_id,
        term_id=enr_in.term_id,
        status=enr_in.status
    )
    db.add(enr)
    db.commit()
    db.refresh(enr)

    log_audit_event(
        db=db,
        action="ENROLLMENT_CREATE",
        resource_type="enrollment",
        resource_id=str(enr.id),
        user_id=current_user.id,
        details={"student_id": student.id, "course_code": course.code, "term": term.code}
    )

    return EnrollmentResponse(
        id=enr.id,
        student_id=enr.student_id,
        course_id=enr.course_id,
        term_id=enr.term_id,
        status=enr.status,
        course_code=course.code,
        course_title=course.title,
        credits=course.credits,
        term_code=term.code,
        student_name=student.full_name,
        registration_id=student.registration_id,
        grade=None,
        created_at=enr.created_at,
        updated_at=enr.updated_at
    )
