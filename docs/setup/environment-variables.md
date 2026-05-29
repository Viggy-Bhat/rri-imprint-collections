# Environment Variables Reference

> **Purpose**: Complete reference of every environment variable consumed by this project — backend and frontend.
> **Audience**: Developers configuring `.env` files for any environment.
> **Prerequisites**: [Backend setup](./backend-setup.md), [Frontend setup](./frontend-setup.md).

---

## Variables at a Glance

| Variable | Required | Default | Source File |
|----------|----------|---------|-------------|
| **Core Settings** | | | |
| `DJANGO_SETTINGS_MODULE` | No | `backend.settings.dev` (manage.py) / `backend.settings.production` (wsgi.py) | manage.py, wsgi.py |
| `DJANGO_DEBUG` | No | `"1"` (dev only) | dev.py |
| `DJANGO_SECRET_KEY` | **Yes (prod)** | `"dev-only-change-me-before-shared-deployments"` (dev) | dev.py, production.py |
| **Networking** | | | |
| `DJANGO_ALLOWED_HOSTS` | **Yes (prod)** | `["127.0.0.1", "localhost", "testserver"]` (dev), `[]` (prod) | dev.py, production.py |
| `DJANGO_CORS_ALLOWED_ORIGINS` | No | `["http://localhost:3000", "http://127.0.0.1:3000"]` (dev), `[]` (prod) | dev.py, production.py |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | No | Same as CORS above | dev.py, production.py |
| **Database** | | | |
| `DATABASE_URL` | **Yes (prod)** | `None` → SQLite fallback | base.py, production.py |
| `DJANGO_DB_CONN_MAX_AGE` | No | `60` (seconds) | base.py |
| `DATABASE_SSL_REQUIRE` | No | `False` | base.py |
| **Cache** | | | |
| `REDIS_URL` | No | `""` → LocMemCache fallback | base.py |
| `DJANGO_CACHE_TIMEOUT` | No | `300` (seconds) | base.py |
| **Security (Prod Only)** | | | |
| `DJANGO_SECURE_SSL_REDIRECT` | No (prod only) | `"1"` | production.py |
| `DJANGO_SESSION_COOKIE_SECURE` | No (prod only) | `"1"` | production.py |
| `DJANGO_CSRF_COOKIE_SECURE` | No (prod only) | `"1"` | production.py |
| `DJANGO_SECURE_HSTS_SECONDS` | No (prod only) | `"31536000"` (1 year) | production.py |
| `DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS` | No (prod only) | `"1"` | production.py |
| `DJANGO_SECURE_HSTS_PRELOAD` | No (prod only) | `"1"` | production.py |
| `DJANGO_SECURE_PROXY_SSL_HEADER_NAME` | No | `"HTTP_X_FORWARDED_PROTO"` | base.py |
| `DJANGO_SECURE_PROXY_SSL_HEADER_VALUE` | No | `"https"` | base.py |
| `DJANGO_USE_X_FORWARDED_HOST` | No | `True` | base.py |
| **Upload Limits** | | | |
| `DJANGO_DATA_UPLOAD_MAX_MEMORY_SIZE` | No | `10485760` (10 MB) | base.py |
| `DJANGO_FILE_UPLOAD_MAX_MEMORY_SIZE` | No | `10485760` (10 MB) | base.py |
| **Logging** | | | |
| `DJANGO_LOG_LEVEL` | No | `"INFO"` | base.py |
| **Wagtail** | | | |
| `WAGTAILADMIN_BASE_URL` | No | `"http://example.com"` | base.py |
| **Frontend** | | | |
| `NEXT_PUBLIC_WAGTAIL_BASE_URL` | No | `"http://127.0.0.1:8000"` (hardcoded in config.js) | `frontend/app/lib/config.js` |
| **Legacy** | | | |
| `SECRET_KEY` | No | `""` (fallback for `DJANGO_SECRET_KEY` in prod) | production.py |

**Not used**: `NODE_ENV` appears in root `.env.example` but is **not read by any code** in this project.

---

## Core Settings

### `DJANGO_SETTINGS_MODULE`

| Property | Value |
|----------|-------|
| Required | No |
| Dev default | `backend.settings.dev` (set by `manage.py`) |
| Production default | `backend.settings.production` (set by `wsgi.py`) |
| Source | `manage.py:9`, `wsgi.py:16` |
| Purpose | Selects which settings module Django loads |

The settings hierarchy is:
```
base.py  (shared configuration)
├── dev.py  (debug=True, console email, localhost origins)
└── production.py  (debug=False, HSTS, SSL, security headers)
```

Both dev.py and production.py support an optional `local.py` override (not committed to git) for per-developer customization.

### `DJANGO_DEBUG`

| Property | Value |
|----------|-------|
| Required | No |
| Default (dev) | `"1"` (truthy → DEBUG=True) |
| Default (prod) | Hardcoded `False` (ignores env var) |
| Source | dev.py:7 |
| Purpose | Enable Django debug mode (detailed errors, auto-reload, static serving) |

### `DJANGO_SECRET_KEY`

| Property | Value |
|----------|-------|
| Required | **Dev**: No. **Production**: Yes — raises `ImproperlyConfigured` if missing or starts with `django-insecure-` |
| Default (dev) | `"dev-only-change-me-before-shared-deployments"` |
| Source | dev.py:10, production.py:9 |
| Purpose | Cryptographic signing for sessions, CSRF tokens, password reset tokens |

**Generate a production key**:
```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

---

## Networking

### `DJANGO_ALLOWED_HOSTS`

| Property | Value |
|----------|-------|
| Required | **Production**: Yes — raises `ImproperlyConfigured` if empty |
| Default (dev) | `["127.0.0.1", "localhost", "testserver"]` |
| Default (prod) | `[]` |
| Source | dev.py:16, production.py:20 |
| Purpose | Comma-separated list of host/domain names the Django site can serve |
| Format | Comma-separated string: `example.com,www.example.com` |

### `DJANGO_CORS_ALLOWED_ORIGINS`

| Property | Value |
|----------|-------|
| Required | No |
| Default (dev) | `["http://localhost:3000", "http://127.0.0.1:3000"]` |
| Default (prod) | `[]` |
| Source | dev.py:24, production.py:26 |
| Purpose | Origins allowed to make cross-origin requests to the API (CORS) |
| Format | Comma-separated string: `https://app.example.com,https://www.example.com` |

### `DJANGO_CSRF_TRUSTED_ORIGINS`

| Property | Value |
|----------|-------|
| Required | No |
| Default (dev) | `["http://localhost:3000", "http://127.0.0.1:3000"]` |
| Default (prod) | `[]` |
| Source | dev.py:32, production.py:27 |
| Purpose | Origins trusted for CSRF-protected POST requests |
| Format | Same as CORS |

**Common mistake**: Setting `CORS_ALLOWED_ORIGINS` but forgetting `CSRF_TRUSTED_ORIGINS`. Both must include your frontend origin.

---

## Database

### `DATABASE_URL`

| Property | Value |
|----------|-------|
| Required | **Production**: Yes — raises `ImproperlyConfigured` if missing |
| Default | `None` → SQLite at `backend/db.sqlite3` |
| Source | base.py:121, production.py:15 |
| Purpose | Database connection string parsed by `dj-database-url` |
| Format | `mysql://user:password@host:port/database` |

**Example**:
```
DATABASE_URL=mysql://rri_user:rri_password@127.0.0.1:3306/rri_imprint
```

URL-encode special characters in passwords: `@` → `%40`, `:` → `%3A`, `/` → `%2F`.

### `DJANGO_DB_CONN_MAX_AGE`

| Property | Value |
|----------|-------|
| Required | No |
| Default | `60` (seconds) |
| Source | base.py:126 |
| Purpose | Database connection pool lifetime |

### `DATABASE_SSL_REQUIRE`

| Property | Value |
|----------|-------|
| Required | No |
| Default | `False` |
| Source | base.py:127 |
| Purpose | Require SSL for database connections |

---

## Cache

### `REDIS_URL`

| Property | Value |
|----------|-------|
| Required | No |
| Default | `""` → falls back to in-memory `LocMemCache` |
| Source | base.py:254 |
| Purpose | Redis connection string for cache backend |
| Format | `redis://host:port/db_number` |

**Example (dev/local)**:
```
REDIS_URL=redis://127.0.0.1:6379/1
```

**Note**: The `.env.example` files use `redis://redis:6379/1` which assumes a Docker hostname. On bare-metal, use `127.0.0.1`.

If `REDIS_URL` is unset or empty, the project uses `LocMemCache` (per-process in-memory cache, location: `rri-imprint-default-cache`). This is sufficient for development but does not share cache between processes.

### `DJANGO_CACHE_TIMEOUT`

| Property | Value |
|----------|-------|
| Required | No |
| Default | `300` (seconds) |
| Source | base.py:261, base.py:269 |
| Purpose | Default cache TTL for both Redis and LocMem backends |

**Per-endpoint cache TTLs** (hardcoded in views):
- `researcher_section_filtered_items`: 300s
- `researcher_publications`: 300s
- `researcher_guidance`: 300s
- `researcher_news`: 180s
- `researcher_section_count`: 300s
- `image_detail`: 300s
- `site_settings_detail`: 300s

---

## Security (Production Only)

All security variables are read only in `production.py`. They have **no effect** in development.

### `DJANGO_SECURE_SSL_REDIRECT`

| Property | Value |
|----------|-------|
| Default | `"1"` (enabled) |
| Source | production.py:29 |
| Purpose | Redirect all HTTP requests to HTTPS |

### `DJANGO_SESSION_COOKIE_SECURE`

| Property | Value |
|----------|-------|
| Default | `"1"` (enabled) |
| Source | production.py:30 |
| Purpose | Only send session cookie over HTTPS |

### `DJANGO_CSRF_COOKIE_SECURE`

| Property | Value |
|----------|-------|
| Default | `"1"` (enabled) |
| Source | production.py:31 |
| Purpose | Only send CSRF cookie over HTTPS |

### `DJANGO_SECURE_HSTS_SECONDS`

| Property | Value |
|----------|-------|
| Default | `"31536000"` (1 year) |
| Source | production.py:33 |
| Purpose | HSTS max-age in seconds |

### `DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS`

| Property | Value |
|----------|-------|
| Default | `"1"` (enabled) |
| Source | production.py:34 |
| Purpose | Apply HSTS to subdomains |

### `DJANGO_SECURE_HSTS_PRELOAD`

| Property | Value |
|----------|-------|
| Default | `"1"` (enabled) |
| Source | production.py:35 |
| Purpose | Allow browser HSTS preload list inclusion |

### `DJANGO_SECURE_PROXY_SSL_HEADER_NAME` and `DJANGO_SECURE_PROXY_SSL_HEADER_VALUE`

| Property | Value |
|----------|-------|
| Default | `"HTTP_X_FORWARDED_PROTO"` / `"https"` |
| Source | base.py:199-200 |
| Purpose | Header name and value indicating upstream SSL (for reverse proxy setups) |

Note: `production.py` hardcodes `SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")`, overriding the base.py configurable values. The env vars only take effect in development.

### `DJANGO_USE_X_FORWARDED_HOST`

| Property | Value |
|----------|-------|
| Default | `True` |
| Source | base.py:195 |
| Purpose | Trust the `X-Forwarded-Host` header for URL generation (behind a reverse proxy) |

---

## Upload Limits

### `DJANGO_DATA_UPLOAD_MAX_MEMORY_SIZE`

| Property | Value |
|----------|-------|
| Default | `10485760` (10 MB) |
| Source | base.py:217 |
| Purpose | Maximum size in bytes for request bodies |

### `DJANGO_FILE_UPLOAD_MAX_MEMORY_SIZE`

| Property | Value |
|----------|-------|
| Default | `10485760` (10 MB) |
| Source | base.py:218 |
| Purpose | Maximum size in bytes for file uploads |

---

## Logging

### `DJANGO_LOG_LEVEL`

| Property | Value |
|----------|-------|
| Default | `"INFO"` |
| Source | base.py:273 |
| Purpose | Controls log verbosity for `django`, `researchers`, and `search` loggers |
| Valid values | `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL` |

Logging uses structured JSON format to console (stdout):
```json
{"ts":"2026-05-29 12:00:00","level":"INFO","logger":"researchers","msg":"..."}
```

Logger hierarchy:
- `django` — all Django internals (level: configurable)
- `django.request` — HTTP request logging (level: always `WARNING`)
- `researchers` — application-level logs (level: configurable)
- `search` — search view logs (level: configurable)

---

## Wagtail

### `WAGTAILADMIN_BASE_URL`

| Property | Value |
|----------|-------|
| Default | `"http://example.com"` |
| Source | base.py:235 |
| Purpose | Base URL for Wagtail admin — used in notification emails and external links |

---

## Frontend

### `NEXT_PUBLIC_WAGTAIL_BASE_URL`

| Property | Value |
|----------|-------|
| Required | No |
| Default | `"http://127.0.0.1:8000"` (hardcoded in `app/lib/config.js`) |
| Source | `frontend/app/lib/config.js` |
| Purpose | Backend API base URL — all API calls are prefixed with this |
| Where to set | `frontend/.env.local` |

**How it's used**:
```js
// frontend/app/lib/config.js
const DEFAULT_WAGTAIL_BASE_URL = "http://127.0.0.1:8000";

export function getWagtailBackendBaseUrl() {
  return String(process.env.NEXT_PUBLIC_WAGTAIL_BASE_URL || DEFAULT_WAGTAIL_BASE_URL).trim().replace(/\/+$/, "");
}

export function getWagtailPagesApiUrl() {
  return `${getWagtailBackendBaseUrl()}/api/v2/pages/`;
}
```

Trailing slashes are stripped automatically. For example, `http://127.0.0.1:8000/` becomes `http://127.0.0.1:8000`.

---

## `.env` File Templates

### Development (backend/.env)

Minimal development setup — all other variables use safe defaults:
```
# Uncomment for MariaDB (default: SQLite)
# DATABASE_URL=mysql://rri_user:rri_password@127.0.0.1:3306/rri_imprint

# Optional: custom dev secret key
# DJANGO_SECRET_KEY=dev-custom-secret-key
```

### Production (root .env example)

See `backend/.env.example` for the complete template (39 lines). Key production variables:
```
DJANGO_SETTINGS_MODULE=backend.settings.production
DJANGO_DEBUG=0
DJANGO_SECRET_KEY=<generated-key>
DJANGO_ALLOWED_HOSTS=example.com,www.example.com
DJANGO_CORS_ALLOWED_ORIGINS=https://app.example.com
DJANGO_CSRF_TRUSTED_ORIGINS=https://app.example.com
DATABASE_URL=mysql://rri_user:password@127.0.0.1:3306/rri_imprint
REDIS_URL=redis://127.0.0.1:6379/1
DJANGO_LOG_LEVEL=INFO
WAGTAILADMIN_BASE_URL=https://app.example.com
```

### Frontend (frontend/.env.local)

```
NEXT_PUBLIC_WAGTAIL_BASE_URL=http://127.0.0.1:8000
```

---

## Variable Validation

### How Production Settings Enforce Required Variables

`production.py` raises `ImproperlyConfigured` on startup if:
1. `DJANGO_SECRET_KEY` is missing or starts with `django-insecure-`
2. `DATABASE_URL` is missing
3. `DJANGO_ALLOWED_HOSTS` is empty

If any check fails, the application will not start. This prevents running in production with insecure defaults.

### What Happens When Optional Variables Are Missing

For all optional variables, the project falls back to a documented default (shown in the tables above). The application starts and operates normally with these defaults.

---

## Related Documentation

- **[backend-setup.md](./backend-setup.md)** — Full backend installation walkthrough
- **[frontend-setup.md](./frontend-setup.md)** — Frontend environment configuration
- **[database-setup.md](./database-setup.md)** — MariaDB configuration
- **[backend/settings-architecture.md](../backend/settings-architecture.md)** — Settings hierarchy details
- **[backend/security.md](../backend/security.md)** — Security hardening
- **[Runtime operations](../runtime/operations.md)** — Day-to-day use of these variables
