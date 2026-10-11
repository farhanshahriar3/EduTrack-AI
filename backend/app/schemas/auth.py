from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserResponse"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=150)
    password: str = Field(min_length=8)
    role: str = Field(default="STUDENT", pattern="^(TEACHER|STUDENT)$")
    department_id: Optional[int] = None
    phone: Optional[str] = Field(default=None, max_length=30)
    current_semester: int = Field(default=1, ge=1, le=12)

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = Field(default="STUDENT", pattern="^(ADMIN|TEACHER|STUDENT)$")
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(min_length=6)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = Field(default=None, pattern="^(ADMIN|TEACHER|STUDENT)$")
    is_active: Optional[bool] = None
    password: Optional[str] = Field(default=None, min_length=6)

class UserProfileUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    password: Optional[str] = Field(default=None, min_length=8)
    phone: Optional[str] = Field(default=None, max_length=30)

class StudentProfileSummary(BaseModel):
    registration_id: str
    phone: Optional[str] = None
    department_id: int
    department_name: Optional[str] = None
    current_semester: int
    academic_status: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    student_id: Optional[int] = None
    student_profile: Optional[StudentProfileSummary] = None

    class Config:
        from_attributes = True

Token.model_rebuild()
