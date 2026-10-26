from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserRegister, UserLogin, UserOut, TokenResponse
from ..security import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, decode_token, generate_csrf_token
)
from ..audit import log_event
from ..config import settings
from ..deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, request: Request, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email address already exists."
        )

    hashed_pw = hash_password(payload.password)
    user = User(
        email=payload.email.lower(),
        hashed_password=hashed_pw,
        role=payload.role or "analyst",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_event(
        db=db,
        action="auth:register",
        user=user,
        resource_type="user",
        resource_id=user.id,
        request=request,
        details={"role": user.role}
    )

    return user

@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, request: Request, response: Response, db: Session = Depends(get_db)):
    email_clean = payload.email.lower()
    user = db.query(User).filter(User.email == email_clean).first()

    if not user:
        # Rate-limiting / timing attack defense
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    # Check if locked out
    if user.locked_until and user.locked_until > datetime.utcnow():
        rem = int((user.locked_until - datetime.utcnow()).total_seconds() / 60)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Account locked due to consecutive failed logins. Try again in {rem+1} minutes."
        )

    if not verify_password(payload.password, user.hashed_password):
        user.failed_attempts += 1
        if user.failed_attempts >= MAX_FAILED_ATTEMPTS:
            user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
            db.commit()
            log_event(db=db, action="auth:account_locked", user=user, request=request,
                      details={"failed_attempts": user.failed_attempts})
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many failed login attempts. Account locked for {LOCKOUT_MINUTES} minutes."
            )
        db.commit()
        log_event(db=db, action="auth:login_failed", user_email=email_clean, request=request,
                  details={"attempt": user.failed_attempts})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    # Successful login: reset failed attempts
    user.failed_attempts = 0
    user.locked_until = None
    db.commit()

    token_data = {"sub": user.id, "email": user.email, "role": user.role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    csrf_token = generate_csrf_token()

    # Set secure HttpOnly cookies
    response.set_cookie(
        key="shelf_access_token",
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    response.set_cookie(
        key="shelf_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/auth/refresh"
    )
    # CSRF cookie readable by JS for header injection
    response.set_cookie(
        key="shelf_csrf_token",
        value=csrf_token,
        httponly=False,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )

    log_event(db=db, action="auth:login_success", user=user, request=request)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )

@router.post("/logout")
def logout(request: Request, response: Response, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    response.delete_cookie("shelf_access_token", path="/")
    response.delete_cookie("shelf_refresh_token", path="/api/auth/refresh")
    response.delete_cookie("shelf_csrf_token", path="/")
    log_event(db=db, action="auth:logout", user=current_user, request=request)
    return {"message": "Logged out successfully"}

@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "user": UserOut.model_validate(current_user)
    }

@router.post("/refresh")
def refresh_token_endpoint(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_tok = request.cookies.get("shelf_refresh_token")
    if not refresh_tok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token cookie")
    
    payload = decode_token(refresh_tok)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
    
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive or removed")

    token_data = {"sub": user.id, "email": user.email, "role": user.role}
    new_access = create_access_token(token_data)
    new_csrf = generate_csrf_token()

    response.set_cookie(
        key="shelf_access_token",
        value=new_access,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    response.set_cookie(
        key="shelf_csrf_token",
        value=new_csrf,
        httponly=False,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    return {"access_token": new_access, "token_type": "bearer"}
