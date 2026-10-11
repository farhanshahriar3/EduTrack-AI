from typing import Optional, Dict, Any, List
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, Field

# Academic Term
class AcademicTermBase(BaseModel):
    code: str = Field(min_length=2, max_length=20)
    name: str = Field(min_length=2, max_length=100)
    start_date: date
    end_date: date
    is_current: bool = False

class AcademicTermCreate(AcademicTermBase):
    pass

class AcademicTermResponse(AcademicTermBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Course
class CourseBase(BaseModel):
    code: str = Field(min_length=2, max_length=30)
    title: str = Field(min_length=2, max_length=150)
    department_id: int
    credits: Decimal = Field(default=Decimal("3.0"), ge=0.5, le=12.0)
    instructor_id: Optional[int] = None
    description: Optional[str] = None

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    code: Optional[str] = None
    title: Optional[str] = None
    department_id: Optional[int] = None
    credits: Optional[Decimal] = Field(default=None, ge=0.5, le=12.0)
    instructor_id: Optional[int] = None
    description: Optional[str] = None

class CourseResponse(CourseBase):
    id: int
    department_name: Optional[str] = None
    instructor_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Grade
class GradeBase(BaseModel):
    letter_grade: str = Field(min_length=1, max_length=5)
    numeric_score: Decimal = Field(ge=0.0, le=100.0)
    grade_points: Decimal = Field(ge=0.0, le=4.5)
    is_passed: bool = True
    counts_in_gpa: bool = True

class GradeCreate(BaseModel):
    enrollment_id: int
    numeric_score: Decimal = Field(ge=0.0, le=100.0)
    # letter_grade and grade_points can be auto-calculated from policy or provided
    letter_grade: Optional[str] = None
    grade_points: Optional[Decimal] = None
    is_passed: Optional[bool] = None
    counts_in_gpa: bool = True

class GradeUpdate(BaseModel):
    numeric_score: Optional[Decimal] = Field(default=None, ge=0.0, le=100.0)
    letter_grade: Optional[str] = None
    grade_points: Optional[Decimal] = None
    is_passed: Optional[bool] = None
    counts_in_gpa: Optional[bool] = None

class GradeResponse(GradeBase):
    id: int
    enrollment_id: int
    graded_by_user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Enrollment
class EnrollmentBase(BaseModel):
    student_id: int
    course_id: int
    term_id: int
    status: str = Field(default="ENROLLED", pattern="^(ENROLLED|COMPLETED|DROPPED|WITHDRAWN)$")

class EnrollmentCreate(EnrollmentBase):
    pass

class EnrollmentResponse(EnrollmentBase):
    id: int
    course_code: Optional[str] = None
    course_title: Optional[str] = None
    credits: Optional[Decimal] = None
    term_code: Optional[str] = None
    student_name: Optional[str] = None
    registration_id: Optional[str] = None
    grade: Optional[GradeResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Grading Policy
class GradingPolicyBase(BaseModel):
    name: str = "Standard 4.0 Scale"
    is_active: bool = True
    scale_config: Dict[str, Any]
    pass_min_points: Decimal = Decimal("2.00")
    probation_gpa_threshold: Decimal = Decimal("2.00")

class GradingPolicyCreate(GradingPolicyBase):
    pass

class GradingPolicyResponse(GradingPolicyBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
