import pytest
import os
import sys

# Ensure backend root is in sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.core.database import Base, get_db
from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.models.user import User
from app.models.department import Department
from app.models.student import Student
from app.models.academic import GradingPolicy, Course, AcademicTerm, Enrollment, Grade
from app.services.gpa_calculator import DEFAULT_SCALE_CONFIG
from decimal import Decimal
from datetime import date

# Use an in-memory SQLite for fast, isolated testing
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Seed baseline policy
    policy = GradingPolicy(
        name="Standard 4.0 Scale",
        is_active=True,
        scale_config=DEFAULT_SCALE_CONFIG,
        pass_min_points=Decimal("2.00"),
        probation_gpa_threshold=Decimal("2.00")
    )
    session.add(policy)

    # Seed Department
    dept = Department(code="CS", name="Computer Science", description="CS Dept")
    session.add(dept)

    # Seed Admin User
    admin = User(
        email="testadmin@edutrack.edu",
        hashed_password=get_password_hash("AdminPass123!"),
        full_name="Admin Test",
        role="ADMIN",
        is_active=True
    )
    session.add(admin)

    # Seed Teacher User
    teacher = User(
        email="testteacher@edutrack.edu",
        hashed_password=get_password_hash("TeacherPass123!"),
        full_name="Teacher Test",
        role="TEACHER",
        is_active=True
    )
    session.add(teacher)

    # Seed Student User
    student_user = User(
        email="teststudent@edutrack.edu",
        hashed_password=get_password_hash("StudentPass123!"),
        full_name="Student Test",
        role="STUDENT",
        is_active=True
    )
    session.add(student_user)

    session.commit()

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def admin_token():
    return create_access_token(data={"sub": "testadmin@edutrack.edu", "role": "ADMIN"})

@pytest.fixture
def teacher_token():
    return create_access_token(data={"sub": "testteacher@edutrack.edu", "role": "TEACHER"})

@pytest.fixture
def student_token():
    return create_access_token(data={"sub": "teststudent@edutrack.edu", "role": "STUDENT"})
