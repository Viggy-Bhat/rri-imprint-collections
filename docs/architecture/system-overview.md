# System Architecture Overview

## High-Level Architecture

RRI Imprint Collections follows a **headless CMS** pattern:

```
Wagtail Admin (editors) → Django JSON API → Next.js Frontend (readers)
```

- Editors create and manage structured researcher pages in the Wagtail admin interface.
- The Django backend exposes a JSON API via Wagtail's Pages API and custom endpoints.
- The Next.js frontend fetches API data and renders researcher profile pages.

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend framework | Django | 5.2 |
| CMS | Wagtail | 7.4 |
| Database | MariaDB (primary), SQLite (dev fallback) | 10.6+ |
| Frontend framework | Next.js (App Router) | 16.x |
| UI library | React | 19 |
| Styling | Tailwind CSS | v4 |
| Language | Python (backend), JavaScript (frontend) | — |

## Data Model

### ResearcherPage

The primary content model. Each researcher has:

- **Profile metadata** — birth/death dates, field, profile image
- **Profile items** — label/value pairs displayed in the profile sidebar
- **Bio sections** — titled rich text sections for biography content
- **Sidebar items** — sidebar sections containing smart content and galleries

### ResearcherSectionPage

Child pages of ResearcherPage for standalone section content (e.g., a dedicated publications page).

### SiteSettings

Global settings (institute name, department, address, phone, email) configured via Wagtail Settings.

### StreamField Block Hierarchy

Content is stored as deeply nested StreamField structures:

```
ResearcherPage
├── profile_items[]        → LabelValueBlock
├── bio_sections[]         → BiographySectionBlock (title + rich text)
└── sidebar_items[]        → SidebarItemBlock
    ├── items[]            → SidebarContentItemBlock
    ├── smart_content[]    → PublicationBlock | GuidanceBlock | NewsClippingBlock | StudentSupervisionBlock
    └── gallery[]          → GalleryImageItemBlock
```

## API Communication Flow

1. Frontend requests `GET /api/v2/pages/?type=researchers.ResearcherPage`
2. Wagtail returns page tree with nested StreamField JSON
3. For section pages, frontend requests `GET /api/v2/pages/?type=researchers.ResearcherSectionPage&child_of=<id>`
4. For paginated content, frontend uses custom endpoints:
   - `GET /api/researchers/<slug>/publications/?limit=10&offset=0`
   - `GET /api/researchers/<slug>/guidance/?limit=10&offset=0`
   - `GET /api/researchers/<slug>/news/?limit=10&offset=0`
5. For filtered/searched content: `GET /api/researchers/<slug>/sections/<slug>/filtered-items/?search=&sort=&year=`

## Frontend Rendering Pipeline

1. **Server components** fetch API data using the Wagtail base URL
2. **Normalization layer** extracts and flattens nested StreamField blocks
3. **React components** render smart content, rich text, and galleries
4. **Image URLs** are prefixed with `NEXT_PUBLIC_WAGTAIL_BASE_URL` (Wagtail returns relative paths)

## Dev vs Production

| Aspect | Development | Production |
|--------|------------|------------|
| Settings module | `backend.settings.dev` | `backend.settings.production` |
| Database | SQLite (fallback) | MariaDB via `DATABASE_URL` |
| Debug mode | `DEBUG=True` | `DEBUG=False` |
| Cache backend | LocMem | Redis |
| CORS | localhost:3000 allowed | `DJANGO_CORS_ALLOWED_ORIGINS` required |
| Static files | Django serves directly | `collectstatic` + nginx |
| Media files | Django serves at `/media/` | nginx proxies to backend |
