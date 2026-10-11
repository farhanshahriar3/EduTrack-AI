from decimal import Decimal
from app.services.gpa_calculator import GPACalculator
from app.models.academic import Course, AcademicTerm, Enrollment, Grade
from app.models.student import Student
from datetime import date

def test_score_to_grade_points():
    letter, points, passed = GPACalculator.score_to_grade_points(98.5)
    assert letter == "A+"
    assert points == Decimal("4.0")
    assert passed is True

    letter_b, points_b, passed_b = GPACalculator.score_to_grade_points(84.0)
    assert letter_b == "B"
    assert points_b == Decimal("3.0")
    assert passed_b is True

    letter_f, points_f, passed_f = GPACalculator.score_to_grade_points(55.0)
    assert letter_f == "F"
    assert points_f == Decimal("0.0")
    assert passed_f is False

def test_gpa_weighted_calculation(db_session):
    # Create term
    term = AcademicTerm(code="TEST-T1", name="Test Term", start_date=date(2025, 1, 1), end_date=date(2025, 5, 1))
    db_session.add(term)
    
    # Create courses: CS101 (3.0 credits) and CS201 (4.0 credits)
    c1 = Course(code="TC1", title="Course 1", department_id=1, credits=Decimal("3.0"))
    c2 = Course(code="TC2", title="Course 2", department_id=1, credits=Decimal("4.0"))
    db_session.add_all([c1, c2])

    # Create student
    student = Student(
        registration_id="GPA-001",
        first_name="Alice",
        last_name="Test",
        email="alice@test.edu",
        department_id=1,
        enrollment_date=date(2025, 1, 1),
        current_semester=1,
        academic_status="ACTIVE",
        cumulative_gpa=Decimal("0.00"),
        completed_credits=0,
        is_archived=False
    )
    db_session.add(student)
    db_session.commit()

    # Enroll in both courses
    e1 = Enrollment(student_id=student.id, course_id=c1.id, term_id=term.id, status="COMPLETED")
    e2 = Enrollment(student_id=student.id, course_id=c2.id, term_id=term.id, status="COMPLETED")
    db_session.add_all([e1, e2])
    db_session.commit()

    # Grade 1: 95.0 -> A (4.0 pts) on 3 credits = 12.0
    g1 = Grade(enrollment_id=e1.id, letter_grade="A", numeric_score=Decimal("95.0"), grade_points=Decimal("4.0"), is_passed=True, counts_in_gpa=True)
    # Grade 2: 83.0 -> B (3.0 pts) on 4 credits = 12.0
    g2 = Grade(enrollment_id=e2.id, letter_grade="B", numeric_score=Decimal("83.0"), grade_points=Decimal("3.0"), is_passed=True, counts_in_gpa=True)
    db_session.add_all([g1, g2])
    db_session.commit()

    # Total quality points = 12 + 12 = 24. Total credits = 7. Expected GPA = 24 / 7 = 3.43
    gpa, credits = GPACalculator.calculate_cumulative_gpa(student.id, db_session)
    assert gpa == Decimal("3.43")
    assert credits == 7

    # Update summary in DB
    updated = GPACalculator.update_student_academic_summary(student.id, db_session)
    assert updated.cumulative_gpa == Decimal("3.43")
    assert updated.completed_credits == 7
