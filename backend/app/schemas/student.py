from typing import Optional, List, Dict, Any
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, EmailStr, Field
from app.schemas.academic import EnrollmentResponse

class StudentBase(BaseModel):
    registration_id: str = Field(min_length=3, max_length=50)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=30)
    department_id: int
    enrollment_date: date
    current_semester: int = Field(default=1, ge=1, le=12)
    academic_status: str = Field(
        default="ACTIVE",
        pattern="^(ACTIVE|PROBATION|SUSPENDED|GRADUATED|WITHDRAWN)$"
    )

class StudentCreate(StudentBase):
    user_id: Optional[int] = None
    create_user_account: Optional[bool] = False
    password: Optional[str] = None

class StudentUpdate(BaseModel):
    registration_id: Optional[str] = Field(default=None, min_length=3, max_length=50)
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    enrollment_date: Optional[date] = None
    current_semester: Optional[int] = Field(default=None, ge=1, le=12)
    academic_status: Optional[str] = Field(
        default=None,
        pattern="^(ACTIVE|PROBATION|SUSPENDED|GRADUATED|WITHDRAWN)$"
    )
    is_archived: Optional[bool] = None

class StudentResponse(StudentBase):
    id: int
    user_id: Optional[int] = None
    department_name: Optional[str] = None
    department_code: Optional[str] = None
    cumulative_gpa: Decimal
    completed_credits: int
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SemesterSummary(BaseModel):
    term_code: str
    term_name: str
    term_gpa: Decimal
    term_credits: Decimal
    courses_count: int

class StudentDetailResponse(StudentResponse):
    enrollments: List[EnrollmentResponse] = []
    semester_history: List[SemesterSummary] = []
    academic_support_summary: Optional[Dict[str, Any]] = None

class PaginatedStudentResponse(BaseModel):
    items: List[StudentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
