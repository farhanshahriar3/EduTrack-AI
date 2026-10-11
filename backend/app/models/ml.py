from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Numeric, JSON, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    version = Column(String(50), nullable=False, unique=True)
    algorithm = Column(String(100), nullable=False)  # e.g., "LogisticRegression (scikit-learn)" or "Transparent Academic Baseline Heuristic"
    metrics = Column(JSON, nullable=True)  # precision, recall, f1, etc.
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

class AcademicSupportInsight(Base):
    __tablename__ = "academic_support_insights"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    risk_level = Column(String(20), nullable=False)  # LOW, MEDIUM, HIGH
    risk_score = Column(Numeric(4, 3), nullable=False)  # 0.000 to 1.000
    model_version = Column(String(50), nullable=False)
    contributing_factors = Column(JSON, nullable=False)  # List of {factor, value, impact, description}
    disclaimer = Column(
        String(255),
        default="Indicator for authorized advisor review only. Not an automated punitive or definitive judgment.",
        nullable=False
    )
    calculated_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    student = relationship("Student", back_populates="support_insights")
