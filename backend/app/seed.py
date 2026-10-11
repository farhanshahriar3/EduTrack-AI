from datetime import date, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.models.department import Department
from app.models.academic import AcademicTerm, Course, Enrollment, Grade, GradingPolicy
from app.models.student import Student
from app.services.gpa_calculator import GPACalculator, DEFAULT_SCALE_CONFIG

def seed_initial_data(db: Session):
    # 1. Seed Grading Policy
    policy = db.query(GradingPolicy).first()
    if not policy:
        policy = GradingPolicy(
            name="Standard 4.0 Scale",
            is_active=True,
            scale_config=DEFAULT_SCALE_CONFIG,
            pass_min_points=Decimal("2.00"),
            probation_gpa_threshold=Decimal("2.00")
        )
        db.add(policy)
        db.commit()

    # 2. Seed Default Admin
    admin_user = db.query(User).filter(User.email == settings.FIRST_ADMIN_EMAIL).first()
    if not admin_user:
        admin_user = User(
            email=settings.FIRST_ADMIN_EMAIL,
            hashed_password=get_password_hash(settings.FIRST_ADMIN_PASSWORD),
            full_name=settings.FIRST_ADMIN_NAME,
            role="ADMIN",
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print(f"[Seed] Created Administrator: {admin_user.email}")

    # 3. Seed Faculty/Teacher
    teacher = db.query(User).filter(User.email == "teacher@edutrack.edu").first()
    if not teacher:
        teacher = User(
            email="teacher@edutrack.edu",
            hashed_password=get_password_hash("Teacher@2026"),
            full_name="Prof. Sarah Jenkins",
            role="TEACHER",
            is_active=True
        )
        db.add(teacher)
        db.commit()
        db.refresh(teacher)
        print(f"[Seed] Created Faculty: {teacher.email}")

    # 4. Seed Departments
    dept_data = [
        {"code": "CS", "name": "Computer Science & Engineering", "description": "Software, systems, AI & cybersecurity"},
        {"code": "EE", "name": "Electrical & Electronic Engineering", "description": "Circuits, embedded systems & robotics"},
        {"code": "MATH", "name": "Mathematics & Statistics", "description": "Calculus, linear algebra, discrete structures"},
        {"code": "BUS", "name": "Business & Management", "description": "Finance, management, marketing & economics"},
    ]
    created_depts = {}
    for d in dept_data:
        dept = db.query(Department).filter(Department.code == d["code"]).first()
        if not dept:
            dept = Department(code=d["code"], name=d["name"], description=d["description"])
            db.add(dept)
            db.commit()
            db.refresh(dept)
        created_depts[d["code"]] = dept

    # 5. Seed Academic Terms
    terms_data = [
        {"code": "FALL-2024", "name": "Fall Semester 2024", "start": date(2024, 9, 1), "end": date(2024, 12, 20), "current": False},
        {"code": "SPRING-2025", "name": "Spring Semester 2025", "start": date(2025, 1, 15), "end": date(2025, 5, 15), "current": False},
        {"code": "FALL-2025", "name": "Fall Semester 2025", "start": date(2025, 9, 1), "end": date(2025, 12, 20), "current": False},
        {"code": "SPRING-2026", "name": "Spring Semester 2026", "start": date(2026, 1, 15), "end": date(2026, 5, 20), "current": True},
    ]
    created_terms = {}
    for t in terms_data:
        term = db.query(AcademicTerm).filter(AcademicTerm.code == t["code"]).first()
        if not term:
            term = AcademicTerm(
                code=t["code"],
                name=t["name"],
                start_date=t["start"],
                end_date=t["end"],
                is_current=t["current"]
            )
            db.add(term)
            db.commit()
            db.refresh(term)
        created_terms[t["code"]] = term

    # 6. Seed Courses
    courses_data = [
        {"code": "CS101", "title": "Introduction to Programming", "dept": "CS", "credits": Decimal("3.0"), "instructor": teacher.id},
        {"code": "CS201", "title": "Data Structures & Algorithms", "dept": "CS", "credits": Decimal("4.0"), "instructor": teacher.id},
        {"code": "CS301", "title": "Database Management Systems", "dept": "CS", "credits": Decimal("3.0"), "instructor": teacher.id},
        {"code": "MATH101", "title": "Calculus & Analytical Geometry", "dept": "MATH", "credits": Decimal("3.0"), "instructor": None},
        {"code": "MATH201", "title": "Linear Algebra & Differential Eq", "dept": "MATH", "credits": Decimal("3.0"), "instructor": None},
        {"code": "EE101", "title": "Fundamentals of Electrical Engineering", "dept": "EE", "credits": Decimal("3.0"), "instructor": None},
        {"code": "BUS101", "title": "Principles of Management", "dept": "BUS", "credits": Decimal("3.0"), "instructor": None},
    ]
    created_courses = {}
    for c in courses_data:
        course = db.query(Course).filter(Course.code == c["code"]).first()
        if not course:
            course = Course(
                code=c["code"],
                title=c["title"],
                department_id=created_depts[c["dept"]].id,
                credits=c["credits"],
                instructor_id=c["instructor"],
                description=f"Course syllabus for {c['title']}"
            )
            db.add(course)
            db.commit()
            db.refresh(course)
        created_courses[c["code"]] = course

    # 7. Seed Sample Students
    student_records = [
        {
            "reg_id": "STU-2024-001",
            "first_name": "Alexander",
            "last_name": "Wright",
            "email": "alex.wright@edutrack.edu",
            "phone": "+1-555-0101",
            "dept": "CS",
            "enroll_date": date(2024, 9, 1),
            "semester": 4,
            "status": "ACTIVE",
            "grades": [
                ("CS101", "FALL-2024", 95.0),
                ("MATH101", "FALL-2024", 92.0),
                ("CS201", "SPRING-2025", 88.0),
                ("MATH201", "SPRING-2025", 85.0),
                ("CS301", "FALL-2025", 94.0)
            ]
        },
        {
            "reg_id": "STU-2024-002",
            "first_name": "Elena",
            "last_name": "Rostova",
            "email": "elena.rostova@edutrack.edu",
            "phone": "+1-555-0102",
            "dept": "CS",
            "enroll_date": date(2024, 9, 1),
            "semester": 4,
            "status": "ACTIVE",
            "grades": [
                ("CS101", "FALL-2024", 89.0),
                ("MATH101", "FALL-2024", 84.0),
                ("CS201", "SPRING-2025", 91.0),
                ("MATH201", "SPRING-2025", 87.0)
            ]
        },
        {
            "reg_id": "STU-2024-003",
            "first_name": "Marcus",
            "last_name": "Vance",
            "email": "marcus.vance@edutrack.edu",
            "phone": "+1-555-0103",
            "dept": "CS",
            "enroll_date": date(2024, 9, 1),
            "semester": 4,
            "status": "PROBATION",
            "grades": [
                ("CS101", "FALL-2024", 72.0),
                ("MATH101", "FALL-2024", 58.0),  # Failed
                ("CS201", "SPRING-2025", 62.0),
                ("MATH201", "SPRING-2025", 55.0)  # Failed
            ]
        },
        {
            "reg_id": "STU-2025-010",
            "first_name": "Sophia",
            "last_name": "Chen",
            "email": "sophia.chen@edutrack.edu",
            "phone": "+1-555-0104",
            "dept": "EE",
            "enroll_date": date(2025, 1, 15),
            "semester": 3,
            "status": "ACTIVE",
            "grades": [
                ("EE101", "SPRING-2025", 96.0),
                ("MATH101", "SPRING-2025", 94.0),
                ("CS101", "FALL-2025", 90.0)
            ]
        },
        {
            "reg_id": "STU-2025-015",
            "first_name": "David",
            "last_name": "Kim",
            "email": "david.kim@edutrack.edu",
            "phone": "+1-555-0105",
            "dept": "BUS",
            "enroll_date": date(2025, 9, 1),
            "semester": 2,
            "status": "ACTIVE",
            "grades": [
                ("BUS101", "FALL-2025", 86.0),
                ("MATH101", "FALL-2025", 81.0)
            ]
        },
        {
            "reg_id": "STU-2025-020",
            "first_name": "Maya",
            "last_name": "Patel",
            "email": "maya.patel@edutrack.edu",
            "phone": "+1-555-0106",
            "dept": "MATH",
            "enroll_date": date(2025, 9, 1),
            "semester": 2,
            "status": "ACTIVE",
            "grades": [
                ("MATH101", "FALL-2025", 98.0),
                ("CS101", "FALL-2025", 93.0)
            ]
        }
    ]

    for s_data in student_records:
        student = db.query(Student).filter(Student.registration_id == s_data["reg_id"]).first()
        if not student:
            # Create student user login for first student as demo
            user_id = None
            if s_data["reg_id"] == "STU-2024-001":
                stu_user = db.query(User).filter(User.email == s_data["email"]).first()
                if not stu_user:
                    stu_user = User(
                        email=s_data["email"],
                        hashed_password=get_password_hash("Student@2026"),
                        full_name=f"{s_data['first_name']} {s_data['last_name']}",
                        role="STUDENT",
                        is_active=True
                    )
                    db.add(stu_user)
                    db.commit()
                    db.refresh(stu_user)
                user_id = stu_user.id

            student = Student(
                registration_id=s_data["reg_id"],
                first_name=s_data["first_name"],
                last_name=s_data["last_name"],
                email=s_data["email"],
                phone=s_data["phone"],
                department_id=created_depts[s_data["dept"]].id,
                enrollment_date=s_data["enroll_date"],
                current_semester=s_data["semester"],
                academic_status=s_data["status"],
                user_id=user_id,
                cumulative_gpa=Decimal("0.00"),
                completed_credits=0,
                is_archived=False
            )
            db.add(student)
            db.commit()
            db.refresh(student)

            # Add enrollments and grades
            for course_code, term_code, score in s_data["grades"]:
                course = created_courses[course_code]
                term = created_terms[term_code]
                letter, points, passed = GPACalculator.score_to_grade_points(score, policy)

                enr = Enrollment(
                    student_id=student.id,
                    course_id=course.id,
                    term_id=term.id,
                    status="COMPLETED"
                )
                db.add(enr)
                db.commit()
                db.refresh(enr)

                grd = Grade(
                    enrollment_id=enr.id,
                    letter_grade=letter,
                    numeric_score=Decimal(str(score)),
                    grade_points=points,
                    is_passed=passed,
                    counts_in_gpa=True,
                    graded_by_user_id=teacher.id
                )
                db.add(grd)
                db.commit()

            # Recalculate GPA
            GPACalculator.update_student_academic_summary(student.id, db)
            print(f"[Seed] Created Student {student.registration_id} ({student.full_name}) - GPA: {student.cumulative_gpa}")

    print("[Seed] Initial dataset loaded successfully.")
