from sqlalchemy import Column, Integer, String, Numeric, Boolean, Date, ForeignKey, UniqueConstraint, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin

class AcademicTerm(Base, TimestampMixin):
    __tablename__ = "academic_terms"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_current = Column(Boolean, default=False, nullable=False)

    enrollments = relationship("Enrollment", back_populates="term")

class Course(Base, TimestampMixin):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), unique=True, index=True, nullable=False)
    title = Column(String(150), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    credits = Column(Numeric(3, 1), nullable=False, default=3.0)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    description = Column(Text, nullable=True)

    department = relationship("Department", back_populates="courses")
    instructor = relationship("User", foreign_keys=[instructor_id])
    enrollments = relationship("Enrollment", back_populates="course")

class Enrollment(Base, TimestampMixin):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    term_id = Column(Integer, ForeignKey("academic_terms.id"), nullable=False)
    status = Column(String(20), default="ENROLLED", nullable=False)  # ENROLLED, COMPLETED, DROPPED, WITHDRAWN

    __table_args__ = (
        UniqueConstraint("student_id", "course_id", "term_id", name="uq_student_course_term"),
    )

    student = relationship("Student", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")
    term = relationship("AcademicTerm", back_populates="enrollments")
    grade = relationship("Grade", back_populates="enrollment", uselist=False, cascade="all, delete-orphan")

class Grade(Base, TimestampMixin):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, index=True)
    enrollment_id = Column(Integer, ForeignKey("enrollments.id", ondelete="CASCADE"), unique=True, nullable=False)
    letter_grade = Column(String(5), nullable=False)
    numeric_score = Column(Numeric(5, 2), nullable=False)
    grade_points = Column(Numeric(4, 2), nullable=False)
    is_passed = Column(Boolean, default=True, nullable=False)
    counts_in_gpa = Column(Boolean, default=True, nullable=False)
    graded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    enrollment = relationship("Enrollment", back_populates="grade")
    graded_by = relationship("User", foreign_keys=[graded_by_user_id])

class GradingPolicy(Base, TimestampMixin):
    __tablename__ = "grading_policies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), default="Standard 4.0 Scale", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    scale_config = Column(JSON, nullable=False)
    pass_min_points = Column(Numeric(3, 2), default=2.00, nullable=False)
    probation_gpa_threshold = Column(Numeric(3, 2), default=2.00, nullable=False)
