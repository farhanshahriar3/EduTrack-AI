from datetime import date, timedelta
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_password, create_access_token, get_current_active_user, get_password_hash
from app.core.audit import log_audit_event
from app.models.user import User
from app.models.student import Student
from app.models.department import Department
from app.schemas.auth import LoginRequest, RegisterRequest, Token, UserProfileUpdate, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

def _issue_token(user: User):
    return create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

def _user_payload(user: User):
    student = user.student_profile
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "student_id": student.id if student else None,
        "student_profile": {
            "registration_id": student.registration_id,
            "phone": student.phone,
            "department_id": student.department_id,
            "department_name": student.department.name if student.department else None,
            "current_semester": student.current_semester,
            "academic_status": student.academic_status,
        } if student else None,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is disabled")

    access_token = _issue_token(user)

    log_audit_event(
        db=db,
        action="USER_LOGIN",
        resource_type="auth",
        resource_id=str(user.id),
        user_id=user.id,
        details={"email": user.email, "role": user.role}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": _user_payload(user)
    }

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(register_data: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == register_data.email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    student = None
    if register_data.role == "STUDENT":
        if register_data.department_id is None:
            raise HTTPException(status_code=400, detail="Department is required for student registration")
        department = db.query(Department).filter(Department.id == register_data.department_id).first()
        if not department:
            raise HTTPException(status_code=400, detail="Selected department does not exist")

    user = User(
        email=register_data.email,
        hashed_password=get_password_hash(register_data.password),
        full_name=register_data.full_name,
        role=register_data.role,
        is_active=True,
    )
    db.add(user)
    db.flush()

    if register_data.role == "STUDENT":
        year = date.today().year
        registration_id = f"STU-{year}-{uuid4().hex[:8].upper()}"
        student = Student(
            user_id=user.id,
            registration_id=registration_id,
            first_name=register_data.full_name.split(" ", 1)[0],
            last_name=register_data.full_name.split(" ", 1)[1] if " " in register_data.full_name else "Student",
            email=register_data.email,
            phone=register_data.phone,
            department_id=register_data.department_id,
            enrollment_date=date.today(),
            current_semester=register_data.current_semester,
            academic_status="ACTIVE",
        )
        db.add(student)

    db.commit()
    db.refresh(user)
    return {
        "access_token": _issue_token(user),
        "token_type": "bearer",
        "user": _user_payload(user),
    }

@router.post("/logout")
def logout(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    log_audit_event(
        db=db,
        action="USER_LOGOUT",
        resource_type="auth",
        resource_id=str(current_user.id),
        user_id=current_user.id
    )
    return {"message": "Successfully logged out"}

@router.get("/me")
def read_current_user_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return _user_payload(current_user)

@router.patch("/me", response_model=UserResponse)
def update_current_user_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    update_data = profile_in.model_dump(exclude_unset=True)
    if "email" in update_data and update_data["email"] != current_user.email:
        if db.query(User).filter(User.email == update_data["email"], User.id != current_user.id).first():
            raise HTTPException(status_code=400, detail="An account with this email already exists")
        current_user.email = update_data.pop("email")
    if "full_name" in update_data:
        current_user.full_name = update_data.pop("full_name")
    if "password" in update_data and update_data["password"]:
        current_user.hashed_password = get_password_hash(update_data.pop("password"))
    if current_user.student_profile and "phone" in update_data:
        current_user.student_profile.phone = update_data.pop("phone")

    db.commit()
    db.refresh(current_user)
    log_audit_event(
        db=db,
        action="PROFILE_UPDATE",
        resource_type="user",
        resource_id=str(current_user.id),
        user_id=current_user.id,
        details={"updated_fields": list(profile_in.model_dump(exclude_unset=True).keys())},
    )
    return _user_payload(current_user)
