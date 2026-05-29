# Backend Setup

> **Purpose**: Detailed walkthrough for setting up the Django/Wagtail backend from scratch.
> **Audience**: Backend developers.
> **Prerequisites**: [Getting started](./getting-started.md) for the quick version. Python 3.10+ installed.

---

## 1. Prerequisites

### System Dependencies

```bash
sudo apt update
sudo apt install -y python3 python3-pip python3-venv python3-dev build-essential default-libmysqlclient-dev
```

`default-libmysqlclient-dev` is required to compile the `mysqlclient` Python package. Skip it if you plan to use SQLite only.

### Python Version

The project requires **Python 3.10+** (enforced implicitly by Django 5.2 and Wagtail 7.4). Verify:

```bash
python3 --version
# Expected: Python 3.10.x or later
```

No `.python-version`, `pyproject.toml`, or `setup.py` exists — the version requirement comes from the dependency chain.

---

## 2. Virtual Environment

```bash
python3 -m venv .venv
source .venv/bin/activate     # Linux/Mac/WSL
# .venv\Scripts\activate      # Windows PowerShell
```

**Verification**: Your prompt shows `(.venv)`. Confirm Python path:

```bash
which python
# Expected: /path/to/rri-imprint-web-demo/.venv/bin/python
```

---

## 3. Dependencies

```bash
pip install -r backend/requirements.txt
```

This installs **43 pinned packages** including:

| Package | Version | Purpose |
|---------|---------|---------|
| Django | 5.2.14 | Web framework |
| Wagtail | 7.4 | CMS |
| mysqlclient | 2.2.7 | MariaDB driver |
| gunicorn | 22.0.0 | WSGI server (production) |
| redis | 5.3.1 | Cache backend (optional) |
| djangorestframework | 3.17.1 | REST framework (Wagtail dependency) |
| django-cors-headers | 4.9.0 | CORS middleware |
| python-dotenv | 1.2.2 | `.env` file loading |
| dj-database-url | 2.3.0 | DATABASE_URL parser |
| pillow | 11.3.0 | Image handling |

All packages use exact (`==`) pinning — reproducible builds are guaranteed.

**Verification**:
```bash
pip freeze | grep -E "Django==|wagtail==|mysqlclient=="
# Expected:
# Django==5.2.14
# mysqlclient==2.2.7
# wagtail==7.4
```

### Common Install Failures

| Error | Cause | Fix |
|-------|-------|-----|
| `fatal error: mysql.h: No such file or directory` | Missing MariaDB headers | `sudo apt install default-libmysqlclient-dev` |
| `fatal error: Python.h: No such file or directory` | Missing Python dev headers | `sudo apt install python3-dev` |
| `error: command 'gcc' failed` | Missing build tools | `sudo apt install build-essential` |

---

## 4. Project Structure

The backend Django project lives under `backend/`:

```
backend/
├── manage.py              # Django CLI entry point
├── requirements.txt        # 43 pinned dependencies
├── .env.example            # Production env template
├── backend/                # Django project package
│   ├── settings/           # Settings hierarchy
│   │   ├── base.py         # Shared settings (318 lines)
│   │   ├── dev.py          # Development overrides (43 lines)
│   │   └── production.py   # Production overrides (56 lines)
│   ├── urls.py             # URL routing
│   ├── wsgi.py             # WSGI entry point (production)
│   └── middleware.py       # ApiSecurityHeadersMiddleware
├── researchers/            # Main application
│   ├── models.py           # ResearcherPage, ResearcherSectionPage, SiteSettings
│   ├── blocks.py           # StreamField block definitions
│   ├── views.py            # Custom API views
│   ├── api/                # Archive API views
│   ├── services/           # Business logic
│   ├── utils/              # Utilities (pagination, sorting, text)
│   └── migrations/         # Database migrations (0001_initial.py only)
├── home/                   # Wagtail home page app
└── search/                 # Basic search views
```

**Key files**:
- `backend/settings/base.py` — Django settings, database config, cache, logging
- `backend/settings/dev.py` — Development overrides (DEBUG=True, console email, localhost origins)
- `backend/settings/production.py` — Security hardening (HSTS, SSL redirects, API security headers)
- `manage.py` — Defaults to `backend.settings.dev`

---

## 5. Database Configuration

### Option A: SQLite (Zero Configuration — Default)

No configuration needed. Django uses `backend/db.sqlite3` automatically when `DATABASE_URL` is unset.

### Option B: MariaDB

See [database-setup.md](./database-setup.md) for complete MariaDB setup.

Quick version:

```bash
sudo apt install -y mariadb-server
sudo mysql_secure_installation
sudo mysql -e "CREATE DATABASE rri_imprint CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'rri_user'@'localhost' IDENTIFIED BY 'rri_password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON rri_imprint.* TO 'rri_user'@'localhost'; FLUSH PRIVILEGES;"
```

Create `backend/.env`:
```
DATABASE_URL=mysql://rri_user:rri_password@127.0.0.1:3306/rri_imprint
```

---

## 6. Environment Variables

Backend settings read variables from two sources:
1. A `.env` file in the project root (loaded by `python-dotenv` in `base.py`)
2. System environment variables (override `.env`)

**In development**: Only `DATABASE_URL` and `DJANGO_SECRET_KEY` are typically needed. All other variables have safe defaults.

See [environment-variables.md](./environment-variables.md) for the complete 28-variable reference.

---

## 7. Running Migrations

```bash
cd backend
source ../.venv/bin/activate
python manage.py migrate
```

**Expected output** (first run):
```
Operations to perform:
  Apply all migrations: admin, auth, contenttypes, home, researchers, sessions, taggit, wagtailadmin, wagtailcore, wagtaildocs, wagtailembeds, wagtailimages, wagtailredirects, wagtailsearch, wagtailusers
Running migrations:
  Applying contenttypes.0001_initial... OK
  ... (30+ migrations)
  Applying researchers.0001_initial... OK
```

**Verification**:
```bash
python manage.py showmigrations researchers
# Expected: [X] 0001_initial
```

---

## 8. Seed Initial Data

```bash
python manage.py seed_sitesettings
```

**Expected output**:
```
SiteSettings seeded successfully
```

This command creates default `SiteSettings` with RRI Library information:
- Institute name: "RAMAN RESEARCH INSTITUTE"
- Department: "LIBRARY"
- Address: "C. V. Raman Avenue, Bangalore - 560080, India"
- Phone: "(080) 23610122"
- Email: "library@rri.res.in"

The command is idempotent — running it again produces `SiteSettings already exist; no changes made`.

**If you see "No Wagtail Site found"**: A Wagtail Site object must exist first. Create a Home page in Wagtail admin, then re-run the command.

---

## 9. Create Superuser

```bash
python manage.py createsuperuser
```

Follow the interactive prompts. This account is used to log in at `http://127.0.0.1:8000/admin/`.

---

## 10. Start the Development Server

```bash
python manage.py runserver
```

**Expected output**:
```
Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced).
May 29, 2026 - 12:00:00
Django version 5.2.14, using settings 'backend.settings.dev'
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

**Access**:
- Wagtail admin: `http://127.0.0.1:8000/admin/`
- Django admin: `http://127.0.0.1:8000/django-admin/`
- API: `http://127.0.0.1:8000/api/v2/pages/`

---

## 11. Verification Checklist

- [ ] `pip freeze | grep Django` shows `Django==5.2.14`
- [ ] `python manage.py check` reports no issues
- [ ] `python manage.py showmigrations researchers` shows `[X] 0001_initial`
- [ ] `python manage.py seed_sitesettings` succeeds
- [ ] `http://127.0.0.1:8000/admin/` loads Wagtail admin
- [ ] `http://127.0.0.1:8000/api/v2/pages/` returns JSON (may be `{"meta": ..., "items": []}` initially)
- [ ] `http://127.0.0.1:8000/api/site-settings/` returns institute settings

---

## 12. Recovery Procedures

### Dependencies Corrupted
```bash
pip uninstall -y -r backend/requirements.txt
pip install -r backend/requirements.txt
```

### Database Corrupted (SQLite)
```bash
rm backend/db.sqlite3
python manage.py migrate
python manage.py seed_sitesettings
python manage.py createsuperuser
```

### Database Corrupted (MariaDB)
```bash
mysql -u root -p -e "DROP DATABASE rri_imprint; CREATE DATABASE rri_imprint CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
python manage.py migrate
python manage.py loaddata ../backups/clean_data.json
python manage.py seed_sitesettings
```

Note: `clean_data.json` is gitignored — it only exists if you previously exported it.

### Migration Conflicts
```bash
# Show state
python manage.py showmigrations researchers

# Fake-apply to sync:
python manage.py migrate researchers --fake
```

---

## 13. Related Documentation

- **[environment-variables.md](./environment-variables.md)** — Complete variable reference
- **[database-setup.md](./database-setup.md)** — MariaDB installation and configuration
- **[migrations/sqlite-to-mariadb.md](../migrations/sqlite-to-mariadb.md)** — Migration guide and recovery
- **[migrations/best-practices.md](../migrations/best-practices.md)** — Migration workflow
- **[backend/project-structure.md](../backend/project-structure.md)** — Full project layout
- **[backend/models.md](../backend/models.md)** — Data model reference
