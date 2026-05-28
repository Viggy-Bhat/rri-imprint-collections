# Backend — RRI Imprint Collections

Django 5.2 + Wagtail 7.4 CMS backend for the RRI Imprint Collections platform. Serves a JSON API consumed by the Next.js frontend.

## Tech Stack

- **Framework**: Django 5.2.x
- **CMS**: Wagtail 7.4
- **Database**: SQLite (dev fallback), MariaDB (dev/production)
- **Cache**: Redis (production), LocMem (dev fallback)
- **WSGI**: Gunicorn (production)

## Quick Start

```bash
cd backend

# Activate virtual environment (Windows)
source ../.venv/Scripts/activate
# Linux/Mac:
# source ../.venv/bin/activate

# Install dependencies if needed
pip install -r requirements.txt

# Run migrations (CRITICAL — see Migration Rule below)
python manage.py migrate

# Seed default site settings
python manage.py seed_sitesettings

# Create superuser
python manage.py createsuperuser

# Start dev server
python manage.py runserver
```

The dev server runs at `http://127.0.0.1:8000`. Wagtail admin is at `/admin/`.

## CRITICAL RULE: Migrate After Every Block Change

The worst bug in this repo was caused by updating `researchers/blocks.py` without regenerating migrations. The database schema fell out of sync with code, so the API silently returned `undefined` for new fields.

**After ANY change to StreamField blocks (`blocks.py`) or models (`models.py`):**

```bash
python manage.py makemigrations
python manage.py migrate
```

Migrations were consolidated into `0001_initial.py` after the schema mismatch was resolved.

## Settings

| File | Purpose |
|------|---------|
| `backend/settings/base.py` | Shared base settings, env helpers (`env_bool`, `env_int`, `_csv_env`), installed apps, middleware, DB config, logging, Wagtail |
| `backend/settings/dev.py` | Dev settings — DEBUG=True, SQLite fallback, CORS for localhost:3000 |
| `backend/settings/production.py` | Prod settings — enforces DATABASE_URL, SECRET_KEY, ALLOWED_HOSTS, SSL, HSTS |

`manage.py` defaults to `backend.settings.dev`. Production requires:
```bash
DJANGO_SETTINGS_MODULE=backend.settings.production python manage.py runserver
```

## Environment Variables

Copy `backend/.env.example` to `.env` and set values for production:

| Variable | Required in Prod | Description |
|----------|------------------|-------------|
| `DJANGO_SETTINGS_MODULE` | Yes | `backend.settings.production` |
| `DJANGO_SECRET_KEY` | Yes | Strong random secret |
| `DJANGO_ALLOWED_HOSTS` | Yes | Comma-separated hostnames |
| `DATABASE_URL` | Yes | MariaDB connection string (e.g. `mysql://user:pass@127.0.0.1:3306/db`) |
| `DJANGO_CORS_ALLOWED_ORIGINS` | Yes | e.g. `https://app.example.com` |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | Yes | e.g. `https://app.example.com` |
| `REDIS_URL` | No | Redis cache connection |
| `WAGTAILADMIN_BASE_URL` | Yes | Public Wagtail admin URL |

Dev settings fall back to safe defaults if these are unset.

## Architecture Overview

### App Structure

```
backend/
├── backend/                  # Project config
│   ├── settings/             # base.py, dev.py, production.py
│   ├── urls.py               # URL routing (Wagtail API + custom endpoints)
│   ├── wsgi.py               # WSGI entry point
│   └── middleware.py         # Custom middleware (API security headers)
├── researchers/              # Main app — researcher pages and content
│   ├── models.py             # ResearcherPage, ResearcherSectionPage, SiteSettings
│   ├── blocks.py             # StreamField block definitions
│   ├── views.py              # 3 thin views (image, site settings, filtered items)
│   ├── wagtail_hooks.py      # Draftail underline feature registration
│   ├── admin.py              # Empty — models registered via Wagtail
│   ├── api/                  # Paginated API views
│   │   └── archive_views.py  # 4 paginated endpoints + section count
│   ├── services/             # Business logic layer
│   │   └── archive_service.py # Extract, filter, build items from StreamField blocks
│   ├── utils/                # Pure utility functions
│   │   ├── text_utils.py     # Slug normalization
│   │   ├── mapping_utils.py  # Dict/Mapping access helpers
│   │   ├── item_extractors.py # Block-type-specific extractors
│   │   ├── sorting.py        # Sort results by field
│   │   └── pagination.py     # Limit/offset pagination
│   ├── tests/                # Test suite (43 tests)
│   │   ├── test_archive_service.py
│   │   ├── test_archive_views.py
│   │   ├── test_edge_cases.py
│   │   ├── test_filtering.py
│   │   └── test_pagination.py
│   ├── management/commands/  # Custom management commands
│   │   └── seed_sitesettings.py
│   ├── templates/            # Preview template (researcherpage.html)
│   └── migrations/           # 0001_initial.py (consolidated)
├── home/                     # Wagtail home page
│   └── models.py             # HomePage (simple Page subclass)
└── search/                   # Basic search views
    └── views.py              # Search page view
```

### Models

#### `ResearcherPage` (extends `Page`)
The main researcher profile page.

| Field | Type | Description |
|-------|------|-------------|
| `title` | CharField | Researcher name (inherited from Page) |
| `birth_date` | DateField | Optional |
| `death_date` | DateField | Optional |
| `field` | CharField | Research field |
| `profile_image` | ForeignKey(Image) | Profile photo |
| `profile_items` | StreamField | Label/value pairs (Born, Field, Institution) |
| `sidebar_items` | StreamField | Sidebar sections with smart content and galleries |
| `bio_sections` | StreamField | Biography sections with rich text |

#### `ResearcherSectionPage` (extends `Page`)
Child pages of ResearcherPage for standalone section content.

| Field | Type | Description |
|-------|------|-------------|
| `subtitle` | CharField | Section subtitle |
| `smart_content` | StreamField | Publications, guidance, news, supervision, gallery blocks |

#### `SiteSettings` (extends `BaseSiteSetting`)
Registered via `@register_setting`. Configured in Wagtail Settings → Site Settings.

| Field | Description |
|-------|-------------|
| `institute_name` | Organization name |
| `department` | Department name |
| `address` | Full address |
| `phone` | Contact phone |
| `email` | Contact email |

### StreamField Blocks (`blocks.py`)

#### Content Blocks
- `BiographySectionBlock` — title + rich text content
- `SectionBlock` — title, slug, type (text/list), rich text content, item list
- `SidebarContentItemBlock` — title, link, tag, meta_text, rich text description

#### Smart Content Blocks
- `PublicationBlock` — title, journal, year, link
- `GuidanceBlock` — student_name, thesis_title, year, link
- `NewsClippingBlock` — headline, source, date, link
- `StudentSupervisionBlock` — student, topic, year

#### Media Blocks
- `GalleryImageItemBlock` — image (ImageChooserBlock), caption, about_image (rich text)
- `GalleryBlock` — title + list of GalleryImageItemBlock

#### Sidebar Item Block
- `SidebarItemBlock` — title, subtitle, slug, items list, smart_content stream, gallery list

All `RichTextBlock` fields use `RICH_TEXT_FEATURES`: bold, italic, underline, link, ol, ul, h2, h3, h4.

### Custom API Endpoints

| Endpoint | View Location | Purpose |
|----------|---------------|---------|
| `GET /api/v2/pages/` | Wagtail built-in | Wagtail v2 Pages API |
| `GET /api/images/<id>/` | `views.py` | Returns image file URL |
| `GET /api/site-settings/` | `views.py` | Returns SiteSettings JSON |
| `GET /api/researchers/<slug>/sections/<slug>/filtered-items/?search=&sort=&year=` | `views.py` | Server-side search/filter/sort |
| `GET /api/researchers/<slug>/publications/?limit=&offset=` | `api/archive_views.py` | Paginated publications |
| `GET /api/researchers/<slug>/guidance/?limit=&offset=` | `api/archive_views.py` | Paginated guidance |
| `GET /api/researchers/<slug>/news/?limit=&offset=` | `api/archive_views.py` | Paginated news |
| `GET /api/researchers/<slug>/sections/<slug>/count/` | `api/archive_views.py` | Section item count |

### Wagtail Hooks (`wagtail_hooks.py`)

Registers an `underline` feature for Draftail rich text editor (not included in Wagtail defaults).

## Data Flow

1. **Editors** create structured content in Wagtail admin (`/admin/`).
2. **Wagtail** stores StreamField JSON in the database.
3. **API** exposes pages and nested block values via `/api/v2/pages/`.
4. **Service layer** (`services/archive_service.py`) extracts, normalizes, filters, and sorts items from StreamField blocks.
5. **View layer** (`views.py` + `api/archive_views.py`) handles HTTP request/response, delegates to services.
6. **Next.js frontend** fetches API data and renders smart content, rich text, and galleries.

## Important Files

| File | Purpose |
|------|---------|
| `manage.py` | Django entry point — defaults to `backend.settings.dev` |
| `requirements.txt` | Python dependencies |
| `backend/urls.py` | URL routing — Wagtail API + 8 custom endpoints |
| `backend/settings/base.py` | Base settings, env helpers, DB config, logging |
| `researchers/models.py` | Page models and SiteSettings |
| `researchers/blocks.py` | StreamField block definitions |
| `researchers/views.py` | 3 thin views (image, site settings, filtered items) |
| `researchers/api/archive_views.py` | 4 paginated API views + section count |
| `researchers/services/archive_service.py` | Business logic for extracting/filtering StreamField data |
| `researchers/utils/` | Pure utility modules (text, mapping, extractors, sorting, pagination) |
| `researchers/wagtail_hooks.py` | Draftail underline feature |
| `researchers/management/commands/seed_sitesettings.py` | Seeds default SiteSettings |

## Dev Commands

```bash
# Migrations (run after any block/model change)
python manage.py makemigrations
python manage.py migrate

# Check for issues
python manage.py check

# Run tests (43 tests)
python manage.py test researchers.tests

# Shell
python manage.py shell

# Create superuser
python manage.py createsuperuser

# Seed default site settings
python manage.py seed_sitesettings

# Collect static (production)
python manage.py collectstatic --noinput
```

## Production Deployment

```bash
export DJANGO_SETTINGS_MODULE=backend.settings.production
export DJANGO_SECRET_KEY="..."
export DATABASE_URL="mysql://rri_user:rri_password@127.0.0.1:3306/rri_imprint"
export DJANGO_ALLOWED_HOSTS="example.com,www.example.com"

python manage.py migrate --noinput
python manage.py collectstatic --noinput
gunicorn backend.wsgi:application --workers 4 --bind 0.0.0.0:8000 --timeout 120
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| API returns `undefined` for new fields | Run `makemigrations` + `migrate` after any `blocks.py` change |
| Pages missing from API | Ensure pages are **published** in Wagtail admin |
| CORS errors | Check `DJANGO_CORS_ALLOWED_ORIGINS` includes frontend origin |
| Images not loading | Backend must serve `/media/` in dev (handled automatically by `urls.py` when `DEBUG=True`) |

## Related

- [Root AGENTS.md](../AGENTS.md) — Full-stack agent guidelines
- [Frontend README](../frontend/README.md) — Frontend setup and architecture
