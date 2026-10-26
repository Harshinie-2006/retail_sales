# Security Policy & Threat Model — Shelf Signal

## Threat Model & OWASP Top 10 Mapping

| OWASP Category | Vulnerability Surface | Implemented Defense Mechanism |
| :--- | :--- | :--- |
| **A01: Broken Access Control** | IDOR on dataset/forecast endpoints | Every query strictly filters by `User.id == current_user.id`. Audit trail is protected by `require_admin` dependency (HTTP 403 for analysts). Automated test `test_access.py` verifies cross-tenant isolation. |
| **A02: Cryptographic Failures** | Password storage & credential leaks | Passwords hashed using **Argon2id** (`time_cost=2, memory_cost=100MB, parallelism=8`). Tokens transmitted via `HttpOnly`, `SameSite=Strict` cookies. Secrets loaded strictly from environment variables. |
| **A03: Injection** | SQL, Formula, and Command Injection | SQLAlchemy ORM parameterized queries (zero raw SQL string concatenation). Model execution is encapsulated in Python runtime (no `eval()`, no `pickle`). |
| **A04: Insecure Design** | Brute force & credential stuffing | 5 consecutive failed login attempts locks account for 15 minutes. Rate limiting via SlowAPI (120 req/min global, 10/min auth). Common weak password blocklist. |
| **A05: Security Misconfiguration** | Missing HTTP headers & CORS leakage | Strict Security Headers Middleware: CSP (`default-src 'self'`), HSTS (`max-age=31536000`), X-Content-Type-Options (`nosniff`), X-Frame-Options (`DENY`), and locked down CORS origins. |
| **A06: Vulnerable & Outdated Components** | Unpinned libraries | Dependency versions pinned in `requirements.txt` and `package.json`. |
| **A07: Identification & Auth Failures** | Session hijacking & CSRF | Short-lived JWT access tokens (60m) paired with refresh token cookies. State-changing requests enforce `X-CSRF-Token` header verification against cookie token. |
| **A08: Software & Data Integrity Failures** | Malicious file upload & zip bombs | Strict multi-stage XLSX validation: extension check, magic bytes check (`PK\x03\x04`), 50 MB size cap, rejection of `.bin` / `.vba` / macro components, uncompressed ratio checks against zip bombs, openpyxl `read_only=True` parsing, and random UUID storage outside the web root. |
| **A09: Security Logging & Monitoring Failures** | Undetected unauthorized actions | Dedicated `AuditLog` table capturing actor, action, timestamp, and IP address for all logins, dataset uploads, model training runs, and export generations. Sensitive credentials and tokens are redacted prior to storage. |
| **A10: Server-Side Request Forgery (SSRF)** | Remote file fetch | Application only accepts local file uploads and does not fetch arbitrary external URLs. |

---

## Intentionally Out of Scope
- Multi-factor authentication (TOTP/SMS): Single-tenant / intranet design for demo prototype.
- Distributed Celery / Redis queue: The background ML job runner uses FastAPI's `BackgroundTasks` thread pool.
- S3/Blob storage: Files are stored in local partitioned directory `./storage/uploads/`.
