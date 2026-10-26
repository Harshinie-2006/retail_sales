# Shelf Signal — Comprehensive System & Architecture Documentation

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [End-to-End System Architecture](#2-end-to-end-system-architecture)
3. [Machine Learning Forecasting Pipeline](#3-machine-learning-forecasting-pipeline)
   - [Dataset Ingestion & Data Hygiene](#31-dataset-ingestion--data-hygiene)
   - [Anti-Leakage Feature Engineering](#32-anti-leakage-feature-engineering)
   - [Chronological Split Strategy (70/15/15)](#33-chronological-split-strategy-701515)
   - [Model Benchmarking & Selection](#34-model-benchmarking--selection)
   - [Evaluation Metrics Formulation](#35-evaluation-metrics-formulation)
   - [Feature Importance Hierarchy](#36-feature-importance-hierarchy)
4. [Promotional Lift Analysis](#4-promotional-lift-analysis)
   - [Methodology & Mechanics](#41-methodology--mechanics)
   - [Category, Store Tier, and Geographic Findings](#42-category-store-tier-and-geographic-findings)
   - [Observational Association vs. Causal Inference](#43-observational-association-vs-causal-inference)
5. [Econometric Price Elasticity Modeling](#5-econometric-price-elasticity-modeling)
   - [Log-Log Fixed Effects Specification](#51-log-log-fixed-effects-specification)
   - [Category Elasticity Estimates & Confidence Bounds](#52-category-elasticity-estimates--confidence-bounds)
   - [Interactive What-If Demand Simulation](#53-interactive-what-if-demand-simulation)
6. [Backend Architecture & Security](#6-backend-architecture--security)
   - [FastAPI Service Structure](#61-fastapi-service-structure)
   - [Database Schema & Multi-Tenancy](#62-database-schema--multi-tenancy)
   - [Security & Cybersecurity Hardening](#63-security--cybersecurity-hardening)
   - [Asynchronous Job Processing](#64-asynchronous-job-processing)
7. [Frontend Architecture & UI Engineering](#7-frontend-architecture--ui-engineering)
   - [Analyst Paper Aesthetic & Component Hierarchy](#71-analyst-paper-aesthetic--component-hierarchy)
   - [Key Screen Modules](#72-key-screen-modules)
   - [Keyboard Navigation & Shortcuts](#73-keyboard-navigation--shortcuts)
8. [API & Operational Reference](#8-api--operational-reference)
   - [Endpoint Specification](#81-endpoint-specification)
   - [Local Launcher & Configuration](#82-local-launcher--configuration)
   - [Role Matrix & Demo Credentials](#83-role-matrix--demo-credentials)

---

## 1. Executive Summary

**Shelf Signal** is an enterprise-grade retail pricing, promotional effectiveness, and demand forecasting workstation. Designed to operate on dunnhumby's *"Breakfast at the Frat"* transaction dataset (spanning 156 weeks across 77 retail stores, 55 products, and ~800,000 transactions), the workstation translates econometric and gradient-boosted machine learning models into an interactive, high-density editorial financial terminal.

Key capabilities include:
- **Unit Demand Forecasting**: Gradient-boosted regressors (XGBoost Poisson, XGBoost Squared Error, LightGBM, Random Forest) evaluated chronologically against naive baselines.
- **Promotional Multiplier Analysis**: Quantifying volume lift from circular flyers (`feature`), end-cap point-of-sale displays (`display`), and temporary price reductions (`tpr_only`) stratified across store volume tiers and states.
- **Econometric Price Elasticity**: Two-way fixed-effects OLS log-log regression isolating category price sensitivity, coupled with an interactive what-if simulation engine.
- **Enterprise Governance**: Role-based access control (RBAC), Argon2id password hashing, CSRF defense, SlowAPI rate-limiting, comprehensive audit logging, and automated CSV/PDF reporting.

---

## 2. End-to-End System Architecture

```
                                  USER BROWSER
                     (React 19 + TypeScript + Tailwind CSS)
                                       │
                  ┌────────────────────┴────────────────────┐
                  │ HTTP Requests / SSE                     │
                  │ Headers: Authorization: Bearer <JWT>    │
                  │ Cookies: shelf_access_token (HttpOnly)  │
                  │          shelf_csrf_token               │
                  ▼                                         ▼
         Vite Dev Server                         FastAPI Gateway
         (Port 5173 / Proxy)                     (Port 8000 / Uvicorn)
                                                            │
    ┌───────────────────────────────────────────────────────┼────────────────────────────────────────┐
    │                                                       │                                        │
    ▼                                                       ▼                                        ▼
Security Middleware                               API Router Dispatch                         Background Tasks
├── CORS Validator                                ├── /api/auth (Login, Register, Me)        └── execute_ml_job()
├── SlowAPI Rate Limiter                          ├── /api/dataset (Upload, Validate)             ├── Ingestion & Joins
├── Security Headers (CSP, HSTS)                  ├── /api/analytics (Overview KPIs)              ├── Feature Engineering
└── Argon2id / JWT Verifier                       ├── /api/forecast (Run, Status, Results)        ├── Model Fitting
                                                  ├── /api/promotions (Impact Lifts)              └── Metrics Persistence
                                                  ├── /api/elasticity (Estimates, Sim)                       │
                                                  ├── /api/export (CSV, ReportLab PDF)                       │
                                                  └── /api/audit (Admin Log Trail)                           ▼
                                                            │                                   SQLite Storage
                                                            └──────────────────────────────────► (shelf_signal.db)
```

---

## 3. Machine Learning Forecasting Pipeline

The core analytical pipeline is defined in [`retail_sales_forecasting.py`](file:///c:/Users/harsh/OneDrive/Desktop/New%20folder/retail_sales_forecasting.py) and integrated into [`backend/app/routes/forecast.py`](file:///c:/Users/harsh/OneDrive/Desktop/New%20folder/backend/app/routes/forecast.py).

### 3.1 Dataset Ingestion & Data Hygiene
- **Tables Merged**:
  1. `Transaction`: Weekly store-item transactions (`store_num`, `upc`, `week_end_date`, `units`, `visits`, `hhs`, `spend`, `price`, `base_price`, `feature`, `display`, `tpr_only`).
  2. `Product`: Granular item metadata (`upc`, `description`, `manufacturer`, `category`, `sub_category`, `product_size`).
  3. `Store`: Retail outlet metadata (`store_num`, `store_name`, `address_city_name`, `address_state_prov_code`, `msa_code`, `seg_value_name`, `sales_area_size_num`, `parking_space_qty`).
- **Deduplication**: Deduplicated on `["store_num", "upc", "week_end_date"]`.
- **Filtering**: Retains strictly valid operational rows where `units >= 0`, `price > 0`, and `base_price > 0`.
- **Outlier Reporting**: Outliers (such as bulk institutional purchases where `units_per_visit > 10` or `visits_per_hh > 5`) are flagged and reported in data hygiene audits, but retained in training to preserve authentic retail tail dynamics.

### 3.2 Anti-Leakage Feature Engineering
> [!IMPORTANT]
> **Data Leakage Safeguard**: `spend`, `visits`, `hhs`, and `avg_weekly_baskets` are **strictly excluded** from features. Because these values are contemporaneous with weekly sales outcomes, including them would cause target leakage and invalidate live forecasting.

The feature set includes 27 engineered signals:
- **Price & Promotional Dynamics**:
  - `price`: Effective shelf price paid by consumer.
  - `base_price`: Regular non-promotional shelf price.
  - `discount_pct`: $\frac{\text{base\_price} - \text{price}}{\text{base\_price}} \times 100$.
  - `log_price`: $\ln(\text{price})$.
  - `feature`: Boolean flag indicating printed circular flyer promotion.
  - `display`: Boolean flag indicating end-cap or lobby promotional display.
  - `tpr_only`: Temporary price reduction without promotional signage.
- **Calendar & Seasonality**:
  - `week_of_year`: ISO calendar week (1–52) capturing holiday and annual cycles.
  - `month`: Numerical calendar month (1–12).
- **Historical Sales Momentum (Lags & Rolling Aggregations)**:
  - `lag_1`, `lag_2`, `lag_4`, `lag_13`, `lag_52`: Historical volume at 1, 2, 4, 13 (quarter), and 52 (annual) weeks prior for the specific store-UPC pair.
  - `roll_mean_4`: 4-week short-term moving average ($\text{shift}(1)$ to prevent current-week leakage).
  - `roll_mean_13`: 13-quarterly moving sales baseline ($\text{shift}(1)$).
  - `roll_std_4`: 4-week moving sales standard deviation / volatility.
- **Categorical & Fixed Attribute Encoding**:
  - `category_code`, `sub_category_code`, `manufacturer_code`, `upc_code`, `store_num`, `seg_value_name_code`, `address_state_prov_code_code`, `msa_code_code`, `sales_area_size_num`, `parking_space_qty`.

### 3.3 Chronological Split Strategy (70/15/15)
To mirror real-world operational deployment, the 156-week historical timeline is partitioned chronologically across all stores and products:
- **Training Set (70%)**: Weeks 1 to 109 (~264,000 store-product-week observations).
- **Validation Set (15%)**: Weeks 110 to 132 (~80,500 observations) — utilized strictly for early stopping and hyperparameter tuning.
- **Test Set (15%)**: Weeks 133 to 156 (~79,500 observations) — untouched holdout used solely for final benchmark reporting.

### 3.4 Model Benchmarking & Selection
Six models are fitted and benchmarked:

| Model Architecture | Objective / Formulation | Tuning & Hyperparameters |
| :--- | :--- | :--- |
| **XGBoost (Poisson)** *(Selected Best)* | `count:poisson` | $n_{\text{est}}=1000$, $\eta=0.03$, $\text{depth}=5$, $\text{child}=5$, $\text{subsample}=0.8$, $\lambda=5$, early stopping = 50 |
| **XGBoost (Squared Error)** | `reg:squarederror` | Identical hyperparameter tree grid using mean squared error loss |
| **LightGBM** | `regression` (L1/L2) | $n_{\text{est}}=1000$, $\eta=0.03$, $\text{leaves}=31$, $\text{samples}=20$, $\text{colsample}=0.8$, $\lambda=5$ |
| **Random Forest** | Bagged Decision Trees | $n_{\text{est}}=150$, $\text{max\_depth}=14$, $\text{min\_leaf}=5$, $\text{features}=0.7$, subsampled to 250k |
| **Naive (Prior Week)** | $P_{t} = Y_{t-1}$ | Immediate 1-week lagged actuals |
| **Seasonal Naive (52-week)** | $P_{t} = Y_{t-52}$ | Annual 52-week lagged actuals |

### 3.5 Evaluation Metrics Formulation
For actual values $y_i$ and predicted values $\hat{y}_i$:
- **Mean Absolute Error (MAE)**:
  $$\text{MAE} = \frac{1}{n} \sum_{i=1}^n |y_i - \hat{y}_i|$$
- **Root Mean Squared Error (RMSE)**:
  $$\text{RMSE} = \sqrt{\frac{1}{n} \sum_{i=1}^n (y_i - \hat{y}_i)^2}$$
- **Weighted Absolute Percentage Error (WAPE %)**:
  $$\text{WAPE} = \frac{\sum_{i=1}^n |y_i - \hat{y}_i|}{\sum_{i=1}^n y_i} \times 100$$
- **Coefficient of Determination ($R^2$)**:
  $$R^2 = 1 - \frac{\sum_{i=1}^n (y_i - \hat{y}_i)^2}{\sum_{i=1}^n (y_i - \bar{y})^2}$$

#### Benchmark Leaderboard (Test Holdout Period)

| Model | Val MAE | Val RMSE | Val WAPE % | Val $R^2$ | Test MAE | Test RMSE | Test WAPE % | Test $R^2$ |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **XGBoost (Poisson)** | **5.831** | **11.912** | **29.85%** | **0.827** | **5.221** | **11.055** | **29.02%** | **0.847** |
| XGBoost (Squared Error) | 5.852 | 11.738 | 29.96% | 0.832 | 5.359 | 11.330 | 29.79% | 0.839 |
| LightGBM | 5.913 | 11.836 | 30.27% | 0.829 | 5.355 | 11.117 | 29.77% | 0.845 |
| Random Forest | 5.977 | 12.421 | 30.60% | 0.812 | 5.351 | 11.729 | 29.75% | 0.828 |
| Naive (Prior Week) | 8.737 | 20.961 | 44.71% | 0.465 | 7.600 | 20.552 | 42.25% | 0.471 |
| Seasonal Naive (52w) | 11.625 | 27.621 | 57.98% | 0.091 | 10.698 | 26.167 | 58.61% | 0.154 |

### 3.6 Feature Importance Hierarchy
Feature gain extraction from the primary gradient-boosted model:
1. `roll_mean_13` (19.14%): Medium-term quarterly baseline store-item volume.
2. `lag_1` (17.25%): Immediate prior-week sales velocity.
3. `feature` (11.23%): Printed flyer circular active.
4. `roll_mean_4` (8.12%): 4-week short-term sales momentum.
5. `tpr_only` (7.78%): Temporary price reduction.
6. `discount_pct` (4.98%): Effective percentage markdown.
7. `display` (4.25%): Point-of-sale secondary placement.
8. `manufacturer_code` (2.82%): Brand-level volume bias.
9. `price` (2.64%): Absolute price tag.
10. `log_price` (2.49%): Logarithmic scaling.
11. `roll_std_4` (2.43%): Demand volatility index.
12. `sub_category_code` (2.36%): Granular category grouping.

---

## 4. Promotional Lift Analysis

### 4.1 Methodology & Mechanics
Promotional lift is calculated across three primary retail promotional levers:
- **Feature (`feature = 1`)**: Retailer weekly circular newspaper/mailer flyer.
- **Display (`display = 1`)**: Secondary end-cap, lobby display, or island placement.
- **TPR Only (`tpr_only = 1`)**: Temporary price reduction on shelf tag without promotional signage.

$$\text{Lift Multiplier} = \frac{\mathbb{E}[\text{Units} \mid \text{Promotion} = 1]}{\mathbb{E}[\text{Units} \mid \text{Promotion} = 0]}$$

### 4.2 Category, Store Tier, and Geographic Findings

#### Category Performance Matrix
- **Cold Cereal**: Demonstrates massive responsiveness to co-marketing. Baseline: 28.05 units/wk. Feature lift: **3.35x** (93.89 units). Display lift: **3.21x** (92.30 units). Combined Feature + Display reaches **4.15x** baseline.
- **Frozen Pizza**: Display-driven impulse. Baseline: 9.29 units/wk. Display lift: **2.96x** (27.75 units). Feature lift: **2.80x** (25.97 units).
- **Oral Hygiene Products**: Brand-habitual necessity with modest lift. Baseline: 4.15 units/wk. Feature lift: **2.46x** (10.21 units). Display lift: **1.99x** (8.18 units).
- **Bag Snacks**: End-cap dominant impulse category. Baseline: 16.93 units/wk. Display lift: **2.62x** (44.32 units). Feature lift: **1.75x** (35.14 units).

#### Store Tier Sensitivity
- **Value Tier Stores**: Highest promotional elasticity (Feature lift: **3.42x**, Combined: **4.15x**). Customers actively seek promotional markers.
- **Mainstream Stores**: Moderate promotional responsiveness (Feature lift: **2.65x**, Combined: **3.48x**).
- **Upscale Stores**: Inelastic volume baseline with dampened promotional spikes (Feature lift: **2.18x**, Combined: **2.89x**).

#### State-Level Consistency
Observational lifts remain uniform across operational territories:
- Ohio (OH): Cold Cereal lift 3.38x, Frozen Pizza 2.85x.
- Indiana (IN): Cold Cereal lift 3.41x, Frozen Pizza 2.91x.
- Kentucky (KY): Cold Cereal lift 3.25x, Frozen Pizza 2.74x.
- Texas (TX): Cold Cereal lift 3.12x, Frozen Pizza 2.61x.

### 4.3 Observational Association vs. Causal Inference
> [!NOTE]
> **Methodological Clarification**: The calculated multipliers represent observational conditional expectations over 156 weeks. Because retailers deliberately select high-volume weeks (e.g. Super Bowl, back-to-school) to assign display end-caps and circulars, promotional indicators exhibit endogeneity. The platform presents these metrics as statistical associations rather than counterfactual causal guarantees.

---

## 5. Econometric Price Elasticity Modeling

### 5.1 Log-Log Fixed Effects Specification
To isolate direct consumer price sensitivity from confounding factors (brand quality, store traffic, seasonal spikes), an ordinary least squares (OLS) log-log model is estimated per category:

$$\ln(\text{units}_{ist} + 1) = \beta_0 + \beta_1 \ln(\text{price}_{ist}) + \gamma_1 \text{feature}_{ist} + \gamma_2 \text{display}_{ist} + \gamma_3 \text{tpr\_only}_{ist} + \alpha_i + \delta_s + \tau_t + \varepsilon_{ist}$$

Where:
- $\beta_1$: The constant price elasticity of demand:
  $$\varepsilon_p = \frac{\partial \ln(Q)}{\partial \ln(P)} = \frac{\% \Delta Q}{\% \Delta P}$$
- $\alpha_i$: Product fixed effects ($C(\text{upc})$) controlling for unobserved brand equity.
- $\delta_s$: Store fixed effects ($C(\text{store\_num})$) absorbing local trade-area demographics.
- $\tau_t$: Time fixed effects ($C(\text{week\_of\_year})$) removing macro annual seasonality.

### 5.2 Category Elasticity Estimates & Confidence Bounds

| Category | Elasticity ($\beta_1$) | Std Error | 95% Conf. Interval | $N$ Obs | Economic Interpretation |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **FROZEN PIZZA** | **-2.201** | 0.018 | `[-2.236, -2.166]` | 80,000 | **Highly Elastic**: Discretionary convenience meal; aggressive cross-brand switching on price variations. |
| **COLD CEREAL** | **-1.626** | 0.020 | `[-1.665, -1.587]` | 80,000 | **Moderately Elastic**: Substantial brand loyalty tempered by strong promotional substitution. |
| **ORAL HYGIENE** | **-0.948** | 0.013 | `[-0.973, -0.923]` | 80,000 | **Unit-Elastic**: Essential personal care staple; consistent consumption cadence. |
| **BAG SNACKS** | **-0.542** | 0.018 | `[-0.577, -0.507]` | 80,000 | **Inelastic**: Low-ticket impulse purchase; shelf price changes cause minimal volume deflection. |

### 5.3 Interactive What-If Demand Simulation
Given a proposed percentage price adjustment $\Delta P = \frac{P_{\text{new}} - P_{\text{base}}}{P_{\text{base}}}$:

1. **Volume Impact**:
   $$\% \Delta Q = (1 + \Delta P)^{\varepsilon_p} - 1$$
   $$Q_{\text{simulated}} = Q_{\text{baseline}} \times (1 + \% \Delta Q)$$
2. **Revenue Impact**:
   $$R_{\text{baseline}} = P_{\text{base}} \times Q_{\text{baseline}}$$
   $$R_{\text{simulated}} = P_{\text{new}} \times Q_{\text{simulated}} = P_{\text{base}}(1 + \Delta P) \times Q_{\text{baseline}}(1 + \% \Delta Q)$$
   $$\% \Delta R = \left[\frac{R_{\text{simulated}} - R_{\text{baseline}}}{R_{\text{baseline}}}\right] \times 100$$
3. **Confidence Bands**: Bounds are evaluated at $\varepsilon_{\text{lower}} = \varepsilon_p - 1.96 \times \text{SE}$ and $\varepsilon_{\text{upper}} = \varepsilon_p + 1.96 \times \text{SE}$.

---

## 6. Backend Architecture & Security

### 6.1 FastAPI Service Structure
```
backend/
├── app/
│   ├── config.py         # Pydantic Settings & environment binding
│   ├── database.py       # SQLAlchemy engine & session factory
│   ├── models.py         # User, Dataset, ForecastRun, AuditLog ORM
│   ├── schemas.py        # Pydantic v2 validation contracts
│   ├── security.py       # Password hashing & JWT cryptography
│   ├── audit.py          # Platform event logging
│   ├── deps.py           # Dependency injection (Auth & RBAC)
│   ├── main.py           # Application factory, middlewares & routes
│   └── routes/           # Domain API endpoints
├── ml/
│   └── retail_sales_forecasting.py # Reference training pipeline
└── tests/                # Automated pytest suites
```

### 6.2 Database Schema & Multi-Tenancy
The platform implements single-database logical multi-tenancy backed by SQLite (`shelf_signal.db`):
- `users`: `id`, `email`, `hashed_password`, `role` (`analyst` / `admin`), `is_active`, `failed_attempts`, `locked_until`, `created_at`.
- `datasets`: `id`, `user_id`, `filename`, `file_hash`, `row_count`, `weeks_count`, `stores_count`, `products_count`, `min_date`, `max_date`, `validation_report` (JSON), `created_at`.
- `forecast_runs`: `id`, `user_id`, `dataset_id`, `status` (`pending`, `running`, `completed`, `failed`), `progress` (0–100), `current_step`, `best_model`, `metrics_json`, `created_at`, `completed_at`.
- `audit_logs`: `id`, `user_id`, `user_email`, `action`, `resource_type`, `resource_id`, `ip_address`, `details_json`, `created_at`.

### 6.3 Security & Cybersecurity Hardening
- **Password Hashing**: Argon2id via `passlib` with salt and memory cost configuration.
- **Brute-Force & Lockout**: Accounts lock automatically for 15 minutes after 5 consecutive failed login attempts.
- **Dual-Token Transmission**:
  - `shelf_access_token`: Signed HS256 JWT passed in HttpOnly, `SameSite=Lax` cookies and accepted via `Authorization: Bearer <token>` header.
  - `shelf_csrf_token`: Non-HttpOnly CSRF token verified via `X-CSRF-Token` on state-mutating requests (`POST`, `PUT`, `DELETE`).
- **Rate Limiting**: SlowAPI limits clients to 120 requests/minute per IP address with Redis/memory backends.
- **Cybersecurity Headers**:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' ...`

### 6.4 Asynchronous Job Processing
Forecasting jobs execute asynchronously using FastAPI `BackgroundTasks`. The background worker incrementally updates the database status and progress bar:
1. `10%`: Ingesting transaction logs & product lookups.
2. `25%`: Computing lags (`lag_1`, `lag_52`) and rolling averages.
3. `45%`: Partitioning chronological splits (70/15/15).
4. `65%`: Training XGBoost Poisson & Squared Error models.
5. `85%`: Fitting LightGBM & Random Forest regressors.
6. `100%`: Committing evaluation metrics & feature importances to SQLite.

---

## 7. Frontend Architecture & UI Engineering

### 7.1 Analyst Paper Aesthetic & Component Hierarchy
The UI employs an editorial "analyst paper" aesthetic:
- **Light Theme**: Warm cream card backgrounds (`#F4F1EA`), hairline slate borders (`#E5E0D8`), and dense ink typography (`#1B1C1D`).
- **Dark Theme**: Deep slate paper (`#121314`) with muted borders (`#2A2B2D`) and high-contrast tabular typography.
- **Tabular Numerics**: Font family configured with `font-variant-numeric: tabular-nums` to eliminate number jitter in financial tables.

```
frontend/src/
├── App.tsx                     # Session coordinator & tab switcher
├── api/
│   └── client.ts               # Fetch client with auto-CSRF & Bearer injection
├── components/
│   ├── LeftRail.tsx            # Navigation sidebar with status & shortcuts
│   ├── Header.tsx              # Context breadcrumb & session badge
│   ├── CommandPalette.tsx      # Modal search palette (Ctrl+K)
│   ├── StatCard.tsx            # KPI widget with baseline comparison
│   └── Skeleton.tsx            # Shimmer loading placeholders
└── pages/
    ├── AuthPage.tsx            # Preset login & registration
    ├── OverviewPage.tsx        # Executive retail dashboard
    ├── DatasetPage.tsx         # Data audit & hygiene checks
    ├── ForecastPage.tsx        # ML model comparisons & feature weights
    ├── PromotionsPage.tsx      # Promotional lift breakdowns
    ├── ElasticityPage.tsx      # What-if pricing simulator
    ├── ExportPage.tsx          # CSV & PDF downloads
    └── AuditPage.tsx           # Admin governance event stream
```

### 7.2 Key Screen Modules
- **Overview Dashboard**: Displays overall revenue ($41.2M), volume (13.7M units), category share breakdown, and a 52-week rolling volume trend chart.
- **Dataset Audit**: Inspects dataset completeness, schema compliance, missing value tallies, and dunnhumby outlier thresholds.
- **Forecast Leaderboard**: Renders side-by-side metric tables (val vs. test splits), interactive feature importance rankings, and test-period Actual vs. Predicted curves.
- **Promotions Impact**: Multiplier cards, store-tier matrix, and geographic lift heatmaps.
- **Elasticity Simulator**: Interactive percentage slider (-20% to +20%) recalculating projected volume, revenue, and uncertainty intervals in real-time.
- **Export Center**: Instant download buttons for `test_predictions.csv` and ReportLab executive PDF summaries.
- **Security Audit**: Paginated admin log viewer filtering events by action, IP, and user identity.

### 7.3 Keyboard Navigation & Shortcuts
- **`1`**: Switch to Overview Dashboard.
- **`2`**: Switch to Dataset Audit.
- **`3`**: Switch to Forecast Leaderboard.
- **`4`**: Switch to Promotions Impact.
- **`5`**: Switch to Price Elasticity Simulator.
- **`6`**: Switch to Export Center.
- **`7`**: Switch to Security & Ops Audit (Admin only).
- **`Ctrl + K` / `Cmd + K`**: Open the Quick Command Palette.

---

## 8. API & Operational Reference

### 8.1 Endpoint Specification

| HTTP Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new analyst/admin account. |
| `POST` | `/api/auth/login` | Public | Authenticate and issue JWT / cookies. |
| `POST` | `/api/auth/logout` | Authenticated | Invalidate session cookies and local state. |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile. |
| `GET` | `/api/analytics/overview` | Authenticated | Retrieve executive KPIs and category splits. |
| `POST` | `/api/forecast/start` | Authenticated | Enqueue asynchronous ML forecasting job. |
| `GET` | `/api/forecast/status` | Authenticated | Poll active forecasting job progress. |
| `GET` | `/api/forecast/results` | Authenticated | Fetch model comparison metrics and feature weights. |
| `GET` | `/api/promotions/impact` | Authenticated | Fetch promotional lift multipliers. |
| `GET` | `/api/elasticity/estimates` | Authenticated | Retrieve category log-log elasticity estimates. |
| `POST` | `/api/elasticity/simulate` | Authenticated | Execute what-if demand and revenue simulation. |
| `GET` | `/api/export/predictions-csv` | Authenticated | Stream test period prediction dataset. |
| `GET` | `/api/export/summary-pdf` | Authenticated | Stream generated ReportLab executive PDF. |
| `GET` | `/api/audit/logs` | Admin Only | Query platform security event audit trail. |
| `GET` | `/api/health` | Public | Service health and version check. |

### 8.2 Local Launcher & Configuration
To launch both the FastAPI backend (port 8000) and the Vite frontend (port 5173) with a single command:

```powershell
python run.py
```

- **Frontend URL**: `http://localhost:5173`
- **Backend API Docs**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/api/health`

### 8.3 Role Matrix & Demo Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Analyst** | `analyst@shelfsignal.local` | `AnalystSecure2026!` | Overview, Dataset audit, Forecasting, Lift, Elasticity, Exports |
| **Admin** | `admin@shelfsignal.local` | `AdminSecure2026!` | All Analyst capabilities + Security & Operations Audit Trail |
