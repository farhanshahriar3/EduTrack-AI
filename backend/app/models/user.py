from sqlalchemy import Column, Integer, String, Boolean, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(20), nullable=False, default="STUDENT")  # ADMIN, TEACHER, STUDENT
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    student_profile = relationship("Student", back_populates="user", uselist=False)
    audit_logs = relationship("AuditLog", back_populates="user")
