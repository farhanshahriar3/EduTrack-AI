from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_admin, get_current_active_user
from app.core.audit import log_audit_event
from app.models.user import User
from app.models.academic import GradingPolicy
from app.schemas.academic import GradingPolicyResponse, GradingPolicyCreate
from app.services.gpa_calculator import GPACalculator

router = APIRouter(prefix="/settings", tags=["Settings & Grading Policy"])

@router.get("/policy", response_model=GradingPolicyResponse)
def get_grading_policy(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    policy = GPACalculator.get_active_policy(db)
    return policy

@router.put("/policy", response_model=GradingPolicyResponse)
def update_grading_policy(
    policy_in: GradingPolicyCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    policy = GPACalculator.get_active_policy(db)
    policy.name = policy_in.name
    policy.scale_config = policy_in.scale_config
    policy.pass_min_points = policy_in.pass_min_points
    policy.probation_gpa_threshold = policy_in.probation_gpa_threshold
    db.commit()
    db.refresh(policy)

    log_audit_event(
        db=db,
        action="GRADING_POLICY_UPDATE",
        resource_type="policy",
        resource_id=str(policy.id),
        user_id=current_user.id,
        details={"name": policy.name}
    )

    return policy
