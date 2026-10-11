from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.student import Student
from app.models.department import Department
from app.models.academic import Course, Enrollment, Grade, AcademicTerm
from app.schemas.analytics import (
    AnalyticsOverview,
    GpaDistributionItem,
    DepartmentPerformanceItem,
    SemesterTrendItem,
    GradeDistributionItem,
    FullAnalyticsReport
)

class AnalyticsService:
    @staticmethod
    def get_full_analytics(db: Session) -> FullAnalyticsReport:
        # Total counts
        total_students = db.query(Student).filter(Student.is_archived == False).count()
        total_active_students = db.query(Student).filter(
            Student.is_archived == False,
            Student.academic_status == "ACTIVE"
        ).count()
        total_departments = db.query(Department).count()
        total_courses = db.query(Course).count()
        total_enrollments = db.query(Enrollment).count()

        # Average GPA
        avg_gpa_query = db.query(func.avg(Student.cumulative_gpa)).filter(
            Student.is_archived == False,
            Student.cumulative_gpa > 0
        ).scalar()
        average_gpa = Decimal(str(round(float(avg_gpa_query or 0.0), 2)))

        # Students needing academic review (GPA < 2.0 or status PROBATION)
        students_needing_review = db.query(Student).filter(
            Student.is_archived == False,
            (Student.cumulative_gpa < Decimal("2.00")) | (Student.academic_status == "PROBATION")
        ).count()

        overview = AnalyticsOverview(
            total_students=total_students,
            total_active_students=total_active_students,
            total_departments=total_departments,
            average_gpa=average_gpa,
            students_needing_review=students_needing_review,
            total_courses=total_courses,
            total_enrollments=total_enrollments
        )

        # GPA Distribution
        all_active_gpas = [
            float(g[0]) for g in db.query(Student.cumulative_gpa).filter(
                Student.is_archived == False,
                Student.cumulative_gpa > 0
            ).all()
        ]
        
        bins = [
            ("0.0 - 1.99", lambda g: g < 2.0),
            ("2.0 - 2.49", lambda g: 2.0 <= g < 2.5),
            ("2.5 - 2.99", lambda g: 2.5 <= g < 3.0),
            ("3.0 - 3.49", lambda g: 3.0 <= g < 3.5),
            ("3.5 - 4.00", lambda g: g >= 3.5)
        ]
        
        gpa_distribution = []
        gpa_count_total = len(all_active_gpas) if all_active_gpas else 1
        for label, cond in bins:
            cnt = sum(1 for g in all_active_gpas if cond(g))
            pct = round((cnt / gpa_count_total) * 100, 1) if all_active_gpas else 0.0
            gpa_distribution.append(GpaDistributionItem(
                range=label,
                count=cnt,
                percentage=pct
            ))

        # Department Performance
        dept_perf = []
        departments = db.query(Department).all()
        for d in departments:
            stus = [s for s in d.students if not s.is_archived]
            cnt = len(stus)
            valid_gpas = [float(s.cumulative_gpa) for s in stus if s.cumulative_gpa > 0]
            avg_dept_gpa = Decimal(str(round(sum(valid_gpas) / len(valid_gpas), 2))) if valid_gpas else Decimal("0.00")
            dept_perf.append(DepartmentPerformanceItem(
                department_name=d.name,
                department_code=d.code,
                student_count=cnt,
                average_gpa=avg_dept_gpa
            ))

        # Semester Trends
        semester_trends = []
        terms = db.query(AcademicTerm).order_by(AcademicTerm.start_date.asc()).all()
        for term in terms:
            term_enrs = db.query(Enrollment).filter(Enrollment.term_id == term.id).all()
            term_grades = [
                float(e.grade.grade_points) for e in term_enrs
                if e.grade and e.grade.counts_in_gpa
            ]
            term_avg = Decimal(str(round(sum(term_grades) / len(term_grades), 2))) if term_grades else Decimal("0.00")
            semester_trends.append(SemesterTrendItem(
                term_code=term.code,
                term_name=term.name,
                average_gpa=term_avg,
                enrollments_count=len(term_enrs)
            ))

        # Grade Distribution
        grade_dist = []
        all_grades = [g[0] for g in db.query(Grade.letter_grade).all()]
        total_grade_count = len(all_grades) if all_grades else 1
        common_letters = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "D", "F"]
        for letter in common_letters:
            cnt = all_grades.count(letter)
            pct = round((cnt / total_grade_count) * 100, 1) if all_grades else 0.0
            grade_dist.append(GradeDistributionItem(
                letter_grade=letter,
                count=cnt,
                percentage=pct
            ))

        return FullAnalyticsReport(
            overview=overview,
            gpa_distribution=gpa_distribution,
            department_performance=dept_perf,
            semester_trends=semester_trends,
            grade_distribution=grade_dist
        )
