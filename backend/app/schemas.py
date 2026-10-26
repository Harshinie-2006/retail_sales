from datetime import datetime
from typing import Any, Optional, Dict, List
from pydantic import BaseModel, EmailStr, Field

# Auth schemas
class UserRegister(BaseModel):
    email: str = Field(..., min_length=5, max_length=255, pattern=r"^[^@]+@[^@]+\.[^@]+$")
    password: str = Field(..., min_length=8, description="Minimum 8 characters with letters and numbers")
    role: Optional[str] = Field("analyst", pattern="^(analyst|admin)$")

class UserLogin(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# Dataset schemas
class SheetSummary(BaseModel):
    sheet_name: str
    rows: int
    columns: List[str]

class DatasetValidationReport(BaseModel):
    valid: bool
    filename: str
    size_bytes: int
    sheets_found: List[str]
    missing_required_sheets: List[str]
    sheet_details: List[SheetSummary]
    date_range: Optional[Dict[str, str]] = None
    outliers: Dict[str, int]
    warnings: List[str] = []
    errors: List[str] = []

class DatasetOut(BaseModel):
    id: str
    filename: str
    row_count: int
    weeks_count: int
    stores_count: int
    products_count: int
    min_date: Optional[str]
    max_date: Optional[str]
    validation_report: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Forecast schemas
class ModelMetric(BaseModel):
    model: str
    val_MAE: float
    val_RMSE: float
    val_WAPE_pct: float
    val_R2: float
    val_n: int
    test_MAE: float
    test_RMSE: float
    test_WAPE_pct: float
    test_R2: float
    test_n: int

class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float

class ForecastStartRequest(BaseModel):
    dataset_id: Optional[str] = None
    sample_mode: bool = False

class ForecastStatusResponse(BaseModel):
    id: str
    status: str
    progress: int
    current_step: str
    best_model: Optional[str] = None
    error_message: Optional[str] = None

# Elasticity & Simulation schemas
class ElasticityItem(BaseModel):
    category: str
    elasticity: float
    std_err: float
    n: int
    ci_lower: float
    ci_upper: float
    interpretation: str

class ElasticitySimulateRequest(BaseModel):
    category: str
    price_change_pct: float = Field(..., ge=-50.0, le=50.0)

class ElasticitySimulateResponse(BaseModel):
    category: str
    price_change_pct: float
    expected_units_change_pct: float
    expected_revenue_change_pct: float
    confidence_interval_95: Dict[str, float]
    disclaimer: str

# Audit Log schemas
class AuditLogOut(BaseModel):
    id: str
    user_email: str
    action: str
    resource_type: Optional[str]
    resource_id: Optional[str]
    ip_address: Optional[str]
    details: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
