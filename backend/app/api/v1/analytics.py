from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_teacher_or_admin
from app.models.user import User
from app.schemas.analytics import FullAnalyticsReport
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics & Visualizations"])

@router.get("/overview", response_model=FullAnalyticsReport)
def get_analytics_overview(
    current_user: User = Depends(require_teacher_or_admin),
    db: Session = Depends(get_db)
):
    """Provides high-level institutional and departmental analytics based on live database data."""
    return AnalyticsService.get_full_analytics(db)
