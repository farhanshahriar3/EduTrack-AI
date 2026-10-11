from sqlalchemy import Column, Integer, String, Numeric, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin

class Student(Base, TimestampMixin):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=True)
    registration_id = Column(String(50), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    enrollment_date = Column(Date, nullable=False)
    current_semester = Column(Integer, default=1, nullable=False)
    academic_status = Column(String(20), default="ACTIVE", nullable=False)  # ACTIVE, PROBATION, SUSPENDED, GRADUATED, WITHDRAWN
    cumulative_gpa = Column(Numeric(4, 2), default=0.00, nullable=False)
    completed_credits = Column(Integer, default=0, nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    department = relationship("Department", back_populates="students")
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    support_insights = relationship("AcademicSupportInsight", back_populates="student", cascade="all, delete-orphan")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
