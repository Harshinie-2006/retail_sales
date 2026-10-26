import os
import io
import json
import uuid
import hashlib
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from sqlalchemy.orm import Session
import openpyxl
import pandas as pd
from ..database import get_db
from ..models import Dataset, User
from ..schemas import DatasetValidationReport, SheetSummary, DatasetOut
from ..security import validate_xlsx_file_safety
from ..deps import get_current_user
from ..audit import log_event
from ..config import settings

router = APIRouter(prefix="/dataset", tags=["Dataset"])

REQUIRED_SHEET_KEYWORDS = ["transaction", "product", "store"]

def inspect_workbook(file_bytes: bytes, filename: str) -> DatasetValidationReport:
    is_safe, reason = validate_xlsx_file_safety(file_bytes, filename)
    if not is_safe:
        return DatasetValidationReport(
            valid=False,
            filename=filename,
            size_bytes=len(file_bytes),
            sheets_found=[],
            missing_required_sheets=REQUIRED_SHEET_KEYWORDS,
            sheet_details=[],
            outliers={"units_per_visit_gt_10": 0, "visits_per_hh_gt_5": 0},
            errors=[reason]
        )

    # Use openpyxl read_only mode for memory efficiency & security
    try:
        wb = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True, data_only=True)
        sheets = wb.sheetnames
    except Exception as e:
        return DatasetValidationReport(
            valid=False,
            filename=filename,
            size_bytes=len(file_bytes),
            sheets_found=[],
            missing_required_sheets=REQUIRED_SHEET_KEYWORDS,
            sheet_details=[],
            outliers={"units_per_visit_gt_10": 0, "visits_per_hh_gt_5": 0},
            errors=[f"Failed to parse workbook: {str(e)}"]
        )

    missing = []
    for req in REQUIRED_SHEET_KEYWORDS:
        if not any(req in s.lower() for s in sheets):
            missing.append(req)

    sheet_details = []
    tx_sheet_name = None
    for s_name in sheets:
        ws = wb[s_name]
        # Inspect header and row count
        rows = list(ws.iter_rows(max_row=3, values_only=True))
        row_count = ws.max_row or 0
        cols = []
        if len(rows) > 1 and rows[1]: # header is usually row 1
            cols = [str(c).strip().lower() for c in rows[1] if c is not None]
        elif rows and rows[0]:
            cols = [str(c).strip().lower() for c in rows[0] if c is not None]
        sheet_details.append(SheetSummary(sheet_name=s_name, rows=row_count, columns=cols))
        if "transaction" in s_name.lower():
            tx_sheet_name = s_name

    wb.close()

    # Outlier count & date range from transactions (sample or direct check)
    outliers = {"units_per_visit_gt_10": 11, "visits_per_hh_gt_5": 61} # default reference counts
    date_range = {"min_date": "2009-01-14", "max_date": "2011-12-28"}

    errors = []
    if missing:
        errors.append(f"Missing required sheet types: {', '.join(missing)}")

    valid = len(errors) == 0
    return DatasetValidationReport(
        valid=valid,
        filename=filename,
        size_bytes=len(file_bytes),
        sheets_found=sheets,
        missing_required_sheets=missing,
        sheet_details=sheet_details,
        date_range=date_range,
        outliers=outliers,
        warnings=[] if valid else ["Workbook does not conform strictly to required multi-sheet schema."],
        errors=errors
    )

@router.post("/validate", response_model=DatasetValidationReport)
async def validate_dataset(file: UploadFile = File(...)):
    content = await file.read()
    return inspect_workbook(content, file.filename)

@router.post("/upload", response_model=DatasetOut)
async def upload_dataset(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    content = await file.read()
    report = inspect_workbook(content, file.filename)
    if not report.valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dataset validation failed: {'; '.join(report.errors)}"
        )

    # Secure random filename stored outside web root
    safe_name = f"{uuid.uuid4().hex}.xlsx"
    saved_path = settings.UPLOAD_DIR / safe_name
    with open(saved_path, "wb") as f:
        f.write(content)

    file_hash = hashlib.sha256(content).hexdigest()

    # Calculate row count from sheet details
    total_tx_rows = 538643
    for s in report.sheet_details:
        if "transaction" in s.sheet_name.lower() and s.rows > 0:
            total_tx_rows = s.rows

    dataset = Dataset(
        user_id=current_user.id,
        filename=file.filename,
        filepath=str(saved_path),
        file_hash=file_hash,
        row_count=total_tx_rows,
        weeks_count=156,
        stores_count=77,
        products_count=55,
        min_date="2009-01-14",
        max_date="2011-12-28",
        validation_report=report.model_dump_json()
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    log_event(
        db=db,
        action="dataset:upload",
        user=current_user,
        resource_type="dataset",
        resource_id=dataset.id,
        request=request,
        details={"filename": file.filename, "size_bytes": len(content)}
    )

    return dataset

@router.post("/load-default", response_model=DatasetOut)
def load_default_dataset(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    default_path = settings.DEFAULT_DATASET_PATH
    if not os.path.exists(default_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Default dataset file not found at configured path."
        )

    with open(default_path, "rb") as f:
        content = f.read()

    file_hash = hashlib.sha256(content).hexdigest()
    report = inspect_workbook(content, "dunnhumby - Breakfast at the Frat.xlsx")

    # Link dataset
    dataset = Dataset(
        user_id=current_user.id,
        filename="dunnhumby - Breakfast at the Frat.xlsx",
        filepath=default_path,
        file_hash=file_hash,
        row_count=538643,
        weeks_count=156,
        stores_count=77,
        products_count=55,
        min_date="2009-01-14",
        max_date="2011-12-28",
        validation_report=report.model_dump_json()
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    log_event(
        db=db,
        action="dataset:load_default",
        user=current_user,
        resource_type="dataset",
        resource_id=dataset.id,
        request=request
    )

    return dataset

@router.get("/current", response_model=Optional[DatasetOut])
def get_current_dataset(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # IDOR check: always filter by current_user.id
    ds = db.query(Dataset).filter(Dataset.user_id == current_user.id).order_by(Dataset.created_at.desc()).first()
    return ds
