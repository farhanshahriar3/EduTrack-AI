from app.services.csv_service import CSVService

def test_formula_injection_sanitization():
    # Dangerous formula cells should be escaped with a leading single-quote
    assert CSVService.sanitize_cell_for_export("=cmd|' /C calc'!A0") == "'=cmd|' /C calc'!A0"
    assert CSVService.sanitize_cell_for_export("+12345") == "'+12345"
    assert CSVService.sanitize_cell_for_export("-SUM(A1:B1)") == "'-SUM(A1:B1)"
    assert CSVService.sanitize_cell_for_export("@HYPERLINK('bad')") == "'@HYPERLINK('bad')"
    # Safe text should remain unescaped
    assert CSVService.sanitize_cell_for_export("Regular Student Name") == "Regular Student Name"

def test_csv_preview_and_validation(db_session):
    valid_csv = (
        "registration_id,first_name,last_name,email,department_code,enrollment_date,current_semester,academic_status\n"
        "CSV-001,Robert,Smith,robert.smith@csv.edu,CS,2026-01-15,1,ACTIVE\n"
        "CSV-002,Maria,Garcia,maria.garcia@csv.edu,CS,2026-01-15,1,ACTIVE\n"
    )
    result = CSVService.preview_and_validate_csv(valid_csv, db_session)
    assert result["valid"] is True
    assert result["valid_count"] == 2
    assert result["error_count"] == 0
    assert len(result["preview"]) == 2

def test_csv_preview_missing_headers(db_session):
    bad_csv = "id,name,email\n1,Alice,alice@bad.com\n"
    result = CSVService.preview_and_validate_csv(bad_csv, db_session)
    assert result["valid"] is False
    assert "Missing required CSV columns" in result["error"]

def test_csv_preview_duplicate_detection(db_session):
    dup_csv = (
        "registration_id,first_name,last_name,email,department_code,enrollment_date,current_semester,academic_status\n"
        "CSV-DUP-1,Name1,Last1,same@csv.edu,CS,2026-01-15,1,ACTIVE\n"
        "CSV-DUP-1,Name2,Last2,other@csv.edu,CS,2026-01-15,1,ACTIVE\n"
    )
    result = CSVService.preview_and_validate_csv(dup_csv, db_session)
    assert result["valid"] is False
    assert result["error_count"] >= 1
    assert any("Duplicate Registration ID" in err["errors"][0] for err in result["errors"])
