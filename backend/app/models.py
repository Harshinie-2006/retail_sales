import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="analyst", nullable=False) # 'analyst' or 'admin'
    is_active = Column(Boolean, default=True, nullable=False)
    failed_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    datasets = relationship("Dataset", back_populates="owner", cascade="all, delete-orphan")
    forecast_runs = relationship("ForecastRun", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(512), nullable=False)
    file_hash = Column(String(64), nullable=False)
    row_count = Column(Integer, default=0)
    weeks_count = Column(Integer, default=0)
    stores_count = Column(Integer, default=0)
    products_count = Column(Integer, default=0)
    min_date = Column(String(30), nullable=True)
    max_date = Column(String(30), nullable=True)
    validation_report = Column(Text, nullable=True) # JSON string
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="datasets")
    forecast_runs = relationship("ForecastRun", back_populates="dataset", cascade="all, delete-orphan")

class ForecastRun(Base):
    __tablename__ = "forecast_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=True, index=True)
    status = Column(String(20), default="pending", nullable=False) # pending, running, completed, failed
    progress = Column(Integer, default=0) # 0 to 100
    current_step = Column(String(255), default="Initialized")
    best_model = Column(String(100), nullable=True)
    metrics_json = Column(Text, nullable=True)
    feature_importance_json = Column(Text, nullable=True)
    promo_lift_json = Column(Text, nullable=True)
    elasticity_json = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="forecast_runs")
    dataset = relationship("Dataset", back_populates="forecast_runs")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    user_email = Column(String(255), nullable=False)
    action = Column(String(100), nullable=False) # e.g., 'auth:login', 'dataset:upload', 'forecast:start', 'export:pdf'
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(String(36), nullable=True)
    ip_address = Column(String(45), nullable=True)
    details = Column(Text, nullable=True) # JSON string
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="audit_logs")
