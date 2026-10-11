def test_login_success(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "testadmin@edutrack.edu", "password": "AdminPass123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "testadmin@edutrack.edu"
    assert data["user"]["role"] == "ADMIN"

def test_login_invalid_credentials(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "testadmin@edutrack.edu", "password": "WrongPassword"}
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

def test_protected_endpoint_without_token(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401

def test_rbac_admin_access_allowed(client, admin_token):
    response = client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200

def test_rbac_student_access_forbidden(client, student_token):
    response = client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 403
    assert "Operation not permitted" in response.json()["detail"]

def test_teacher_can_register_and_update_profile(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "new.teacher@edutrack.edu",
            "full_name": "New Faculty Member",
            "password": "TeacherPass456!",
            "role": "TEACHER",
        },
    )
    assert response.status_code == 201
    token = response.json()["access_token"]

    profile = client.patch(
        "/api/v1/auth/me",
        json={"full_name": "Updated Faculty Member", "email": "updated.teacher@edutrack.edu"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert profile.status_code == 200
    assert profile.json()["full_name"] == "Updated Faculty Member"

    current = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert current.status_code == 200
    assert current.json()["email"] == "updated.teacher@edutrack.edu"

def test_student_registration_creates_linked_profile(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "new.student@edutrack.edu",
            "full_name": "New Student",
            "password": "StudentPass456!",
            "role": "STUDENT",
            "department_id": 1,
            "phone": "555-0199",
        },
    )
    assert response.status_code == 201
    token = response.json()["access_token"]
    current = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert current.status_code == 200
    assert current.json()["student_profile"]["registration_id"].startswith("STU-")
    assert current.json()["student_profile"]["phone"] == "555-0199"
