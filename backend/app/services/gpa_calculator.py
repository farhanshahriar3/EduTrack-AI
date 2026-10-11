from typing import List, Tuple, Dict, Any, Optional
from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy.orm import Session
from app.models.academic import Grade, Enrollment, Course, GradingPolicy
from app.models.student import Student

DEFAULT_SCALE_CONFIG = {
    "A+": {"min_score": 97.0, "points": 4.0, "passed": True},
    "A":  {"min_score": 93.0, "points": 4.0, "passed": True},
    "A-": {"min_score": 90.0, "points": 3.7, "passed": True},
    "B+": {"min_score": 87.0, "points": 3.3, "passed": True},
    "B":  {"min_score": 83.0, "points": 3.0, "passed": True},
    "B-": {"min_score": 80.0, "points": 2.7, "passed": True},
    "C+": {"min_score": 77.0, "points": 2.3, "passed": True},
    "C":  {"min_score": 73.0, "points": 2.0, "passed": True},
    "C-": {"min_score": 70.0, "points": 1.7, "passed": True},
    "D+": {"min_score": 67.0, "points": 1.3, "passed": True},
    "D":  {"min_score": 60.0, "points": 1.0, "passed": True},
    "F":  {"min_score": 0.0,  "points": 0.0, "passed": False},
}

class GPACalculator:
    @staticmethod
    def get_active_policy(db: Session) -> GradingPolicy:
        policy = db.query(GradingPolicy).filter(GradingPolicy.is_active == True).first()
        if not policy:
            # Fallback or create default policy in db
            policy = GradingPolicy(
                name="Standard 4.0 Scale",
                is_active=True,
                scale_config=DEFAULT_SCALE_CONFIG,
                pass_min_points=Decimal("2.00"),
                probation_gpa_threshold=Decimal("2.00")
            )
            db.add(policy)
            db.commit()
            db.refresh(policy)
        return policy

    @staticmethod
    def score_to_grade_points(numeric_score: float | Decimal, policy: Optional[GradingPolicy] = None) -> Tuple[str, Decimal, bool]:
        """Convert a 0-100 numeric score into (letter_grade, grade_points, is_passed)."""
        score_val = float(numeric_score)
        config = policy.scale_config if policy and policy.scale_config else DEFAULT_SCALE_CONFIG
        
        # Sort scales in descending order of min_score
        sorted_grades = sorted(
            config.items(),
            key=lambda item: item[1].get("min_score", 0),
            reverse=True
        )

        for letter, details in sorted_grades:
            if score_val >= details["min_score"]:
                return (
                    letter,
                    Decimal(str(details["points"])),
                    bool(details.get("passed", True))
                )

        # Default fallback
        return ("F", Decimal("0.0"), False)

    @staticmethod
    def calculate_cumulative_gpa(student_id: int, db: Session) -> Tuple[Decimal, int]:
        """
        Calculates cumulative GPA using weighted credits formula:
        GPA = sum(grade_points * credits) / sum(credits)
        Also calculates total completed credits.
        """
        enrollments = (
            db.query(Enrollment)
            .join(Grade, Grade.enrollment_id == Enrollment.id)
            .join(Course, Course.id == Enrollment.course_id)
            .filter(
                Enrollment.student_id == student_id,
                Enrollment.status.in_(["COMPLETED", "ENROLLED"]),
                Grade.counts_in_gpa == True
            )
            .all()
        )

        total_quality_points = Decimal("0.0")
        total_gpa_credits = Decimal("0.0")
        completed_credits = Decimal("0.0")

        for enr in enrollments:
            if enr.grade and enr.course:
                course_credits = Decimal(str(enr.course.credits))
                grade_pts = Decimal(str(enr.grade.grade_points))

                total_quality_points += grade_pts * course_credits
                total_gpa_credits += course_credits

                if enr.grade.is_passed:
                    completed_credits += course_credits

        if total_gpa_credits > Decimal("0.0"):
            gpa = (total_quality_points / total_gpa_credits).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        else:
            gpa = Decimal("0.00")

        return gpa, int(completed_credits)

    @classmethod
    def update_student_academic_summary(cls, student_id: int, db: Session) -> Student:
        """Recalculates and updates student cumulative GPA, completed credits, and probation status."""
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            return None

        gpa, completed = cls.calculate_cumulative_gpa(student_id, db)
        student.cumulative_gpa = gpa
        student.completed_credits = completed

        # Check probation status
        policy = cls.get_active_policy(db)
        if gpa > Decimal("0.00") and gpa < Decimal(str(policy.probation_gpa_threshold)):
            if student.academic_status == "ACTIVE":
                student.academic_status = "PROBATION"
        elif student.academic_status == "PROBATION" and gpa >= Decimal(str(policy.probation_gpa_threshold)):
            student.academic_status = "ACTIVE"

        db.commit()
        db.refresh(student)
        return student
