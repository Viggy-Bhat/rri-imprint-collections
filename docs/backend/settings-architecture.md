# Settings Architecture

> **Purpose**: Complete reference for Django settings architecture — three-tier split (base/dev/production), environment variable helpers, database configuration, cache, logging, and the local.py override pattern.
> **Audience**: Backend developers, deployment engineers, system administrators.
> **Prerequisites**: [System overview](../architecture/system-overview.md), [Backend project structure](./project-structure.md).
> **Related**: [Security hardening](./security.md), [Caching architecture](../architecture/caching-architecture.md).

---

## 1. Settings Hierarchy

The project uses a three-tier settings architecture:

```
base.py ← dev.py
        ← production.py
```

- **`base.py`** (318 lines): Shared configuration loaded by all environments. Contains env helpers, `INSTALLED_APPS`, `MIDDLEWARE`, database config, cache, logging.
- **`dev.py`** (43 lines): `from .base import *` + development overrides: `DEBUG=True`, dev `SECRET_KEY`, CORS for `localhost:3000`, console email.
- **`production.py`** (56 lines): `from .base import *` + production overrides: `DEBUG=False`, enforces `SECRET_KEY`/`DATABASE_URL`/`ALLOWED_HOSTS`, SSL, HSTS, appends `ApiSecurityHeadersMiddleware`.
- Both `dev.py` and `production.py` support `from .local import *` at the end for machine-specific overrides (silently ignored if missing).

`manage.py` defaults to `backend.settings.dev`. Production requires:

```
DJANGO_SETTINGS_MODULE=backend.settings.production
```

---

## 2. Environment Variable Helpers

From `base.py:27-45`:

| Helper | Signature | Behavior |
|--------|-----------|----------|
| `env_bool(name, default)` | `env_bool("DJANGO_DEBUG", False)` | Returns `True` if value is `"1"`, `"true"`, `"yes"`, or `"on"` |
| `env_int(name, default)` | `env_int("DJANGO_CACHE_TIMEOUT", 300)` | Returns int, default if empty or missing |
| `_csv_env(name, default)` | `_csv_env("DJANGO_ALLOWED_HOSTS", default=[])` | Splits comma-separated string into list |

All helpers read from `os.getenv()`. `load_dotenv()` is called at module level before any env reads (`base.py:16`).

---

## 3. Complete Environment Variable Reference

Derived from `backend/.env.example` and all three settings files.

### Core Settings

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `DJANGO_SETTINGS_MODULE` | Prod only | `backend.settings.dev` | `manage.py:9` | Settings module path |
| `DJANGO_DEBUG` | No | `"1"` (dev), `False` (prod) | `dev.py:7`, `production.py:6` | Enable debug mode |
| `DJANGO_SECRET_KEY` | **Prod only** | Dev default key | `dev.py:10-13`, `production.py:9-13` | Django secret key; production refuses `"django-insecure-"` prefix |
| `DJANGO_ALLOWED_HOSTS` | **Prod only** | `["127.0.0.1", "localhost", "testserver"]` (dev) | `dev.py:16-19`, `production.py:20-24` | Comma-separated hostnames |

### Database

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `DATABASE_URL` | **Prod only** | None → SQLite fallback | `base.py:121-143` | Database connection string (e.g. `mysql://user:pass@host:3306/db`) |
| `DATABASE_SSL_REQUIRE` | No | `False` | `base.py:127` | Require SSL for database connections |
| `DJANGO_DB_CONN_MAX_AGE` | No | `60` | `base.py:126` | Connection pool lifetime in seconds |

### Cache

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `REDIS_URL` | No | `""` → LocMem fallback | `base.py:254-271` | Redis connection string (e.g. `redis://redis:6379/1`) |
| `DJANGO_CACHE_TIMEOUT` | No | `300` | `base.py:261,269` | Cache TTL in seconds |

### Networking / Security

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `DJANGO_CORS_ALLOWED_ORIGINS` | Prod | `["http://localhost:3000", "http://127.0.0.1:3000"]` (dev) | `dev.py:24-30`, `production.py:26` | CORS allowed origins |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | Prod | Same as CORS (dev) | `dev.py:32-38`, `production.py:27` | CSRF trusted origins |
| `DJANGO_SECURE_SSL_REDIRECT` | No | `"1"` (prod) | `production.py:29` | Force HTTPS |
| `DJANGO_SESSION_COOKIE_SECURE` | No | `"1"` (prod) | `production.py:30` | Secure session cookies |
| `DJANGO_CSRF_COOKIE_SECURE` | No | `"1"` (prod) | `production.py:31` | Secure CSRF cookies |
| `DJANGO_SECURE_HSTS_SECONDS` | No | `31536000` (1 year) | `production.py:33` | HSTS max-age |
| `DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS` | No | `"1"` | `production.py:34` | HSTS include subdomains |
| `DJANGO_SECURE_HSTS_PRELOAD` | No | `"1"` | `production.py:35` | HSTS preload |
| `DJANGO_SECURE_PROXY_SSL_HEADER_NAME` | No | `HTTP_X_FORWARDED_PROTO` | `base.py:199` | Proxy SSL header name |
| `DJANGO_SECURE_PROXY_SSL_HEADER_VALUE` | No | `https` | `base.py:200` | Proxy SSL header value |
| `DJANGO_USE_X_FORWARDED_HOST` | No | `True` | `base.py:195` | Trust X-Forwarded-Host header |

### Upload Limits

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `DJANGO_DATA_UPLOAD_MAX_MEMORY_SIZE` | No | 10 MB | `base.py:217` | Max request body size |
| `DJANGO_FILE_UPLOAD_MAX_MEMORY_SIZE` | No | 10 MB | `base.py:218` | Max file upload size |

### Logging

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `DJANGO_LOG_LEVEL` | No | `INFO` | `base.py:273` | Log level (`DEBUG`/`INFO`/`WARNING`/`ERROR`) |

### Wagtail

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `WAGTAILADMIN_BASE_URL` | Prod | `http://example.com` | `base.py:235` | Public Wagtail admin URL (used for notification emails) |

---

## 4. Database Configuration Flow

From `base.py:121-143`:

```
load_dotenv() → read DATABASE_URL → dj_database_url.parse() → configure ENGINE
                                                             → if mysql: enforce utf8mb4 + collation
                                                             → if empty: fallback to SQLite (BASE_DIR / db.sqlite3)
```

When a `DATABASE_URL` is provided, `dj_database_url.parse()` is called with `conn_max_age` and `ssl_require` options. If the resulting `ENGINE` contains `"mysql"`, the charset is set to `utf8mb4` and the collation connection is set to `utf8mb4_general_ci`. When `DATABASE_URL` is empty or unset, the database falls back to SQLite at `BASE_DIR / "db.sqlite3"`.

---

## 5. Installed Apps Organization

From `base.py:54-81`:

```python
INSTALLED_APPS = [
    # Project apps
    "home", "search",
    # Third-party (infrastructure)
    "corsheaders",
    # Wagtail core
    "wagtail.contrib.forms", "wagtail.contrib.settings", "wagtail.contrib.redirects",
    "wagtail.embeds", "wagtail.sites", "wagtail.users", "wagtail.snippets",
    "wagtail.documents", "wagtail.images", "wagtail.search", "wagtail.admin", "wagtail",
    # Wagtail dependencies
    "modelcluster", "taggit", "django_filters",
    # Django core
    "django.contrib.admin", "django.contrib.auth", "django.contrib.contenttypes",
    "django.contrib.sessions", "django.contrib.messages", "django.contrib.staticfiles",
    # Project apps (after Django + Wagtail)
    "researchers",
    # Wagtail API
    "wagtail.api.v2",
]
```

Order matters: `"corsheaders"` must precede Django-contrib apps so `CorsMiddleware` can be placed first; `"researchers"` must be after Wagtail and Django core (it depends on Wagtail models).

---

## 6. Middleware Stack Order

From `base.py:83-93`:

| Position | Middleware | Purpose |
|----------|-----------|---------|
| 1 | `CorsMiddleware` | Must be first — handles CORS preflight before any other processing |
| 2 | `SecurityMiddleware` | Security headers, SSL redirect |
| 3 | `SessionMiddleware` | Session support |
| 4 | `CommonMiddleware` | URL normalization, content-length |
| 5 | `CsrfViewMiddleware` | CSRF protection |
| 6 | `AuthenticationMiddleware` | `request.user` |
| 7 | `MessageMiddleware` | Flash messages |
| 8 | `XFrameOptionsMiddleware` | Clickjacking protection |
| 9 | `RedirectMiddleware` | Wagtail redirect handling |

In production (`production.py:42-45`): `ApiSecurityHeadersMiddleware` is appended at position 10.

---

## 7. Logging Configuration

From `base.py:275-315`:

- **Format**: Structured JSON — `{"ts":"...","level":"...","logger":"...","msg":"..."}`
- **Handler**: Console (`StreamHandler`) — logs to stdout for container/process manager compatibility
- **Root logger**: Level from `DJANGO_LOG_LEVEL`
- **Named loggers**:
  - `django`: `LOG_LEVEL`
  - `django.request`: `WARNING` (suppresses routine request logging)
  - `researchers`: `LOG_LEVEL`
  - `search`: `LOG_LEVEL`
- No file-based logging — all output to stdout

---

## 8. staticfiles Configuration

From `base.py:180-212`:

- `STATICFILES_DIRS = [PROJECT_DIR / "static"]` — additional static file locations
- `STATIC_ROOT = BASE_DIR / "static"` — `collectstatic` output
- `MEDIA_ROOT = BASE_DIR / "media"` — uploaded files
- `STATIC_URL = "/static/"`, `MEDIA_URL = "/media/"`
- Production: `ManifestStaticFilesStorage` (cache-busting hashes in filenames) — set at `production.py:51`
- Dev: `StaticFilesStorage` (no hashing, faster) — default at `base.py:210`
- In DEBUG mode only: `urlpatterns` includes `static()` and `staticfiles_urlpatterns()` for serving media files via Django

---

## 9. local.py Override Pattern

Both `dev.py` and `production.py` end with:

```python
try:
    from .local import *
except ImportError:
    pass
```

(`dev.py:40-43`, `production.py:53-56`)

This allows developers/deployers to create `backend/backend/settings/local.py` with machine-specific overrides without modifying tracked files. Common uses:
- Local database credentials (dev)
- Debug toolbar setup (dev)
- Custom cache backend for testing
- Override logging level for debugging

---

## 10. Future Refactoring Opportunities

1. **Production env var validation**: Production settings enforce `DATABASE_URL` and `SECRET_KEY` via `ImproperlyConfigured` but do not validate `CORS_ALLOWED_ORIGINS` or `CSRF_TRUSTED_ORIGINS` — these silently default to empty lists.
2. **Consider environment-aware cache prefix**: Adding a `KEY_PREFIX` based on deployment environment prevents cache key collisions when multiple environments share a Redis instance.
3. **Structured logging**: The JSON log format is manually constructed. Consider `python-json-logger` for more robust structured logging (includes request metadata, trace IDs).
