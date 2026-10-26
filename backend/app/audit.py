import json
from typing import Optional, Any, Dict
from fastapi import Request
from sqlalchemy.orm import Session
from .models import AuditLog, User

def log_event(
    db: Session,
    action: str,
    user: Optional[User] = None,
    user_email: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    request: Optional[Request] = None,
    details: Optional[Dict[str, Any]] = None,
) -> AuditLog:
    email = user.email if user else (user_email or "system@shelfsignal.local")
    uid = user.id if user else None
    
    ip = None
    if request:
        ip = request.client.host if request.client else None
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip = forwarded.split(",")[0].strip()

    # Never log sensitive keys
    safe_details = {}
    if details:
        for k, v in details.items():
            if any(s in k.lower() for s in ["password", "token", "secret", "cookie", "auth"]):
                safe_details[k] = "[REDACTED]"
            else:
                safe_details[k] = v

    audit_entry = AuditLog(
        user_id=uid,
        user_email=email,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=ip,
        details=json.dumps(safe_details) if safe_details else None
    )
    db.add(audit_entry)
    db.commit()
    return audit_entry
