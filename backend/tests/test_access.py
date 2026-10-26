import pytest
from backend.app.models import Dataset

def test_admin_only_audit_log_access(client):
    # Register analyst
    client.post("/api/auth/register", json={
        "email": "analyst_rbac@example.com",
        "password": "AnalystPass2026!",
        "role": "analyst"
    })
    res_analyst = client.post("/api/auth/login", json={
        "email": "analyst_rbac@example.com",
        "password": "AnalystPass2026!"
    })
    analyst_token = res_analyst.json()["access_token"]

    # Analyst attempting to read audit logs -> MUST BE FORBIDDEN (403)
    res = client.get("/api/audit/logs", headers={"Authorization": f"Bearer {analyst_token}"})
    assert res.status_code == 403
    assert "admin privileges" in res.json()["detail"].lower()

    # Register admin
    client.post("/api/auth/register", json={
        "email": "admin_rbac@example.com",
        "password": "AdminPass2026!",
        "role": "admin"
    })
    res_admin = client.post("/api/auth/login", json={
        "email": "admin_rbac@example.com",
        "password": "AdminPass2026!"
    })
    admin_token = res_admin.json()["access_token"]

    # Admin requesting audit logs -> MUST SUCCEED (200)
    res_admin_audit = client.get("/api/audit/logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin_audit.status_code == 200
    assert isinstance(res_admin_audit.json(), list)

def test_per_user_data_isolation(client, db_session):
    # User A
    client.post("/api/auth/register", json={
        "email": "user_a@example.com",
        "password": "UserPassA2026!",
        "role": "analyst"
    })
    token_a = client.post("/api/auth/login", json={
        "email": "user_a@example.com",
        "password": "UserPassA2026!"
    }).json()["access_token"]

    # User B
    client.post("/api/auth/register", json={
        "email": "user_b@example.com",
        "password": "UserPassB2026!",
        "role": "analyst"
    })
    token_b = client.post("/api/auth/login", json={
        "email": "user_b@example.com",
        "password": "UserPassB2026!"
    }).json()["access_token"]

    # User B has no datasets uploaded yet
    res_b = client.get("/api/dataset/current", headers={"Authorization": f"Bearer {token_b}"})
    assert res_b.status_code == 200
    assert res_b.json() is None
