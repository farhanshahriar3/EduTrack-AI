import io
import csv
import re
from datetime import datetime, date
from decimal import Decimal
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.student import Student
from app.models.department import Department

EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")
FORMULA_CHARS = ("=", "+", "-", "@", "\t", "\r")

class CSVService:
    REQUIRED_HEADERS = [
        "registration_id",
        "first_name",
        "last_name",
        "email",
        "department_code",
        "enrollment_date",
        "current_semester",
        "academic_status"
    ]

    @staticmethod
    def sanitize_cell_for_export(val: Any) -> str:
        """Prevent CSV / Formula Injection vulnerabilities."""
        if val is None:
            return ""
        str_val = str(val).strip()
        if str_val.startswith(FORMULA_CHARS):
            return f"'{str_val}"
        return str_val

    @classmethod
    def export_students_csv(cls, students: List[Student]) -> str:
        """Exports a list of students to safe CSV format."""
        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

        headers = [
            "Registration ID",
            "First Name",
            "Last Name",
            "Email",
            "Department Code",
            "Department Name",
            "Enrollment Date",
            "Current Semester",
            "Academic Status",
            "Cumulative GPA",
            "Completed Credits",
            "Phone"
        ]
        writer.writerow(headers)

        for s in students:
            row = [
                cls.sanitize_cell_for_export(s.registration_id),
                cls.sanitize_cell_for_export(s.first_name),
                cls.sanitize_cell_for_export(s.last_name),
                cls.sanitize_cell_for_export(s.email),
                cls.sanitize_cell_for_export(s.department.code if s.department else ""),
                cls.sanitize_cell_for_export(s.department.name if s.department else ""),
                cls.sanitize_cell_for_export(s.enrollment_date.isoformat() if s.enrollment_date else ""),
                cls.sanitize_cell_for_export(s.current_semester),
                cls.sanitize_cell_for_export(s.academic_status),
                cls.sanitize_cell_for_export(s.cumulative_gpa),
                cls.sanitize_cell_for_export(s.completed_credits),
                cls.sanitize_cell_for_export(s.phone or "")
            ]
            writer.writerow(row)

        return output.getvalue()

    @classmethod
    def preview_and_validate_csv(
        cls,
        file_content: str,
        db: Session,
        max_preview_rows: int = 5
    ) -> Dict[str, Any]:
        """Validates CSV rows and provides a preview with error report."""
        reader = csv.DictReader(io.StringIO(file_content))
        if not reader.fieldnames:
            return {
                "valid": False,
                "error": "CSV file is empty or missing headers",
                "preview": [],
                "errors": [],
                "summary": {"total_rows": 0, "valid_rows": 0, "error_rows": 0}
            }

        cleaned_headers = [h.strip().lower() for h in reader.fieldnames if h]
        missing_headers = [h for h in cls.REQUIRED_HEADERS if h not in cleaned_headers]
        if missing_headers:
            return {
                "valid": False,
                "error": f"Missing required CSV columns: {', '.join(missing_headers)}",
                "preview": [],
                "errors": [],
                "summary": {"total_rows": 0, "valid_rows": 0, "error_rows": 0}
            }

        # Cache existing departments for fast lookup
        depts = {d.code.upper(): d.id for d in db.query(Department).all()}
        
        # Cache existing student IDs and emails to detect duplicates against DB
        existing_reg_ids = set(r[0] for r in db.query(Student.registration_id).all())
        existing_emails = set(e[0].lower() for e in db.query(Student.email).all())

        seen_file_reg_ids = set()
        seen_file_emails = set()

        preview_rows = []
        errors = []
        valid_rows = []

        row_idx = 1
        for row in reader:
            row_idx += 1
            # Clean keys
            clean_row = {k.strip().lower(): (v.strip() if v else "") for k, v in row.items() if k}
            row_errors = []

            reg_id = clean_row.get("registration_id", "")
            first_name = clean_row.get("first_name", "")
            last_name = clean_row.get("last_name", "")
            email = clean_row.get("email", "").lower()
            dept_code = clean_row.get("department_code", "").upper()
            enroll_date_str = clean_row.get("enrollment_date", "")
            semester_str = clean_row.get("current_semester", "")
            status = clean_row.get("academic_status", "ACTIVE").upper()
            phone = clean_row.get("phone", "")

            # Validation
            if not reg_id:
                row_errors.append("Registration ID is required")
            elif reg_id in existing_reg_ids:
                row_errors.append(f"Registration ID '{reg_id}' already exists in database")
            elif reg_id in seen_file_reg_ids:
                row_errors.append(f"Duplicate Registration ID '{reg_id}' within CSV file")
            else:
                seen_file_reg_ids.add(reg_id)

            if not first_name:
                row_errors.append("First name is required")
            if not last_name:
                row_errors.append("Last name is required")

            if not email:
                row_errors.append("Email is required")
            elif not EMAIL_REGEX.match(email):
                row_errors.append(f"Invalid email format: '{email}'")
            elif email in existing_emails:
                row_errors.append(f"Email '{email}' already registered in database")
            elif email in seen_file_emails:
                row_errors.append(f"Duplicate email '{email}' within CSV file")
            else:
                seen_file_emails.add(email)

            if dept_code not in depts:
                row_errors.append(f"Department code '{dept_code}' not found")

            # Parse date
            parsed_date = None
            if enroll_date_str:
                for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y"):
                    try:
                        parsed_date = datetime.strptime(enroll_date_str, fmt).date()
                        break
                    except ValueError:
                        pass
                if not parsed_date:
                    row_errors.append(f"Invalid date format '{enroll_date_str}' (expected YYYY-MM-DD)")
            else:
                parsed_date = date.today()

            # Parse semester
            try:
                semester = int(semester_str) if semester_str else 1
                if semester < 1 or semester > 12:
                    row_errors.append(f"Semester must be between 1 and 12 (got {semester})")
            except ValueError:
                row_errors.append(f"Invalid semester number '{semester_str}'")
                semester = 1

            if status not in ("ACTIVE", "PROBATION", "SUSPENDED", "GRADUATED", "WITHDRAWN"):
                row_errors.append(f"Invalid academic status '{status}'")

            parsed_record = {
                "row_number": row_idx,
                "registration_id": reg_id,
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
                "department_id": depts.get(dept_code),
                "department_code": dept_code,
                "enrollment_date": parsed_date.isoformat() if parsed_date else None,
                "current_semester": semester,
                "academic_status": status,
                "phone": phone or None,
                "errors": row_errors,
                "is_valid": len(row_errors) == 0
            }

            if len(preview_rows) < max_preview_rows:
                preview_rows.append(parsed_record)

            if row_errors:
                errors.append({"row": row_idx, "registration_id": reg_id, "errors": row_errors})
            else:
                valid_rows.append(parsed_record)

        total_rows = len(valid_rows) + len(errors)
        return {
            "valid": len(errors) == 0,
            "total_rows": total_rows,
            "valid_count": len(valid_rows),
            "error_count": len(errors),
            "preview": preview_rows,
            "errors": errors,
            "valid_records": valid_rows
        }

    @classmethod
    def execute_import(cls, valid_records: List[Dict[str, Any]], db: Session) -> int:
        """Executes transaction insertion for validated records."""
        imported_count = 0
        for rec in valid_records:
            enroll_date = (
                datetime.strptime(rec["enrollment_date"], "%Y-%m-%d").date()
                if rec["enrollment_date"] else date.today()
            )
            student = Student(
                registration_id=rec["registration_id"],
                first_name=rec["first_name"],
                last_name=rec["last_name"],
                email=rec["email"],
                phone=rec.get("phone"),
                department_id=rec["department_id"],
                enrollment_date=enroll_date,
                current_semester=rec["current_semester"],
                academic_status=rec["academic_status"],
                cumulative_gpa=Decimal("0.00"),
                completed_credits=0,
                is_archived=False
            )
            db.add(student)
            imported_count += 1

        db.commit()
        return imported_count
