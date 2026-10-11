def test_create_student_success(client, admin_token):
    payload = {
        "registration_id": "TEST-2026-001",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@test.edu",
        "phone": "+1-555-9999",
        "department_id": 1,
        "enrollment_date": "2026-01-10",
        "current_semester": 1,
        "academic_status": "ACTIVE"
    }
    response = client.post(
        "/api/v1/students",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["registration_id"] == "TEST-2026-001"
    assert data["first_name"] == "John"
    assert data["cumulative_gpa"] == "0.00"

def test_create_duplicate_student_fails(client, admin_token):
    payload = {
        "registration_id": "DUP-2026-001",
        "first_name": "Jane",
        "last_name": "Doe",
        "email": "jane.doe@test.edu",
        "department_id": 1,
        "enrollment_date": "2026-01-10",
        "current_semester": 1,
        "academic_status": "ACTIVE"
    }
    res1 = client.post("/api/v1/students", json=payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert res1.status_code == 201

    # Try duplicate registration ID
    payload_dup_reg = payload.copy()
    payload_dup_reg["email"] = "different@test.edu"
    res2 = client.post("/api/v1/students", json=payload_dup_reg, headers={"Authorization": f"Bearer {admin_token}"})
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]

    # Try duplicate email
    payload_dup_email = payload.copy()
    payload_dup_email["registration_id"] = "DIFF-2026-002"
    res3 = client.post("/api/v1/students", json=payload_dup_email, headers={"Authorization": f"Bearer {admin_token}"})
    assert res3.status_code == 400
    assert "already registered" in res3.json()["detail"]

def test_teacher_cannot_create_student(client, teacher_token):
    payload = {
        "registration_id": "TEACH-FAIL-01",
        "first_name": "Test",
        "last_name": "User",
        "email": "teacher.fail@test.edu",
        "department_id": 1,
        "enrollment_date": "2026-01-10",
        "current_semester": 1,
        "academic_status": "ACTIVE"
    }
    response = client.post("/api/v1/students", json=payload, headers={"Authorization": f"Bearer {teacher_token}"})
    assert response.status_code == 403

def test_list_students_search_and_pagination(client, admin_token):
    # Create two students
    for idx in range(1, 4):
        client.post(
            "/api/v1/students",
            json={
                "registration_id": f"PAG-2026-00{idx}",
                "first_name": f"Student{idx}",
                "last_name": "Test",
                "email": f"student{idx}@page.edu",
                "department_id": 1,
                "enrollment_date": "2026-01-10",
                "current_semester": 2,
                "academic_status": "ACTIVE"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )

    # Test search
    res = client.get(
        "/api/v1/students?search=Student2",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert any(s["first_name"] == "Student2" for s in data["items"])

    # Test pagination
    res_page = client.get(
        "/api/v1/students?page=1&page_size=2",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_page.status_code == 200
    page_data = res_page.json()
    assert len(page_data["items"]) <= 2
    assert page_data["page_size"] == 2
