# RRI Imprint Collections - Consolidated Project README

This README replaces multiple top-level progress documents with one complete, up-to-date reference for what has been implemented so far.

## Project Overview

RRI Imprint Collections is a full-stack web platform for publishing researcher profile pages and structured scholarly content.

- Backend: Django + Wagtail CMS + SQLite
- Frontend: Next.js App Router + React
- Data model: StreamField-driven researcher content (profile, bio sections, sidebar sections, smart content, gallery)

## Completed Work So Far

### 1. Global Visual Theme and Layout

Implemented a global academic-style visual system:

- Repeating background pattern support at `frontend/public/assets/background/rri-pattern.png`
- Site-wide overlay container for readability (`.site-container`)
- Serif typography system with heading/body hierarchy
- Archive-style color palette and spacing system

Notes:

- If the background image file is missing, the fallback background color still renders.
- Previous pattern setup docs are now consolidated into this README.

### 2. Rich Text Formatting End-to-End

Enabled rich text formatting in Wagtail and frontend rendering:

- Bold, italic, underline, links
- Ordered and unordered lists
- Heading levels (h2, h3, h4)
- Styled blockquotes and consistent link appearance

Backend implementation:

- RichTextBlock feature sets declared in researcher block definitions

Frontend implementation:

- Rich text styling class and typography rules
- HTML rendering in researcher content components

### 3. Smart Content and Gallery Rendering (Critical Fix)

Root cause that was fixed:

- Sidebar block schema in migrations did not include `smart_content` and `gallery` even though blocks were defined in code.
- API therefore returned missing/empty values, so frontend showed fallback empty states.

Fix implemented:

- New migration chain added and applied to align schema with current block definitions.
- Frontend extraction and section rendering logic verified for nested `value.smart_content` and `value.gallery` structures.
- Smart content rendering component verified for supported block types.

Result:

- Publications, guidance, news, supervision, and gallery data now flow correctly from Wagtail to Next.js pages when content is populated and published.

### 4. Frontend Researcher Experience Improvements

Frontend changes across researcher and layout components include:

- Improved section page rendering/fallback behavior
- Breadcrumb/navigation enhancements
- Header/footer/layout updates
- Additional researcher-related components and gallery support

### 5. Migration and Data State

Backend migrations include newer researcher migration files and schema updates for sidebar content structures.

- Migration sequence includes post-0013 updates to correct schema mismatch
- Database currently reflects local development progress

## Architecture and Data Flow

1. Editors create structured content in Wagtail.
2. Content is stored in StreamField JSON structures in the backend database.
3. Wagtail API exposes researcher pages and nested block values.
4. Next.js fetches API data and normalizes sidebar/profile/content blocks.
5. React components render smart content, rich text, and galleries.

## Current Repository State

There are many in-progress code changes in both backend and frontend, including:

- Backend settings/models/blocks/migrations and media assets
- Frontend app components, routing pages, styles, and package metadata

This README reflects those cumulative implementation efforts as of April 22, 2026.

## Local Development

### Backend

```bash
cd backend
source ../.venv/Scripts/activate
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Deployment Guide

### 1. Linux server setup (Ubuntu)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential nginx certbot python3-certbot-nginx python3-dev default-libmysqlclient-dev
```

### 2. Clone and dependency installation

```bash
git clone https://github.com/Viggy-Bhat/rri-imprint-collections.git
cd rri-imprint-collections
cp .env.example .env
```

Install backend/frontend dependencies:

```bash
# Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# Frontend
cd frontend
npm ci
cd ..
```

### 3. Environment variable configuration

Edit .env and set production values:

- DJANGO_SECRET_KEY
- DJANGO_ALLOWED_HOSTS
- DATABASE_URL (e.g., `mysql://db_user:db_password@127.0.0.1:3306/db_name`)
- REDIS_URL
- DJANGO_CORS_ALLOWED_ORIGINS
- DJANGO_CSRF_TRUSTED_ORIGINS
- NEXT_PUBLIC_WAGTAIL_BASE_URL (e.g., `http://your-backend-domain.com`)

Set DJANGO_DEBUG=0 in production.

### 4. Database migrations

```bash
cd backend
source ../.venv/bin/activate
DJANGO_SETTINGS_MODULE=backend.settings.production python manage.py migrate --noinput
```

### 5. Server startup instructions

Backend startup command:

```bash
cd backend
source ../.venv/bin/activate
DJANGO_SETTINGS_MODULE=backend.settings.production gunicorn backend.wsgi:application --workers 4 --bind 0.0.0.0:8000 --timeout 120
```

Frontend startup command:

```bash
cd frontend
npm run build
npm run start -- -p 3000
```

### 6. Reverse proxy setup with nginx

Create /etc/nginx/sites-available/rri-imprint:

```nginx
server {
  listen 80;
  server_name example.com www.example.com;

  location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /admin/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /documents/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /media/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/rri-imprint /etc/nginx/sites-enabled/rri-imprint
sudo nginx -t
sudo systemctl reload nginx
```

### 7. SSL configuration with certbot

```bash
sudo certbot --nginx -d example.com -d www.example.com
sudo certbot renew --dry-run
```

After SSL is active, set:

- DJANGO_SECURE_SSL_REDIRECT=1
- DJANGO_SESSION_COOKIE_SECURE=1
- DJANGO_CSRF_COOKIE_SECURE=1
- DJANGO_SECURE_HSTS_SECONDS=31536000

## Validation Checklist

- Backend starts without system check errors
- Migrations apply successfully
- Frontend builds successfully
- Researcher section pages render smart content when provided
- Gallery blocks display images and captions
- Rich text formatting appears correctly in biography/content/sidebar text

## Known Operational Notes

- Ensure pages are published in Wagtail for API visibility.
- Ensure section slugs in content match frontend route expectations.
- For global pattern visuals, keep `rri-pattern.png` at:
  - `frontend/public/assets/background/rri-pattern.png`

## What This README Replaces

This consolidated README replaces these previous top-level files:

- `BACKGROUND_SETUP.md`
- `IMPLEMENTATION_SUMMARY.md`
- `INVESTIGATION_FINDINGS_DETAILED.md`
- `QUICK_REFERENCE.md`
- `SMART_CONTENT_DEBUG_ANALYSIS.md`
- `SMART_CONTENT_FIX_SUMMARY.md`

## Next Recommended Steps

1. Finalize which generated/runtime artifacts should be tracked (for example `.pyc`, SQLite, and media variations).
2. Add or refine `.gitignore` to avoid noisy commits.
3. Run one final backend + frontend smoke test before deployment.
4. Tag this commit as the baseline for the consolidated documentation state.
