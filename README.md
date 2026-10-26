# Shelf Signal — Retail Pricing & Promotional Demand Intelligence

Shelf Signal is an editorial-grade analytical workstation and sales forecasting platform for retail pricing, promotional lift, and demand elasticity. It wraps the dunnhumby *"Breakfast at the Frat"* retail pipeline (538k transactions across 156 weeks, 77 stores, and 55 SKUs across 4 commodity categories).

---

## Architecture & Technology Stack
- **Backend**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy (SQLite), Argon2id password hashing, SlowAPI rate limiting, PyJWT session cookies, ReportLab PDF generation.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Recharts, TanStack Query, Lucide icons.
- **ML / Econometrics**: XGBoost (Poisson & Squared Error), LightGBM, Random Forest, statsmodels OLS fixed-effects log-log regressions.

---

## One-Command Quick Start

Run both backend and frontend simultaneously with:

```bash
python run.py
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **FastAPI OpenAPI Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## Pre-Seeded Demo Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Analyst** | `analyst@shelfsignal.local` | `AnalystSecure2026!` | Overview, Dataset audit, Forecasting, Lift, Elasticity, Exports |
| **Admin** | `admin@shelfsignal.local` | `AdminSecure2026!` | All Analyst features + Security & Operations Audit Trail |

---

## Step-by-Step Demo Tour

1. **Authentication**:
   - Log in using either the Analyst or Admin preset button.
   - Sessions are protected via HttpOnly, SameSite=Strict cookies with CSRF token verification.
2. **Dataset Audit & Validation (`/dataset`)**:
   - Upload any `.xlsx` file or click **"Load Default Dataset"** to link the 156-week dunnhumby workbook.
   - Inspect the automated schema audit: sheet names, row counts, column matching, date ranges, and outlier flags (`units/visit > 10` and `visits/hh > 5`).
3. **Executive Overview (`/overview`)**:
   - Review high-level portfolio KPIs ($41.2M gross sales, 13.7M units).
   - Explore the 52-week volume/revenue progression chart and store tier demographic archetypes.
4. **Econometric & ML Sales Forecasting (`/forecast`)**:
   - Click **"Execute Model Pipeline"** to run the 70/15/15 chronological training pipeline in the background.
   - Inspect the real-time progress bar.
   - View the model leaderboard: **XGBoost (Poisson)** selected as the best architecture by validation MAE (Test MAE: 5.221, Test R²: 0.847, WAPE: 29.02%).
   - Examine the 24-week out-of-sample forecast vs. actual test curve and feature importance attribution (`roll_mean_13`, `lag_1`, `feature`, `display`).
5. **Promotional Lift Effectiveness (`/promotions`)**:
   - Compare multipliers across circular flyers (`feature`), endcap displays (`display`), and temporary price cuts (`tpr_only`).
   - Observe how Cold Cereal reaches **+3.35x** lift under circular ads while Bag Snacks benefits most from front-of-store endcaps (**+2.62x**).
6. **Price Elasticity & Scenario What-If (`/elasticity`)**:
   - Review econometric price elasticity estimates with 95% confidence intervals.
   - Use the **Policy Scenario Simulator** to test hypothetical shelf price adjustments from -30% to +30% and observe projected unit demand and gross revenue trade-offs.
7. **Executive Dossier & Export (`/export`)**:
   - Download the formatted **Executive Analytics Dossier (PDF)** generated via ReportLab.
   - Download the 79,547-row **Test Predictions (CSV)**.
8. **Audit Trail (`/audit`) [Admin Only]**:
   - Switch to the Admin account and view the immutable log capturing all logins, uploads, model executions, and export downloads with IP addresses and timestamps.

---

## Automated Security & Unit Tests

Run the test suite:

```bash
python -m pytest backend/tests -v
```

Tests verify:
- Argon2id password complexity and dictionary rejection.
- Account lockout after consecutive failed attempts.
- File upload hardening (rejecting spoofed magic bytes, non-xlsx files, and unauthenticated requests).
- IDOR data isolation (User A cannot access User B's dataset).
- Role-based access control (Analyst blocked from admin audit logs with HTTP 403).

---

## Known Limitations & Assumptions
- **Econometric Association**: Demand elasticities and promotional lift multipliers represent historical regression associations with fixed effects, not counterfactual proofs of causation.
- **Single-Node Execution**: ML models execute on local CPU/threads suitable for datasets up to ~1 million rows.
