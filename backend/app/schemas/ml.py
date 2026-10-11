from typing import List, Dict, Any, Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel

class ContributingFactor(BaseModel):
    factor: str
    value: str
    impact: str  # POSITIVE, NEUTRAL, NEGATIVE
    description: str

class AcademicSupportInsightResponse(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    registration_id: Optional[str] = None
    department_name: Optional[str] = None
    risk_level: str  # LOW, MEDIUM, HIGH
    risk_score: Decimal
    model_version: str
    contributing_factors: List[ContributingFactor]
    disclaimer: str
    calculated_at: datetime

    class Config:
        from_attributes = True

class MLHealthResponse(BaseModel):
    status: str
    active_model: str
    algorithm: str
    version: str
    metrics: Dict[str, Any]
    safeguards_active: bool
    description: str
