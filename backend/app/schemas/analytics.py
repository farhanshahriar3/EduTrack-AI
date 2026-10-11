from typing import List
from decimal import Decimal
from pydantic import BaseModel

class AnalyticsOverview(BaseModel):
    total_students: int
    total_active_students: int
    total_departments: int
    average_gpa: Decimal
    students_needing_review: int
    total_courses: int
    total_enrollments: int

class GpaDistributionItem(BaseModel):
    range: str
    count: int
    percentage: float

class DepartmentPerformanceItem(BaseModel):
    department_name: str
    department_code: str
    student_count: int
    average_gpa: Decimal

class SemesterTrendItem(BaseModel):
    term_code: str
    term_name: str
    average_gpa: Decimal
    enrollments_count: int

class GradeDistributionItem(BaseModel):
    letter_grade: str
    count: int
    percentage: float

class FullAnalyticsReport(BaseModel):
    overview: AnalyticsOverview
    gpa_distribution: List[GpaDistributionItem]
    department_performance: List[DepartmentPerformanceItem]
    semester_trends: List[SemesterTrendItem]
    grade_distribution: List[GradeDistributionItem]
