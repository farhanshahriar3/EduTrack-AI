import os
import json
import joblib
import pandas as pd
from decimal import Decimal
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.student import Student
from app.models.academic import Enrollment, Grade, Course, AcademicTerm
from app.models.ml import AcademicSupportInsight, ModelVersion

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "artifacts", "academic_support_model.joblib")
METADATA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "artifacts", "model_metadata.json")

class MLService:
    _model = None
    _metadata = None

    @classmethod
    def get_model(cls):
        if cls._model is None and os.path.exists(MODEL_PATH):
            try:
                cls._model = joblib.load(MODEL_PATH)
            except Exception as e:
                print(f"[MLService] Notice: Could not load trained joblib model ({e}). Fallback heuristic active.")
        return cls._model

    @classmethod
    def get_metadata(cls) -> Dict[str, Any]:
        if cls._metadata is None and os.path.exists(METADATA_PATH):
            try:
                with open(METADATA_PATH, "r") as f:
                    cls._metadata = json.load(f)
            except Exception:
                pass
        return cls._metadata or {
            "model_version": "v1.0.0-heuristic",
            "algorithm": "Transparent Rule-Based Academic Standing Heuristic",
            "safeguards": {
                "disclaimer": "Indicator for authorized advisor review only. Not an automated punitive or definitive judgment."
            }
        }

    @classmethod
    def extract_student_features(cls, student: Student, db: Session) -> Dict[str, Any]:
        """Extracts strictly academic metrics for a student to ensure fair, transparent evaluation."""
        enrollments = (
            db.query(Enrollment)
            .join(Course, Course.id == Enrollment.course_id)
            .outerjoin(Grade, Grade.enrollment_id == Enrollment.id)
            .join(AcademicTerm, AcademicTerm.id == Enrollment.term_id)
            .filter(Enrollment.student_id == student.id)
            .order_by(AcademicTerm.start_date.desc())
            .all()
        )

        cum_gpa = float(student.cumulative_gpa)
        semester = max(1, student.current_semester)
        completed_credits = student.completed_credits
        expected_credits = semester * 15.0
        credit_completion_ratio = min(1.0, max(0.1, completed_credits / expected_credits if expected_credits > 0 else 0.5))

        # Separate into terms
        term_grades: Dict[int, List[Grade]] = {}
        failure_count = 0
        withdrawal_count = 0

        for enr in enrollments:
            if enr.status == "WITHDRAWN":
                withdrawal_count += 1
            if enr.grade:
                if not enr.grade.is_passed:
                    failure_count += 1
                term_grades.setdefault(enr.term_id, []).append(enr.grade)

        # Recent term GPA
        recent_term_gpa = cum_gpa
        gpa_delta = 0.0

        if term_grades:
            # Most recent term
            recent_term_id = list(term_grades.keys())[0]
            grades_in_term = term_grades[recent_term_id]
            points_sum = sum(float(g.grade_points) for g in grades_in_term)
            recent_term_gpa = points_sum / len(grades_in_term) if grades_in_term else cum_gpa
            gpa_delta = recent_term_gpa - cum_gpa

        return {
            "cumulative_gpa": cum_gpa,
            "recent_term_gpa": recent_term_gpa,
            "gpa_delta": gpa_delta,
            "credit_completion_ratio": credit_completion_ratio,
            "course_failure_count": failure_count,
            "course_withdrawal_count": withdrawal_count,
            "current_semester": semester
        }

    @classmethod
    def evaluate_support_need(cls, student: Student, db: Session) -> Dict[str, Any]:
        """
        Runs ML inference or transparent heuristic baseline to identify if student could benefit from advisor outreach.
        Provides detailed observable factors for educators.
        """
        features = cls.extract_student_features(student, db)
        model = cls.get_model()
        metadata = cls.get_metadata()

        risk_score = 0.15
        version = metadata.get("model_version", "v1.2.0-lr")

        if model is not None:
            try:
                feature_df = pd.DataFrame([features])
                proba = model.predict_proba(feature_df)[0][1]
                risk_score = float(proba)
            except Exception:
                # Heuristic fallback if inference error occurs
                risk_score = cls._heuristic_risk(features)
        else:
            risk_score = cls._heuristic_risk(features)

        # Determine Risk Level
        if risk_score >= 0.60 or features["cumulative_gpa"] < 2.0 or features["course_failure_count"] >= 2:
            risk_level = "HIGH"
        elif risk_score >= 0.35 or features["gpa_delta"] <= -0.5:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Generate Human-Interpretable Contributing Factors
        factors = []
        
        # GPA standing
        if features["cumulative_gpa"] < 2.0:
            factors.append({
                "factor": "Cumulative GPA Under Threshold",
                "value": f"{features['cumulative_gpa']:.2f}",
                "impact": "NEGATIVE",
                "description": "Cumulative GPA is below standard academic threshold of 2.00."
            })
        elif features["cumulative_gpa"] >= 3.5:
            factors.append({
                "factor": "Excellent Cumulative GPA",
                "value": f"{features['cumulative_gpa']:.2f}",
                "impact": "POSITIVE",
                "description": "Student is in Dean's List / high honors standing."
            })

        # GPA trend
        if features["gpa_delta"] <= -0.4:
            factors.append({
                "factor": "Declining GPA Trend",
                "value": f"{features['gpa_delta']:+.2f}",
                "impact": "NEGATIVE",
                "description": f"Recent term GPA ({features['recent_term_gpa']:.2f}) dropped noticeably compared to cumulative standing."
            })
        elif features["gpa_delta"] >= 0.3:
            factors.append({
                "factor": "Upward Academic Trajectory",
                "value": f"{features['gpa_delta']:+.2f}",
                "impact": "POSITIVE",
                "description": "Recent semester performance exceeded cumulative average."
            })

        # Failed courses
        if features["course_failure_count"] > 0:
            factors.append({
                "factor": "Uncompleted / Failed Courses",
                "value": f"{features['course_failure_count']} courses",
                "impact": "NEGATIVE",
                "description": f"Student has recorded {features['course_failure_count']} failed course(s)."
            })

        # Credit progress
        if features["credit_completion_ratio"] < 0.70:
            factors.append({
                "factor": "Credit Pace Delay",
                "value": f"{features['credit_completion_ratio']:.0%}",
                "impact": "NEGATIVE",
                "description": "Earned credits are behind expected pace for the current semester."
            })
        else:
            factors.append({
                "factor": "Consistent Degree Pace",
                "value": f"{features['credit_completion_ratio']:.0%}",
                "impact": "POSITIVE",
                "description": "Completed course credits match or exceed nominal schedule."
            })

        disclaimer = "Academic indicator for authorized advisor review only. Not an automated punitive or definitive judgment."

        return {
            "student_id": student.id,
            "risk_level": risk_level,
            "risk_score": Decimal(str(round(risk_score, 3))),
            "model_version": version,
            "contributing_factors": factors,
            "disclaimer": disclaimer,
            "calculated_at": datetime.now(timezone.utc)
        }

    @staticmethod
    def _heuristic_risk(features: Dict[str, Any]) -> float:
        """Transparent rule-based scoring baseline."""
        score = 0.1
        if features["cumulative_gpa"] < 2.0:
            score += 0.4
        elif features["cumulative_gpa"] < 2.5:
            score += 0.2
        if features["gpa_delta"] <= -0.5:
            score += 0.25
        if features["course_failure_count"] > 0:
            score += min(0.3, features["course_failure_count"] * 0.15)
        if features["credit_completion_ratio"] < 0.7:
            score += 0.15
        return min(0.99, max(0.01, score))
