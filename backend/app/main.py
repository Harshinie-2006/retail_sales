import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .config import settings
from .database import engine, Base, SessionLocal
from .models import User
from .security import hash_password
from .routes import auth, dataset, analytics, forecast, promotions, elasticity, export, audit

# Initialize database schema
Base.metadata.create_all(bind=engine)

# Pre-seed demo users if database is empty
def seed_initial_users():
    db = SessionLocal()
    try:
        for email, pw, role in [
            ("admin@shelfsignal.com", "AdminSecure2026!", "admin"),
            ("analyst@shelfsignal.com", "AnalystSecure2026!", "analyst")
        ]:
            if not db.query(User).filter(User.email == email).first():
                db.add(User(
                    email=email,
                    hashed_password=hash_password(pw),
                    role=role,
                    is_active=True
                ))
        db.commit()
    finally:
        db.close()

seed_initial_users()

# Rate limiter setup
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    yield
    # Shutdown actions

app = FastAPI(
    title=settings.APP_NAME,
    description="Analytics and forecasting tool for retail pricing and promotions",
    version="1.0.0",
    lifespan=lifespan
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Cybersecurity Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-eval' https://fonts.googleapis.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com data:; "
        "img-src 'self' data: blob:; "
        "connect-src 'self' http://localhost:* http://127.0.0.1:*;"
    )
    return response

# Register API Routers
api_prefix = "/api"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(dataset.router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)
app.include_router(forecast.router, prefix=api_prefix)
app.include_router(promotions.router, prefix=api_prefix)
app.include_router(elasticity.router, prefix=api_prefix)
app.include_router(export.router, prefix=api_prefix)
app.include_router(audit.router, prefix=api_prefix)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT
    }
