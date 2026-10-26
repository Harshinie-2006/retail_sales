import io
import pytest

def get_auth_token(client, email="uploader@example.com"):
    client.post("/api/auth/register", json={
        "email": email,
        "password": "UploadPass2026!",
        "role": "analyst"
    })
    res = client.post("/api/auth/login", json={
        "email": email,
        "password": "UploadPass2026!"
    })
    return res.json()["access_token"]

def test_reject_wrong_extension(client):
    token = get_auth_token(client)
    fake_csv = io.BytesIO(b"col1,col2\nval1,val2")
    res = client.post(
        "/api/dataset/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("dataset.csv", fake_csv, "text/csv")}
    )
    assert res.status_code == 400
    assert "xlsx only" in res.json()["detail"].lower()

def test_reject_fake_xlsx_magic_bytes(client):
    token = get_auth_token(client)
    # File named .xlsx but with plain text (not PK\x03\x04 zip signature)
    fake_content = io.BytesIO(b"This is completely fake binary content not a zip")
    res = client.post(
        "/api/dataset/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("spoofed.xlsx", fake_content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    )
    assert res.status_code == 400
    assert "signature" in res.json()["detail"].lower() or "validation failed" in res.json()["detail"].lower()

def test_reject_unauthenticated_upload(client):
    fake_content = io.BytesIO(b"PK\x03\x04somedata")
    res = client.post(
        "/api/dataset/upload",
        files={"file": ("sample.xlsx", fake_content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    )
    assert res.status_code == 401
