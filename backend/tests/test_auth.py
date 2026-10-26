import pytest

def test_register_success(client):
    res = client.post("/api/auth/register", json={
        "email": "test_analyst@example.com",
        "password": "SecurePassword2026!",
        "role": "analyst"
    })
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "test_analyst@example.com"
    assert data["role"] == "analyst"
    assert "password" not in data

def test_register_weak_password_rejected(client):
    res = client.post("/api/auth/register", json={
        "email": "weak@example.com",
        "password": "short",
        "role": "analyst"
    })
    assert res.status_code == 422 or res.status_code == 400

def test_register_common_password_rejected(client):
    res = client.post("/api/auth/register", json={
        "email": "common@example.com",
        "password": "password123",
        "role": "analyst"
    })
    assert res.status_code == 400
    assert "common" in res.json()["detail"].lower()

def test_login_success_and_cookie_generation(client):
    # Register user first
    client.post("/api/auth/register", json={
        "email": "login_user@example.com",
        "password": "ValidLogin2026!",
        "role": "analyst"
    })

    res = client.post("/api/auth/login", json={
        "email": "login_user@example.com",
        "password": "ValidLogin2026!"
    })
    assert res.status_code == 200
    assert "access_token" in res.json()
    # Check cookies
    cookies = res.cookies
    assert "shelf_access_token" in cookies
    assert "shelf_refresh_token" in cookies
    assert "shelf_csrf_token" in cookies

def test_login_invalid_password(client):
    res = client.post("/api/auth/login", json={
        "email": "login_user@example.com",
        "password": "WrongPassword999!"
    })
    assert res.status_code == 401
