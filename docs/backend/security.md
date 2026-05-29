# Security Hardening

> **Purpose**: Production security hardening reference — SSL, HSTS, CORS, CSRF, session security, upload limits, and all security-relevant settings.
> **Audience**: Deployment engineers, system administrators, security auditors.
> **Prerequisites**: [Settings architecture](./settings-architecture.md), [Middleware](./middleware.md).
> **Related**: [Deployment guide](../../README.md#deployment-guide), [Caching architecture](../architecture/caching-architecture.md).

---

## 1. Security Posture

The project implements defense-in-depth at multiple layers:

- **Transport layer**: SSL/TLS enforced via `SECURE_SSL_REDIRECT` and HSTS
- **Application layer**: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Session layer**: Secure cookies (`SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`)
- **Input layer**: Upload size limits, Django's built-in XSS/CSRF/SQL injection protections

---

## 2. SSL/TLS Configuration

From `production.py:29-41`:

| Setting | Value | Effect |
|---------|-------|--------|
| `SECURE_SSL_REDIRECT` | `"1"` (env override) | Redirect all HTTP to HTTPS |
| `SECURE_PROXY_SSL_HEADER` | `("HTTP_X_FORWARDED_PROTO", "https")` | Trust nginx's forwarded protocol header |
| `SECURE_HSTS_SECONDS` | `31536000` (1 year) | Instruct browsers to always use HTTPS |
| `SECURE_HSTS_INCLUDE_SUBDOMAINS` | `"1"` | Apply HSTS to all subdomains |
| `SECURE_HSTS_PRELOAD` | `"1"` | Opt in to browser HSTS preload lists |

**Important**: These defaults assume nginx terminates SSL. The proxy SSL header (`HTTP_X_FORWARDED_PROTO`) tells Django the original request was HTTPS even though the connection to Gunicorn is HTTP. The `SECURE_PROXY_SSL_HEADER` is also defined in `base.py:198-201` with environment-variable overrides for both the header name and value.

---

## 3. Cookie Security

| Setting | Value | Source | Effect |
|---------|-------|--------|--------|
| `SESSION_COOKIE_SECURE` | `"1"` | `production.py:30` | Session cookies only transmitted over HTTPS |
| `CSRF_COOKIE_SECURE` | `"1"` | `production.py:31` | CSRF cookie only transmitted over HTTPS |

Both are set via `os.getenv()` with a default of `"1"` and evaluated with `== "1"`.

---

## 4. Clickjacking Protection

| Setting | Value | Source | Effect |
|---------|-------|--------|--------|
| `X_FRAME_OPTIONS` | `"DENY"` | `production.py:38` | No page can be framed (extends Django's `XFrameOptionsMiddleware`) |
| CSP `frame-ancestors 'none'` | In API headers | `middleware.py:16` | API responses cannot be framed (`ApiSecurityHeadersMiddleware`) |

---

## 5. Content Security

| Setting | Value | Source | Scope |
|---------|-------|--------|-------|
| `SECURE_CONTENT_TYPE_NOSNIFF` | `True` | `production.py:37` | Prevents MIME type sniffing |
| `SECURE_REFERRER_POLICY` | `"same-origin"` | `production.py:39` | Restricts referrer information |
| CSP (API) | `default-src 'none'` | `middleware.py:16` | Prevents script/style/image execution on `/api/` routes |

---

## 6. CORS Configuration

| Environment | Configuration | Source | Behavior |
|-------------|--------------|--------|----------|
| Development | `CORS_ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]` | `dev.py:24-30` | Hardcoded dev origins |
| Production | `CORS_ALLOWED_ORIGINS = _csv_env("DJANGO_CORS_ALLOWED_ORIGINS")` | `production.py:26` | Env-configured explicit origins |

- No wildcard (`*`) origins allowed in production
- `CSRF_TRUSTED_ORIGINS` follows the same pattern (dev defaults at `dev.py:32-38`, prod env-configured at `production.py:27`)
- `CorsMiddleware` must be first in `MIDDLEWARE` to handle preflight requests before CSRF checks

---

## 7. SECRET_KEY Management

From `production.py:9-13`:

```python
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", os.getenv("SECRET_KEY", ""))
if not SECRET_KEY or SECRET_KEY.startswith("django-insecure-"):
    raise ImproperlyConfigured(
        "Set DJANGO_SECRET_KEY to a strong non-default value in production."
    )
```

- **Dev**: Falls back to `"dev-only-change-me-before-shared-deployments"` (`dev.py:10-13`)
- **Prod**: Must be set via `DJANGO_SECRET_KEY` env var (also checks `SECRET_KEY` as fallback)
- **Prod validation**: Raises `ImproperlyConfigured` if missing **or** starts with `"django-insecure-"` (prevents accidental use of `startproject`-generated keys)

---

## 8. ALLOWED_HOSTS

- **Dev**: Defaults to `["127.0.0.1", "localhost", "testserver"]` (`dev.py:16-19`)
- **Prod**: Required via `DJANGO_ALLOWED_HOSTS` — comma-separated. Raises `ImproperlyConfigured` if empty (`production.py:20-24`)
- **`testserver`** is included in dev for Django's test client

---

## 9. Upload Limits

From `base.py:216-218`:

| Setting | Default | Env Override |
|---------|---------|-------------|
| `DATA_UPLOAD_MAX_NUMBER_FIELDS` | `10_000` | Hardcoded — Wagtail complex page forms can exceed Django's 1,000 default |
| `DATA_UPLOAD_MAX_MEMORY_SIZE` | 10 MB | `DJANGO_DATA_UPLOAD_MAX_MEMORY_SIZE` (`base.py:217`) |
| `FILE_UPLOAD_MAX_MEMORY_SIZE` | 10 MB | `DJANGO_FILE_UPLOAD_MAX_MEMORY_SIZE` (`base.py:218`) |

---

## 10. Static File Security

| Setting | Dev | Prod | Source |
|---------|-----|------|--------|
| `STATICFILES_STORAGE` | `StaticFilesStorage` | `ManifestStaticFilesStorage` | `base.py:210`, `production.py:51` |
| Effect | Direct filenames | Hash-appended filenames (`main.a1b2c3.js`) | — |
| Benefit | — | Cache-busting prevents stale assets after Wagtail upgrades | — |

---

## 11. Wagtail-Specific Security

- **`WAGTAILDOCS_EXTENSIONS`** (`base.py:241-252`): Whitelist of 10 allowed document extensions — `csv`, `docx`, `key`, `odt`, `pdf`, `pptx`, `rtf`, `txt`, `xlsx`, `zip`. Prevents arbitrary file uploads.
- **Wagtail admin**: Session-based authentication (Django's built-in auth system)
- **Public API**: No authentication — all data is read-only and public
- **Page visibility**: Only `.live().public()` pages appear in the API; draft and private pages are invisible
- **Password validators**: All four Django defaults are active (`base.py:149-162`)

---

## 12. Security Checklist

For production deployment verification:

- [ ] `DJANGO_DEBUG=0`
- [ ] `DJANGO_SECRET_KEY` set to strong random value (not starting with `django-insecure-`)
- [ ] `DJANGO_ALLOWED_HOSTS` contains production domain(s)
- [ ] `DJANGO_CORS_ALLOWED_ORIGINS` set to frontend origin(s)
- [ ] `DJANGO_CSRF_TRUSTED_ORIGINS` matches CORS origins
- [ ] `DJANGO_SECURE_SSL_REDIRECT=1`
- [ ] `DJANGO_SESSION_COOKIE_SECURE=1`
- [ ] `DJANGO_CSRF_COOKIE_SECURE=1`
- [ ] SSL certificate configured (certbot/Let's Encrypt recommended)
- [ ] nginx configured to set `X-Forwarded-Proto: https`
- [ ] `REDIS_URL` set for production cache (prevents independent per-worker caches)
- [ ] `DJANGO_LOG_LEVEL=INFO` (or `WARNING` for quieter production logs)
- [ ] Wagtail admin accessible only via HTTPS
- [ ] Static files served by nginx, not Django

---

## 13. Future Security Considerations

1. **Rate limiting**: No rate limiting exists on any endpoint. Consider `django-ratelimit` for `/api/` routes before public launch.
2. **API key authentication**: If write endpoints are added in the future, add token-based authentication for API consumers.
3. **Subresource Integrity (SRI)**: When serving static files via CDN, add SRI hashes to prevent compromised CDN attacks.
4. **Content Security Policy for Wagtail admin**: The current CSP only applies to `/api/` routes via `ApiSecurityHeadersMiddleware`. The Wagtail admin at `/admin/` has no CSP. Consider a more permissive CSP for admin routes.
5. **Database encryption at rest**: MariaDB supports tablespace encryption — consider for sensitive content if stored in the future.
