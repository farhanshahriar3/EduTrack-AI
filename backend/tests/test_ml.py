from app.services.ml_service import MLService
from app.models.student import Student
from decimal import Decimal
from datetime import date

def test_ml_health_and_metadata():
    metadata = MLService.get_metadata()
    assert "model_version" in metadata
    assert "algorithm" in metadata
    assert "safeguards" in metadata

def test_ml_feature_extraction_no_demographics(db_session):
    student = Student(
        registration_id="ML-TEST-01",
        first_name="Test",
        last_name="Student",
        email="ml.test@edutrack.edu",
        department_id=1,
        enrollment_date=date(2025, 9, 1),
        current_semester=2,
        academic_status="ACTIVE",
        cumulative_gpa=Decimal("3.40"),
        completed_credits=30,
        is_archived=False
    )
    db_session.add(student)
    db_session.commit()

    features = MLService.extract_student_features(student, db_session)
    # Check that exclusively academic metrics are extracted
    assert "cumulative_gpa" in features
    assert "recent_term_gpa" in features
    assert "gpa_delta" in features
    assert "credit_completion_ratio" in features
    assert "course_failure_count" in features

    # Ensure zero sensitive demographic attributes
    sensitive_keys = ["race", "gender", "age", "ethnicity", "religion", "income", "zipcode"]
    for k in sensitive_keys:
        assert k not in features

def test_ml_evaluate_support_need(db_session):
    student = Student(
        registration_id="ML-TEST-02",
        first_name="Struggling",
        last_name="Student",
        email="struggling@edutrack.edu",
        department_id=1,
        enrollment_date=date(2025, 9, 1),
        current_semester=3,
        academic_status="PROBATION",
        cumulative_gpa=Decimal("1.85"),
        completed_credits=12,
        is_archived=False
    )
    db_session.add(student)
    db_session.commit()

    insight = MLService.evaluate_support_need(student, db_session)
    assert insight["student_id"] == student.id
    assert insight["risk_level"] in ("LOW", "MEDIUM", "HIGH")
    assert 0.0 <= float(insight["risk_score"]) <= 1.0
    assert len(insight["contributing_factors"]) > 0
    assert "disclaimer" in insight
    assert "advisor review only" in insight["disclaimer"]
