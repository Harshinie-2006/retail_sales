import json
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AuditLog, User
from ..schemas import AuditLogOut
from ..deps import require_admin

router = APIRouter(prefix="/audit", tags=["Audit Log"])

@router.get("/logs", response_model=List[AuditLogOut])
def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    user_email: Optional[str] = None,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action.contains(action))
    if user_email:
        query = query.filter(AuditLog.user_email.contains(user_email.lower()))

    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()

    results = []
    for log in logs:
        details_dict = None
        if log.details:
            try:
                details_dict = json.loads(log.details)
            except Exception:
                details_dict = {"raw": log.details}
        
        results.append(AuditLogOut(
            id=log.id,
            user_email=log.user_email,
            action=log.action,
            resource_type=log.resource_type,
            resource_id=log.resource_id,
            ip_address=log.ip_address,
            details=details_dict,
            created_at=log.created_at
        ))
    return results
