# Shelf Signal — Architecture & Implementation Plan

## 1. System Overview
Shelf Signal is an editorial, dense retail pricing & promotion analytics workstation powered by FastAPI, SQLite, and a customized React/Vite/TypeScript frontend styled with an analyst paper aesthetic (#F4F1EA / dark mode, tabular typography, hairline borders).

```
   [ Browser: React + TypeScript (Vite) ]
               |  (REST API + HttpOnly JWT + CSRF)
               v
   [ FastAPI Backend (Python 3.11/3.13) ]
       ├── Security Middleware (Argon2id, SlowAPI, CSP/HSTS, CSRF, Magic-Bytes)
       ├── SQLite / SQLAlchemy ORM (Per-user tenancy, Audit Logs, Data Models)
       ├── Background ML Worker (XGBoost, Random Forest, LightGBM, Statsmodels)
       └── Export Engine (CSV streaming, ReportLab PDF generation)
```

## 2. Directory Structure
```
c:/Users/harsh/OneDrive/Desktop/New folder/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── security.py
│   │   ├── audit.py
│   │   ├── main.py
│   │   └── routes/
│   │       ├── auth.py
│   │       ├── dataset.py
│   │       ├── analytics.py
│   │       ├── forecast.py
│   │       ├── promotions.py
│   │       ├── elasticity.py
│   │       ├── export.py
│   │       └── audit.py
│   ├── ml/
│   │   ├── pipeline.py
│   │   └── retail_sales_forecasting.py
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_upload.py
│   │   └── test_access.py
│   └── requirements.txt
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── api/
│       │   └── client.ts
│       ├── components/
│       │   ├── LeftRail.tsx
│       │   ├── Header.tsx
│       │   ├── CommandPalette.tsx
│       │   ├── StatCard.tsx
│       │   └── Skeleton.tsx
│       └── pages/
│           ├── AuthPage.tsx
│           ├── DatasetPage.tsx
│           ├── OverviewPage.tsx
│           ├── ForecastPage.tsx
│           ├── PromotionsPage.tsx
│           ├── ElasticityPage.tsx
│           ├── ExportPage.tsx
│           └── AuditPage.tsx
├── run.py                 # Single-command launcher for backend + frontend
├── README.md
└── SECURITY.md
```

## 3. Data Model (SQLAlchemy)
1. **User**: `id`, `email`, `hashed_password`, `role` (analyst / admin), `is_active`, `failed_attempts`, `locked_until`, `created_at`.
2. **Dataset**: `id`, `user_id`, `filename`, `file_hash`, `row_count`, `weeks_count`, `stores_count`, `products_count`, `min_date`, `max_date`, `validation_report` (JSON), `created_at`.
3. **ForecastRun**: `id`, `dataset_id`, `user_id`, `status` (pending / running / completed / failed), `progress`, `best_model`, `metrics` (JSON), `feature_importance` (JSON), `promo_lift` (JSON), `elasticity` (JSON), `created_at`, `completed_at`.
4. **AuditLog**: `id`, `user_id`, `user_email`, `action`, `resource_type`, `resource_id`, `ip_address`, `details` (JSON), `created_at`.

## 4. API Endpoints
- `POST /api/auth/register` & `POST /api/auth/login` & `POST /api/auth/logout` & `GET /api/auth/me`
- `POST /api/dataset/validate` (pre-upload validation check)
- `POST /api/dataset/upload` (multipart/form-data with magic bytes & openpyxl read-only parsing)
- `GET /api/dataset/current` (returns active dataset metrics & status)
- `GET /api/analytics/overview` (KPIs, weekly trends, category breakdown, store-tier comparison)
- `POST /api/forecast/start` & `GET /api/forecast/status` & `GET /api/forecast/results`
- `GET /api/promotions/impact` (feature, display, TPR lift by category, store tier, state)
- `GET /api/elasticity/estimates` & `POST /api/elasticity/simulate` (interactive what-if with confidence bounds)
- `GET /api/export/predictions-csv` & `GET /api/export/summary-pdf` (ReportLab formatted PDF)
- `GET /api/audit/logs` (admin only, filtered by user/action)
