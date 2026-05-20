# AGENTS.md — RRI Imprint Collections

Compact instructions for AI agents working in this repo. Every line answers: "Would an agent likely miss this without help?"

## Architecture at a Glance

- **Backend**: Django 6 + Wagtail 7.3rc1 CMS, SQLite in dev, PostgreSQL in production. Serves a JSON API and Wagtail admin at `:8000`.
- **Frontend**: Next.js 16.2.3 + React 19, Tailwind CSS v4, JavaScript (not TypeScript). Consumes backend API at `:3000`.
- **Pattern**: Headless CMS — editors create structured researcher pages in Wagtail; Next.js fetches and renders them.

## Backend — Critical Rules

### After ANY StreamField block change, migrate immediately
The worst bug in this repo was caused by updating `blocks.py` without regenerating migrations. The database schema fell out of sync with code, so the API silently returned `undefined` for new fields.

```bash
cd backend
source ../.venv/Scripts/activate  # Windows
python manage.py makemigrations
python manage.py migrate
```

### Dev vs Production Settings
- `manage.py` defaults to `backend.settings.dev`.
- Production requires `DJANGO_SETTINGS_MODULE=backend.settings.production` and enforces `DATABASE_URL`, `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`.
- See `backend/.env.example` for production env vars.

### Custom API Endpoints (not Wagtail's built-in)
- `GET /api/images/<id>/` — returns image file URL (used because Wagtail's v2 API image endpoint needs customization).
- `GET /api/site-settings/` — returns institute name, department, address, phone, email from `SiteSettings`.
- `GET /api/researchers/<slug>/sections/<section_slug>/filtered-items/?search=&sort=&year=` — search/filter/sort publications and guidance items server-side.

### CORS
Dev settings allow `localhost:3000` and `127.0.0.1:3000`. Production requires `DJANGO_CORS_ALLOWED_ORIGINS`.

## Frontend — Critical Rules

### Next.js 16 Breaking Changes
This is Next.js 16 with the App Router. Conventions differ from older versions. Read `node_modules/next/dist/docs/` if unsure. Turbopack is enabled in `next.config.mjs`.

### Language & Extensions
- JavaScript only — `.js` for plain JS, `.jsx` for JSX.
- No TypeScript. Use JSDoc for type hints when helpful.
- Default to Server Components; add `"use client"` only for hooks, browser APIs, or event handlers.

### Path Aliases
Always use `@/` for imports:
```javascript
import { Component } from "@/app/components/Component";
import { cn } from "@/lib/utils";
```

### Styling
- Tailwind CSS v4 with `@tailwindcss/postcss` plugin.
- Use `cn()` from `@/lib/utils` (combines `clsx` + `tailwind-merge`) for class composition.
- Custom academic theme colors in `globals.css`: `#8b1c1c` (red accent), `#f8f6f2` (cream background).
- Background pattern image must exist at `frontend/public/assets/background/rri-pattern.png`.

### Image Handling
Wagtail API returns relative image URLs. The frontend manually prefixes them with `NEXT_PUBLIC_WAGTAIL_BASE_URL` (default `http://127.0.0.1:8000`).

### No Tests
No test framework is configured. Do not add tests unless explicitly requested.

## Data Flow Gotchas

### StreamField Nesting
Wagtail stores StreamField blocks as `{type, value}` objects. Fields are deeply nested:
- `sidebar_items[].value.smart_content[]` — smart content (publications, guidance, news, supervision)
- `sidebar_items[].value.gallery[]` — gallery images
- `bio_sections[].value.content` — rich text HTML

### Rich Text Rendering
Content from Wagtail `RichTextBlock` arrives as HTML strings. Components render it with `dangerouslySetInnerHTML` inside `.rich-text-content` styled containers. This is safe because content is authored in the trusted CMS, not by end users.

### Migration History Lesson
Migration `0015_add_smart_content_gallery_to_sidebar_items.py` was created specifically to fix the schema mismatch where `smart_content` and `gallery` fields were defined in `SidebarItemBlock` but missing from the database. Always verify migrations are generated and applied after block changes.

## Monorepo Boundaries

```
rri-imprint-web-demo/
├── backend/          # Django project root
│   ├── manage.py
│   ├── backend/      # settings, urls, middleware, wsgi
│   ├── researchers/  # main app: models, blocks, views, migrations
│   ├── home/         # Wagtail home page model
│   └── search/       # basic search views
└── frontend/         # Next.js project root
    ├── app/          # App Router pages and components
    ├── components/   # shared UI components
    ├── lib/          # utilities (cn(), etc.)
    └── public/       # static assets
```

Root `package.json` only delegates to `frontend/` (e.g., `npm run dev` → `npm --prefix frontend run dev`). Backend is entirely separate.

## Dev Commands

### Start Backend
```bash
cd backend
source ../.venv/Scripts/activate   # Windows
# source ../.venv/bin/activate     # Linux/Mac
python manage.py migrate
python manage.py runserver
```

### Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### Lint (Frontend only)
```bash
npm run lint
npx eslint app/page.js --fix
```

## Environment Files

- `backend/.env.example` — production Django env vars
- `frontend/.env.example` — `NEXT_PUBLIC_WAGTAIL_BASE_URL`
- Root `.env.example` — consolidated env template for deployment

## Route Structure

- `/` — Home page, lists all researchers
- `/researcher/<slug>` — Researcher profile (bio + sidebar sections)
- `/researcher/<slug>/section/<sectionSlug>` — Section detail (publications, guidance, etc.)
- `/researcher/<slug>/gallery` — Gallery page
- Legacy redirects: `/researcher/<slug>/<section>` → `/researcher/<slug>/section/<section>`

## Wagtail Admin

- URL: `http://localhost:8000/admin/`
- Create researcher pages as children of the Home page
- Pages must be **published** to appear in the API
- Site settings (institute info) are configured via Wagtail Settings → Site Settings
