# Middleware

> **Purpose**: Complete reference for Django middleware configuration and the custom ApiSecurityHeadersMiddleware.
> **Audience**: Backend developers, security engineers.
> **Prerequisites**: [Settings architecture](./settings-architecture.md).
> **Related**: [Security hardening](./security.md).

---

## 1. Middleware Stack

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

## 2. CORS Configuration

`django-cors-headers` is the **first** middleware (must precede any middleware that generates responses):

- **Position**: `MIDDLEWARE[0]`
- **Dev**: Allows `http://localhost:3000`, `http://127.0.0.1:3000`
- **Prod**: Set via `DJANGO_CORS_ALLOWED_ORIGINS` — comma-separated origins
- No `CORS_ALLOW_ALL_ORIGINS` in production (explicit origin list only)

Source: `dev.py:24-30`, `production.py:26`.

---

## 3. ApiSecurityHeadersMiddleware

From `backend/backend/middleware.py` (23 lines):

- **Activation**: **Production only** — appended to `MIDDLEWARE` in `production.py:42-45`
- **Scope**: Applies only to requests where `request.path.startswith("/api/")` — avoids interfering with Wagtail admin/editor assets
- **Uses `response.setdefault()`** — never overrides existing headers set by views or other middleware

```python
class ApiSecurityHeadersMiddleware:
    """
    Apply additional security headers to API routes only.
    This avoids interfering with Wagtail admin/editor assets.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if request.path.startswith("/api/"):
            response.setdefault(
                "Content-Security-Policy",
                "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
            )
            response.setdefault("Referrer-Policy", "same-origin")
            response.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
            response.setdefault("X-Content-Type-Options", "nosniff")
            response.setdefault("X-Frame-Options", "DENY")

        return response
```

### Headers Applied

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | `default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'` | Restrictive CSP for pure JSON API — no scripts, styles, images, or frames needed |
| `Referrer-Policy` | `same-origin` | Restrict referrer information to same origin |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disable browser features not needed by API consumers |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME type sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking of API responses |

### Design Rationale

These headers are API-only because:
- The Wagtail admin at `/admin/` requires `script-src` and `style-src` for the Draftail editor, telepath widgets, and admin assets
- API responses are pure JSON — the most restrictive CSP possible is appropriate
- Using `setdefault()` ensures that if a specific API endpoint needs a different header, it can override the middleware default
