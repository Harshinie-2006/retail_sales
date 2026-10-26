import os
import secrets
import zipfile
from datetime import datetime, timedelta
from typing import Optional, Tuple
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import HTTPException, status, Request
from .config import settings

# Argon2id password hasher with high-security configuration
ph = PasswordHasher(time_cost=2, memory_cost=102400, parallelism=8)

COMMON_PASSWORDS = {
    "password", "password123", "admin123", "12345678", "qwerty123",
    "welcome123", "shelfsignal", "retail123", "letmein123"
}

def validate_password_strength(password: str) -> None:
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )
    if password.lower() in COMMON_PASSWORDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is too common or easily guessable."
        )
    has_digit = any(c.isdigit() for c in password)
    has_letter = any(c.isalpha() for c in password)
    if not (has_digit and has_letter):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain both letters and digits."
        )

def hash_password(password: str) -> str:
    validate_password_strength(password)
    return ph.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return ph.verify(hashed_password, plain_password)
    except VerifyMismatchError:
        return False
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials token")

def generate_csrf_token() -> str:
    return secrets.token_hex(32)

def verify_csrf_token(request: Request, cookie_csrf: Optional[str]) -> bool:
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return True
    header_csrf = request.headers.get("X-CSRF-Token")
    if not header_csrf or not cookie_csrf or not secrets.compare_digest(header_csrf, cookie_csrf):
        return False
    return True

# File upload hardening & security checks
XLSX_ZIP_MAGIC = b"PK\x03\x04"
MAX_UNCOMPRESSED_RATIO = 100 # Defense against zip bomb

def validate_xlsx_file_safety(file_bytes: bytes, filename: str) -> Tuple[bool, str]:
    if not filename.lower().endswith(".xlsx"):
        return False, "File extension must be .xlsx only"
    
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
        return False, f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)} MB"
    
    if len(file_bytes) < 4 or file_bytes[:4] != XLSX_ZIP_MAGIC:
        return False, "Invalid file format: file signature does not match genuine Excel workbook (.xlsx)"

    # Inspect zip structure for zip-bomb defense and macro parts
    import io
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes), 'r') as z:
            total_uncompressed = 0
            for info in z.infolist():
                total_uncompressed += info.file_size
                # Reject macros, vbaProject, or external executable parts
                name_lower = info.filename.lower()
                if "vbaproject" in name_lower or "vba" in name_lower and "printer" not in name_lower or "macro" in name_lower or name_lower.endswith((".exe", ".dll", ".bat", ".cmd", ".scr", ".vbs", ".ps1")):
                    return False, "Security rejection: workbook contains macro or binary executable components."
            
            # Zip bomb threshold check
            if total_uncompressed > len(file_bytes) * MAX_UNCOMPRESSED_RATIO and total_uncompressed > 150 * 1024 * 1024:
                return False, "Security rejection: suspicious compression ratio detected (zip bomb prevention)."
    except zipfile.BadZipFile:
        return False, "Corrupted or invalid zip archive."
    except Exception as e:
        return False, f"Archive inspection error: {str(e)}"
    
    return True, "Valid"
