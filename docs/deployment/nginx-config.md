# Nginx Configuration — SSL and Reverse Proxy

Configure Nginx as a reverse proxy with SSL termination.

## 1. Obtain an SSL Certificate

Run Certbot to get a free Let's Encrypt certificate. This also automatically configures SSL in Nginx.

```bash
sudo certbot --nginx -d yourdomain.com
```

Follow the prompts:
- Enter your email address (for renewal notices)
- Agree to the terms of service
- Choose whether to redirect HTTP to HTTPS (select **2 — Redirect**)

Certbot modifies your Nginx config to add SSL settings. It also sets up automatic renewal via a systemd timer.

### Verify Auto-Renewal

```bash
sudo systemctl status certbot.timer
# Expected: Active: active (waiting)
```

## 2. Replace the Nginx Config

Certbot creates a basic config. Replace it with one that properly routes traffic to the backend and frontend.

Create `/etc/nginx/sites-available/rri`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL — managed by Certbot (paths may vary — keep certbot's values)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Upload limit — Wagtail accepts files up to 10MB
    client_max_body_size 15M;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy same-origin;

    # ──────────────────────────────────────────────
    # Backend: API
    # ──────────────────────────────────────────────
    location /api/ {
        proxy_pass http://unix:/run/rri-backend.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120;
    }

    # ──────────────────────────────────────────────
    # Backend: Wagtail Admin
    # ──────────────────────────────────────────────
    location /admin/ {
        proxy_pass http://unix:/run/rri-backend.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ──────────────────────────────────────────────
    # Backend: Django Admin
    # ──────────────────────────────────────────────
    location /django-admin/ {
        proxy_pass http://unix:/run/rri-backend.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ──────────────────────────────────────────────
    # Backend: Document downloads
    # ──────────────────────────────────────────────
    location /documents/ {
        proxy_pass http://unix:/run/rri-backend.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ──────────────────────────────────────────────
    # Backend: Wagtail search
    # ──────────────────────────────────────────────
    location /search/ {
        proxy_pass http://unix:/run/rri-backend.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ──────────────────────────────────────────────
    # Static files — served directly by Nginx
    # ──────────────────────────────────────────────
    location /static/ {
        alias /opt/rri-imprint/backend/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # ──────────────────────────────────────────────
    # Media files — served directly by Nginx
    # ──────────────────────────────────────────────
    location /media/ {
        alias /opt/rri-imprint/backend/media/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # ──────────────────────────────────────────────
    # Frontend — everything else goes to Next.js
    # ──────────────────────────────────────────────
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**What each location block does**:

| Location | Target | Why |
|---|---|---|
| `/api/` | Gunicorn socket | Backend JSON API (researchers, publications, images, site settings) |
| `/admin/` | Gunicorn socket | Wagtail CMS admin interface |
| `/django-admin/` | Gunicorn socket | Django admin (used internally by Wagtail) |
| `/documents/` | Gunicorn socket | Wagtail document downloads (need Django for access control) |
| `/search/` | Gunicorn socket | Wagtail search page |
| `/static/` | Nginx alias | Django/Wagtail CSS/JS — no need to involve Python |
| `/media/` | Nginx alias | User-uploaded images — fast, no Python overhead |
| `/` (everything else) | Next.js port 3000 | Frontend application |

## 3. Apply the Config

```bash
# Remove the default Certbot-created config
sudo rm /etc/nginx/sites-enabled/default

# Enable the RRI config
sudo ln -s /etc/nginx/sites-available/rri /etc/nginx/sites-enabled/

# Test the config
sudo nginx -t
# Expected: syntax is ok — test is successful

# Reload Nginx
sudo systemctl reload nginx
```

## 4. Verify Everything Routes Correctly

```bash
# API
curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com/api/site-settings/
# Expected: 200

# Admin
curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com/admin/
# Expected: 200 (Wagtail admin login page)

# Frontend
curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com/
# Expected: 200

# Security headers
curl -sI https://yourdomain.com/ | grep -i "x-frame-options"
# Expected: X-Frame-Options: DENY

curl -sI https://yourdomain.com/ | grep -i "x-content-type-options"
# Expected: X-Content-Type-Options: nosniff

# SSL
curl -sI https://yourdomain.com/ | head -1
# Expected: HTTP/2 200
```

## 5. Troubleshooting Common Nginx Issues

| Problem | Likely Cause | Fix |
|---|---|---|
| 502 Bad Gateway | Gunicorn not running | `sudo systemctl restart rri-backend` |
| 413 Request Entity Too Large | File upload exceeds `client_max_body_size` | Increase `client_max_body_size` in nginx config |
| 504 Gateway Timeout | Request takes longer than `proxy_read_timeout` | Increase `proxy_read_timeout` |
| Static files 404 | Wrong `alias` path | Check `alias /opt/rri-imprint/backend/static/;` exists |
| Admin CSS broken | `collectstatic` not run | `python manage.py collectstatic --noinput` |
| Mixed content (HTTP images on HTTPS page) | `NEXT_PUBLIC_WAGTAIL_BASE_URL` set to HTTP | Change to `https://yourdomain.com` |

## Summary — What You Have After This Step

- [x] SSL certificate obtained and auto-renewal configured
- [x] Nginx routing traffic correctly to backend (API, admin, static) and frontend
- [x] Security headers set on all responses
- [x] Static and media files served directly (fast, no Python overhead)
- [x] All endpoints returning 200

Next step: `backup-and-restore.md`
