# RRI Imprint Collections

A full-stack web platform for publishing researcher profile pages and structured scholarly content. Built as a headless CMS — editors create and manage content in [Wagtail](https://wagtail.org), and a [Next.js](https://nextjs.org) frontend renders it via a REST API.

---

## Features

- Researcher profiles with biography sections, publication lists, and archival records
- Wagtail CMS for structured content authoring (StreamField-driven data model)
- Smart content blocks: publications, research guidance, news clippings, student supervision, image galleries
- Rich text formatting with typography styled for academic presentation
- REST API for all content — consumed by the Next.js frontend
- Responsive frontend with archive-appropriate visual design

---

## Architecture

```
Next.js Frontend  (React 19, Tailwind CSS v4)
        |
    REST API  (JSON over HTTP)
        |
Django + Wagtail CMS  (backend)
        |
  Database  —  SQLite (dev)  /  MariaDB (recommended)
```

Content flow: editors author structured pages in Wagtail admin → content is stored as StreamField JSON → Wagtail API exposes it → Next.js fetches and renders it on the frontend.

---

## Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Backend framework** | Django | 5.2.14 |
| **CMS** | Wagtail | 7.4 |
| **Database (dev)** | SQLite | — |
| **Database (production)** | MariaDB | 10.6+ |
| **WSGI server** | Gunicorn | 22.0.0 |
| **Frontend framework** | Next.js (App Router) | 16.2.3 |
| **UI library** | React | 19.2.4 |
| **CSS framework** | Tailwind CSS | v4 |
| **Cache (optional)** | Redis | 5.3.1 |

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18.18+
- npm 9+

### 1. Clone

```bash
git clone https://github.com/Viggy-Bhat/rri-imprint-collections.git
cd rri-imprint-collections
```

### 2. Backend

```bash
python3 -m venv .venv
source .venv/bin/activate           # Linux/Mac/WSL
# .venv\Scripts\activate            # Windows

pip install -r backend/requirements.txt
cd backend
python manage.py migrate
python manage.py seed_sitesettings
python manage.py createsuperuser
python manage.py runserver
```

**Backend runs at** `http://127.0.0.1:8000`  
**Wagtail admin at** `http://127.0.0.1:8000/admin/`

### 3. Frontend

Open a **new terminal** and run:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

**Frontend runs at** `http://localhost:3000`

### 4. Verify

- [ ] `http://127.0.0.1:8000/admin/` — Wagtail admin login page
- [ ] `http://127.0.0.1:8000/api/v2/pages/` — JSON API response
- [ ] `http://localhost:3000` — Home page with "From the Archives..." heading

### 5. Create Content

1. Log in to Wagtail admin at `http://127.0.0.1:8000/admin/`
2. Go to Pages → Home → Add child page → **Researcher Page**
3. Fill in fields and **Publish** the page
4. Refresh the frontend — published pages appear on the home page

**For a detailed walkthrough, see [docs/setup/getting-started.md](docs/setup/getting-started.md).**

---

## Environment Configuration

### Backend (`backend/.env`)

Copy the example file:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` to set at minimum:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MariaDB connection string (omit for SQLite) |
| `DJANGO_SECRET_KEY` | Cryptographic signing key |

### Frontend (`frontend/.env.local`)

```bash
cp frontend/.env.example frontend/.env.local
```

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_WAGTAIL_BASE_URL` | `http://127.0.0.1:8000` | Backend API base URL |

**Full reference**: [docs/setup/environment-variables.md](docs/setup/environment-variables.md)

---

## Database Options

### SQLite (Default — Zero Configuration)

When `DATABASE_URL` is unset, Django uses SQLite at `backend/db.sqlite3`. No setup required — ideal for quick-start and single-developer workflows.

### MariaDB (Recommended for Teams)

Install MariaDB, create a database and user, then set `DATABASE_URL` in `backend/.env`:

```
DATABASE_URL=mysql://rri_user:rri_password@127.0.0.1:3306/rri_imprint
```

Then run migrations:

```bash
cd backend && python manage.py migrate
```

**Detailed guide**: [docs/setup/database-setup.md](docs/setup/database-setup.md)

---

## Documentation

All documentation is in the `docs/` directory:

| Directory | Contents |
|-----------|----------|
| [docs/setup/](docs/setup/) | Installation, environment variables, database setup, getting started |
| [docs/architecture/](docs/architecture/) | System design, data flow, caching, pagination, architecture decisions |
| [docs/api/](docs/api/) | Complete API endpoint reference |
| [docs/migrations/](docs/migrations/) | SQLite-to-MariaDB guide, migration workflow, StreamField bug post-mortem |
| [docs/runtime/](docs/runtime/) | Daily operations, cache management, logging, backup and restore |
| [docs/backend/](docs/backend/) | Settings architecture, models, middleware, security, services |
| [docs/frontend/](docs/frontend/) | Component architecture, API integration, rendering flow, styling |
| [docs/archive/](docs/archive/) | Historical investigation notes (for reference only) |

**Navigation**: Start with the [Documentation Hub](docs/README.md).

---

## Repository Structure

```
rri-imprint-web-demo/
├── backend/                 # Django project
│   ├── backend/             #   Settings, URLs, middleware
│   │   └── settings/        #     base.py → dev.py / production.py
│   └── researchers/         #   Main app: models, blocks, views, API, migrations
├── frontend/                # Next.js project (App Router)
│   ├── app/                 #   Pages, layouts, API utilities
│   └── components/          #   React components (25 files across 7 domains)
├── docs/                    # Documentation (see above)
├── backups/                 # Database dumps and fixtures (gitignored)
└── .env.example             # Environment variable template (root)
```

---

## Important Notes

- **SQLite is supported for development only.** For team environments and production, use MariaDB.
- **Backup files in `backups/` are local artifacts and not committed to Git.** You must create your own backups. See [docs/runtime/backup-and-restore.md](docs/runtime/backup-and-restore.md).
- **Pages must be published in Wagtail to appear in the API.** Unpublished drafts are invisible to the frontend.
- **The background pattern image** at `frontend/public/assets/background/rri-pattern.png` must exist for the full visual theme. The site degrades gracefully if it's missing.
- **See [AGENTS.md](AGENTS.md)** for critical development rules — especially the StreamField migration discipline.
- **Deployment documentation** (nginx, systemd, SSL) is forthcoming. See the [Documentation Hub](docs/README.md) for current coverage.

---

## Contributing

1. Read [AGENTS.md](AGENTS.md) for project conventions and critical rules.
2. Read [docs/README.md](docs/README.md) for the documentation index.
3. Follow the [setup guide](docs/setup/getting-started.md) to get running.
4. Use `npm run lint` for frontend code quality — no test framework is currently configured.
5. After any change to `blocks.py` or `models.py`, run `makemigrations` + `migrate` immediately.
