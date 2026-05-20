# RRI Imprint Collections — Project Structure

## Overview

Headless CMS monorepo: **Django 6 + Wagtail 7.3rc1** backend (JSON API + admin at `:8000`) and **Next.js 16.2.3 + React 19** frontend (at `:3000`). Editors create structured researcher pages in Wagtail; Next.js fetches and renders them. JavaScript only (no TypeScript, except two files). Tailwind CSS v4.

```
rri-imprint-web-demo/
├── .env.example          # Consolidated production env template
├── .gitignore            # Python, Node, Next.js, env, editor ignores
├── AGENTS.md             # AI agent instructions for this repo
├── README.md             # Full project documentation + deployment guide
├── package.json          # Thin delegator → npm --prefix frontend
├── pages.json            # Stale artifact (API error response)
├── backend/              # Django + Wagtail project root
└── frontend/             # Next.js project root
```

---

## Root Directory

| File | Purpose |
|---|---|
| `package.json` | Delegates `dev`/`build`/`start`/`lint` to `frontend/` via `npm --prefix frontend` |
| `.env.example` | Consolidated env vars: `DJANGO_SETTINGS_MODULE`, `DATABASE_URL`, `REDIS_URL`, `NEXT_PUBLIC_WAGTAIL_BASE_URL`, etc. |
| `.gitignore` | Excludes `__pycache__`, `node_modules`, `.next/`, `.env` (except `.env.example`), `.DS_Store`, `.idea/`, `.vscode/` |
| `AGENTS.md` | 141-line AI agent handbook: architecture, migration rules, data flow gotchas, dev commands |
| `README.md` | 284-line consolidated docs: completed work, architecture, local dev, deployment with nginx + certbot |
| `pages.json` | Stale artifact `{"message": "limit cannot be higher than 20"}` — no functional role |

---

## Backend — `backend/`

### Root Backend Files

| File | Purpose |
|---|---|
| `manage.py` | Django CLI entry point. Default: `DJANGO_SETTINGS_MODULE=backend.settings.dev` |
| `requirements.txt` | Deps: Django 5.2.14, wagtail 6.3.5, django-cors-headers, mysqlclient, gunicorn, redis, Pillow |
| `requirements_before_downgrade.txt` | Historical snapshot before Wagtail 7.3rc1 → 6.3.5 downgrade |
| `.env` | Active env: `DATABASE_URL=mysql://...` (local MariaDB) |
| `.env.example` | Backend-specific production env template |
| `data.json` / `clean_data.json` | Wagtail/Django fixture exports |
| `before_wagtail_downgrade.sql` | MariaDB dump before Wagtail version downgrade |
| `db.sqlite3` | Dev SQLite database (but `.env` points to MariaDB) |
| `.dockerignore` | Excludes `media/`, `static/`, `__pycache__`, `.venv/` from Docker build |

### `backend/backend/` — Django Project Config Package

| File | Purpose |
|---|---|
| `__init__.py` | Package marker |
| `settings/__init__.py` | Package marker |
| `settings/base.py` | **Shared settings (311 lines):** loads `.env`, defines 24 installed apps (Django core + Wagtail suite + corsheaders + django_filters + local apps), middleware stack, DB (SQLite or MariaDB via `DATABASE_URL`), Redis cache, structured JSON logging, Wagtail config, security settings, i18n |
| `settings/dev.py` | **Dev overrides:** `DEBUG=True`, default SECRET_KEY, `ALLOWED_HOSTS=[localhost, 127.0.0.1]`, CORS for `localhost:3000`, console email backend, optional `from .local import *` |
| `settings/production.py` | **Production overrides:** `DEBUG=False`, enforces `DJANGO_SECRET_KEY` + `DATABASE_URL` + `DJANGO_ALLOWED_HOSTS`, SSL/HSTS hardening, manifest static files, `ApiSecurityHeadersMiddleware`, optional `from .local import *` |
| `urls.py` | **Root URL config (44 lines):** routes for Wagtail v2 API (`api/v2/`), custom endpoints (`api/images/<id>/`, `api/site-settings/`, `api/researchers/.../filtered-items/`), Django admin (`django-admin/`), Wagtail admin (`admin/`), documents, search, and catch-all Wagtail pages |
| `wsgi.py` | WSGI app for Gunicorn. Defaults to `production` settings via env var |
| `middleware.py` | `ApiSecurityHeadersMiddleware` — sets strict CSP/Referrer/ X-Frame headers only on `/api/` paths. Used in production only |
| `static/css/backend.css` | Empty placeholder for global styles |
| `static/js/backend.js` | Empty placeholder for global JS |
| `templates/base.html` | Base HTML template: Wagtail user bar, SEO meta, CSS/JS blocks, live preview |
| `templates/404.html` | 404 error page (extends `base.html`) |
| `templates/500.html` | 500 error page (standalone minimal HTML) |

### `backend/home/` — Home App

| File | Purpose |
|---|---|
| `apps.py` | App config: `name = "home"` |
| `models.py` | `HomePage(Page)` — Wagtail root page model, no custom fields beyond `title`, `slug` |
| `tests.py` | `WagtailPageTestCase` — verifies root page creation and homepage rendering |
| `migrations/0001_initial.py` | Creates `HomePage` as child of `wagtailcore.Page` |
| `migrations/0002_create_homepage.py` | Data migration: creates actual homepage + Site instance at `localhost` |
| `templates/home/home_page.html` | Homepage template (extends `base.html`, includes welcome page) |
| `templates/home/welcome_page.html` | Wagtail welcome screen (52 lines, standard boilerplate) |
| `static/css/welcome_page.css` | Wagtail welcome page styling (184 lines) |

### `backend/researchers/` — Main App (Researcher Content)

| File | Purpose |
|---|---|
| `apps.py` | App config: `name = 'researchers'` |
| `admin.py` | Empty — models registered via Wagtail admin, not Django admin |
| `models.py` | **Core models (162 lines):** `ResearcherPage(Page)` with birth/death dates, field, profile_image, StreamFields for profile_items, sidebar_items, bio_sections. `ResearcherSectionPage(Page)` child page with subtitle + smart_content StreamField. `SiteSettings(BaseSiteSetting)` with institute_name, department, address, phone, email |
| `blocks.py` | **All StreamField block types (220 lines):** `SectionBlock`, `SectionItemBlock`, `BiographySectionBlock`, `SidebarContentItemBlock`, `SidebarItemBlock` (items + smart_content + gallery), `PublicationBlock`, `GuidanceBlock`, `NewsClippingBlock`, `StudentSupervisionBlock`, `GalleryBlock`, `GalleryImageItemBlock` (with legacy data migration shim). Compatibility shims: `RenditionImageChooserBlock`, `TextBlock` |
| `blocks.py.save` | Backup of blocks.py before recent edit (has syntax error) |
| `views.py` | **Custom API views (394 lines):** `researcher_section_filtered_items()` — server-side search/filter/sort for publications/guidance. `image_detail()` — returns image file URL. `site_settings_detail()` — returns institute info. Includes utility functions: `to_plain_text()`, `to_section_slug()`, `get_author()`, `get_journal()`, `get_year()`, `sort_results()`, `build_items_from_blocks()`, `build_section_items()`, `filter_items()`. All GET endpoints cached 300s |
| `wagtail_hooks.py` | Registers "underline" rich text feature in Wagtail's Draftail editor |
| `tests.py` | Unit tests for `filter_items()` and the filtered-items endpoint |
| `management/commands/seed_sitesettings.py` | `python manage.py seed_sitesettings` — seeds default Raman Research Institute site settings |
| `templates/researchers/researcherpage.html` | Server-rendered fallback template for ResearcherPage (76 lines, inline CSS). Used for Wagtail preview |
| `migrations/0001_initial.py` | Squashed initial migration: creates ResearcherPage, ResearcherSectionPage, SiteSettings with full block_lookup definitions |

### `backend/search/` — Search App

| File | Purpose |
|---|---|
| `views.py` | Basic Wagtail search: GET `?query=&page=`, paginated (10/page), renders `search/search.html` |
| `templates/search/search.html` | Search results template with form + paginated listing |

### `backend/media/` — Uploaded Images

| Path | Purpose |
|---|---|
| `original_images/` (18 files) | Original uploaded images (JPG, PNG) for researcher profiles and gallery |
| `images/` | Wagtail-generated renditions (thumbnails at max-165x165, max-800x600, max-900x900, fill-800x600) |

### `backend/media_backup/` — Media Backup

| Path | Purpose |
|---|---|
| `original_images/` | Same 18 original images (backup copy) |
| `images/` | Same rendition set (backup copy) |

### `backend/static/` — Collected Static Files

Collected from Django admin, Wagtail admin, Wagtail images/docs/embeds/snippets. Production-ready compiled assets.

---

## Frontend — `frontend/`

### Config Files

| File | Purpose |
|---|---|
| `package.json` | Next.js 16.2.3, React 19.2.4, Tailwind CSS v4, embla-carousel-react, clsx, tailwind-merge. Dev: ESLint, TypeScript @types |
| `next.config.mjs` | Turbopack enabled. Image remotePatterns for `127.0.0.1:8000` and `localhost:8000` `/media/**` |
| `postcss.config.mjs` | `@tailwindcss/postcss` plugin |
| `eslint.config.mjs` | Flat config: `eslint-config-next/core-web-vitals`, ignores `.next/`, `out/`, `build/` |
| `jsconfig.json` | Path alias: `@/*` → `./*` |
| `tsconfig.json` | For IDE support only (project uses JS). `strict: false`, `jsx: react-jsx` |
| `components.json` | shadcn/ui config: `rsc: true`, `tsx: false`, `style: default`, `baseColor: neutral` |
| `.env.example` | `NEXT_PUBLIC_WAGTAIL_BASE_URL=http://127.0.0.1:8000` |
| `next-env.d.ts` | Auto-generated Next.js TypeScript declarations |

### `frontend/lib/` — Root-Level Utilities

| File | Purpose |
|---|---|
| `utils.js` | `cn()` — merges `clsx` + `tailwind-merge` for class composition. Used throughout |

### `frontend/public/` — Static Assets

| File | Purpose |
|---|---|
| `assets/background/rri-pattern.png` | Repeating background pattern referenced in `globals.css`. **Must exist for correct rendering** |
| `assets/background/RRI-Logo-Colour.png` | RRI logo displayed in Footer component |

### `frontend/styles/` — Stylesheets

| File | Purpose |
|---|---|
| `styles/smart-content.css` | Legacy styling for smart content (publications/guidance blocks via `SmartContentRenderer`). Imported in root `layout.js` |

### `frontend/app/` — Next.js App Router Pages

#### Root Layout & Home

| File | Route | Type | Purpose |
|---|---|---|---|
| `layout.js` | `/` (root) | Server (async) | Wraps all pages: `<SiteHeader>`, `<PageBreadcrumb>`, `<Footer>`. Fetches siteSettings with ISR (300s revalidation). Metadata: "Imprints Collection" |
| `globals.css` | — | CSS (390 lines) | Tailwind v4 import, Google Fonts (Playfair Display + Libre Baskerville), CSS variables (`--accent: #8b1f1f`, `--background: #f8f6f2`), `.rich-text-content`, `.bio-section-content`, `.cms-content`, `.skeleton` shimmer animations, `.card-academic`, `.btn-primary`, `.gallery-grid`, `.badge-primary`, `.profile-summary-card` |
| `page.js` | `/` | Server (async) | Home page: fetches all researcher pages, filters for `ResearcherPage` type, sorts alphabetically. Renders header + `<ResearcherSearchList>` |
| `loading.js` | `/` | Server | Skeleton loading UI: shimmer placeholders for title, search bar, 8 grid items |
| `favicon.ico` | — | — | Browser tab icon |

#### `app/lib/` — Application Utilities

| File | Purpose |
|---|---|
| `config.js` | `getWagtailBackendBaseUrl()` (from env var, default `http://127.0.0.1:8000`), `getWagtailPagesApiUrl()` |
| `wagtailApi.js` | `fetchImageDetails(id)` — fetches single image from `/api/images/<id>/`, resolves relative URLs. `fetchImageDetailsBatch(ids)` — batch variant |
| `siteSettingsApi.js` | `getSiteSettings()` — fetches `/api/site-settings/` with ISR revalidation 300s. Falls back to empty strings on error |
| `formatDate.js` | `formatIndianDate()` — formats date in `en-IN` locale. `formatIndianDateRange()` — birth/death date range with en-dash |

#### `app/components/` — Page-Level Components

| File | Type | Purpose |
|---|---|---|
| `ResearcherSearchList.jsx` | Client (`"use client"`) | Searchable researcher list on home page. Memoized case-insensitive filter. Shows "Showing X of Y Profiles". Links to `/researcher/[slug]` |
| `ProfileCard.jsx` | Server | Sticky sidebar card: profile image (`<ProtectedImage>`), name, definition list of profile items (field, dates, etc.) |
| `BiographySections.jsx` | Server | Renders bio sections from StreamField: header with red divider, HTML content via `dangerouslySetInnerHTML` with `.bio-section-content.cms-content.rich-text-content` |
| `SidebarNavigation.jsx` | Client (`"use client"`) | Desktop sidebar nav: links to section pages (`/researcher/[slug]/section/[sectionSlug]`) and gallery. Active state with red border. Uses shadcn `<Card>` |
| `PageBreadcrumb.jsx` | Client (`"use client"`) | Breadcrumb trail: Home → researcher name → section name. Hides on `/`. Uses `usePathname()` |
| `ContentUnavailable.jsx` | Server | Error fallback: "Content unavailable" message + "Back to Researchers" link |
| `FilterableArchiveSection.jsx` | Client (`"use client"`) | Search/filter/sort UI for publication/guidance sections. Supports local filtering + server-side fallback to `/api/researchers/.../filtered-items/`. Renders `<ArchiveFilterPanel>` + `<SidebarItemCard>` list |
| `SidebarContentPage.jsx` | Server | Generic section list page: title, subtitle, iterates over items rendering `<SidebarItemCard>` |
| `SidebarItemCard.jsx` | Server | Individual item card: external link (if present), title, italic tag, meta_text, rich HTML description |
| `Footer.jsx` | Client (`"use client"`) | Site footer: "Library / Raman Research Institute" branding with RRI logo |
| `Footer.js` | — | Re-exports `Footer` from `Footer.jsx` |
| `Breadcrumb.js` | Client (`"use client"`) | Older breadcrumb variant (not actively used in layout) |

#### `app/components/blocks/` — StreamField Block Renderers

| File | Type | Purpose |
|---|---|---|
| `BioBlock.jsx` | Server | Renders rich text bio block: wraps HTML in `.cms-content.rich-text-content` with `dangerouslySetInnerHTML` |
| `PublicationBlock.jsx` | Server | Publication card: title, journal, year, "Read Publication" external link button |
| `GuidanceBlock.jsx` | Server | Guidance card: student name, thesis title, HTML description, external link |
| `CustomFieldBlock.jsx` | Server | Label/value pair: gray card with bold label + value in flex row |

#### `app/components/media/`

| File | Type | Purpose |
|---|---|---|
| `ProtectedImage.jsx` | Client (`"use client"`) | Image wrapper: prevents right-click (`onContextMenu`), drag (`draggable=false`), selection. Adds invisible overlay div |

#### `app/components/researcher/`

| File | Type | Purpose |
|---|---|---|
| `ResearcherPageLayout.jsx` | Server | Two-column (desktop) / single-column (mobile) layout. Desktop: optional 3-column grid (SidebarNavigation + content + ProfileCard). Mobile: hamburger drawer with configurable content ordering |

#### Researcher Routes

| File | Route | Type | Purpose |
|---|---|---|---|
| `researcher/[slug]/researcherApi.js` | — | Server (435 lines) | **Largest utility file.** `getResearcherPageBySlugResult()`, `getSidebarItems()`, `getBiographySections()`, `getProfileItems()`, `getResearcherProfileImageUrl()`, `getResearcherGalleryImages()`, `getSidebarItemsFromSectionPages()`, `getResearcherSectionPageBySlug()` |
| `researcher/[slug]/page.js` | `/researcher/[slug]` | Server (async) | Researcher profile: fetches researcher data, resolves image, formats dates, renders `<ResearcherPageLayout>` with `<BiographySections>` and sidebar/profile card |
| `researcher/[slug]/loading.js` | `/researcher/[slug]` | Server | Skeleton loading: sidebar (5 items), header, 3 bio cards, profile card shimmer |
| `researcher/[slug]/section/[sectionSlug]/page.js` | `/researcher/[slug]/section/[sectionSlug]` | Server (async) | Section detail page. Three rendering modes: (1) **filter panel** for publications/guidance → `<FilterableArchiveSection>`, (2) **smart content** → `<SmartContentRenderer>`, (3) **simple list** → `<SidebarContentPage>`. Hides profile card on pub/guidance sections |
| `researcher/[slug]/gallery/page.js` | `/researcher/[slug]/gallery` | Server (uses `use()`) | Redirects to `/researchers/[slug]/gallery` |
| `researcher/[slug]/[section]/page.js` | `/researcher/[slug]/[section]` | Server (uses `use()`) | Legacy redirect to `/researcher/[slug]/section/[section]` |
| `researcher/[slug]/[section]/loading.js` | — | — | Re-exports loading from parent |
| `researcher/[slug]/publications/page.js` | `/researcher/[slug]/publications` | Server (uses `use()`) | Redirects to `/researcher/[slug]/section/publications` |
| `researcher/[slug]/guidance/page.js` | `/researcher/[slug]/guidance` | Server (uses `use()`) | Redirects to `/researcher/[slug]/section/guidance` |

#### Alternative Routes

| File | Route | Type | Purpose |
|---|---|---|---|
| `researchers/[slug]/gallery/page.tsx` | `/researchers/[slug]/gallery` | Server (async) | Full gallery page: fetches researcher + gallery images, renders `<ResearcherGalleryViewer>`. **Only `.tsx` file in the project** |

### `frontend/components/` — Shared/Global Components

| File | Type | Purpose |
|---|---|---|
| `SiteHeader.tsx` | Client (`"use client"`) | Site-wide header. Home page: full hero with title + "IMPRINTS COLLECTION" badge. Researcher pages: compact header. Gallery pages: hidden. Uses CSS module |
| `SiteHeader.module.css` | CSS Module | Header styling: hero section, title, badge with double-border, responsive breakpoints |
| `SmartContentRenderer.jsx` | Server | Renders smart content blocks: `publication`, `guidance`, `news`, `supervision`, `gallery` (with link to `/researchers/[slug]/gallery`). Unknown types return null |
| `ArchiveFilterPanel.jsx` | Client (`"use client"`) | Filter panel: search input, sort dropdown (7 options), year input. Mobile toggle button. Apply/Reset buttons. Academic color scheme |
| `FilterPanel.jsx` | Client (`"use client"`) | Alternative filter: search + sort + from/to year range. Shows count. Not currently imported by any active page |
| `MobileSectionsSidebar.jsx` | Client (`"use client"`) | Mobile hamburger drawer: red circle button, slide-in sidebar with overlay, links to sections/gallery |

#### `components/gallery/`

| File | Type | Purpose |
|---|---|---|
| `ResearcherGalleryViewer.jsx` | Client (`"use client"`) | Full gallery: main image display, scrollable thumbnail strip (horizontal mobile, vertical grid desktop), active thumbnail with red ring, caption overlay, click opens lightbox |
| `GalleryCarousel.tsx` | Client (`"use client"`) | Full-screen modal carousel: keyboard navigation (arrows + Escape), touch/swipe support, image counter, prev/next buttons, "About this Image" side panel |

#### `components/ui/` — shadcn/ui Primitives

| File | Type | Purpose |
|---|---|---|
| `card.jsx` | Server | `<Card>`, `<CardHeader>`, `<CardContent>`, `<CardFooter>` — white bg, rounded corners, shadow |
| `badge.jsx` | Server | `<Badge>` — `default` (red), `secondary` (gray), `outline` variants |
| `button.jsx` | Server | `<Button>` — `default` (red), `secondary`, `outline` variants; `sm`, `md`, `lg` sizes |
| `carousel.jsx` | Client (`"use client"`) | Full image carousel: autoplay (default 5000ms), thumbnails, fullscreen mode, dot indicators, keyboard nav. Not currently used in active pages |
| `dialog.jsx` | Client (`"use client"`) | Modal dialog: overlay + centered white card. Not currently used in active pages |
| `separator.jsx` | Server | Horizontal or vertical divider line via Tailwind |

---

## Key Relationships & Data Flow

### Model Hierarchy
```
Page (Wagtail)
├── HomePage                    [home/models.py] — Root page, no custom fields
├── ResearcherPage              [researchers/models.py] — Main profile page
│   └── ResearcherSectionPage   [researchers/models.py] — Child section detail pages
```

### Settings Hierarchy
```
base.py (shared: DB, cache, logging, middleware, Wagtail config)
├── dev.py (DEBUG, localhost CORS, console email)
└── production.py (DEBUG=False, SSL/HSTS, enforces secrets)
```

### API Endpoints
| Endpoint | Handler | Purpose |
|---|---|---|
| `GET /api/v2/pages/` | Wagtail PagesAPIViewSet | All published pages |
| `GET /api/images/<id>/` | `researchers.views.image_detail` | Image file URL |
| `GET /api/site-settings/` | `researchers.views.site_settings_detail` | Institute name, address, phone, email |
| `GET /api/researchers/<slug>/sections/<slug>/filtered-items/` | `researchers.views.researcher_section_filtered_items` | Search/filter/sort publications/guidance |
| `GET /django-admin/` | Django admin | Django admin interface |
| `GET /admin/` | Wagtail admin | Wagtail CMS admin |
| `GET /search/` | `search.views.search` | Wagtail page search |

### StreamField Block Composition
```
SidebarItemBlock
├── title, subtitle, slug
├── items: [SidebarContentItemBlock]        # Simple list items
└── smart_content: StreamBlock
    ├── PublicationBlock                    # title, journal, year, link
    ├── GuidanceBlock                       # student_name, thesis_title, year, link
    ├── NewsClippingBlock                   # headline, source, date, link
    ├── StudentSupervisionBlock             # student, topic, year
    └── GalleryBlock
        └── images: [GalleryImageItemBlock] # image (ImageChooser), caption, about_image
```

### Frontend Route Map
| Route | File | Purpose |
|---|---|---|
| `/` | `app/page.js` | Home — list all researchers |
| `/researcher/[slug]` | `app/researcher/[slug]/page.js` | Researcher profile (bio + sidebar) |
| `/researcher/[slug]/section/[sectionSlug]` | `app/researcher/[slug]/section/[sectionSlug]/page.js` | Section detail (publications, guidance, etc.) |
| `/researcher/[slug]/gallery` | `app/researcher/[slug]/gallery/page.js` | Redirect → `/researchers/[slug]/gallery` |
| `/researcher/[slug]/[section]` | `app/researcher/[slug]/[section]/page.js` | Legacy redirect → `/researcher/[slug]/section/[section]` |
| `/researcher/[slug]/publications` | `app/researcher/[slug]/publications/page.js` | Redirect → `/researcher/[slug]/section/publications` |
| `/researcher/[slug]/guidance` | `app/researcher/[slug]/guidance/page.js` | Redirect → `/researcher/[slug]/section/guidance` |
| `/researchers/[slug]/gallery` | `app/researchers/[slug]/gallery/page.tsx` | Full gallery page with image viewer |

### Component Dependency Graph
```
RootLayout (layout.js)
├── SiteHeader (components/SiteHeader.tsx)
├── PageBreadcrumb (app/components/PageBreadcrumb.jsx)
├── [children]
│   ├── Home (app/page.js)
│   │   └── ResearcherSearchList (app/components/ResearcherSearchList.jsx)
│   ├── ResearcherPage (app/researcher/[slug]/page.js)
│   │   ├── ResearcherPageLayout (app/components/researcher/ResearcherPageLayout.jsx)
│   │   │   ├── SidebarNavigation (app/components/SidebarNavigation.jsx)
│   │   │   ├── ProfileCard (app/components/ProfileCard.jsx)
│   │   │   │   └── ProtectedImage (app/components/media/ProtectedImage.jsx)
│   │   │   └── MobileSectionsSidebar (components/MobileSectionsSidebar.jsx)
│   │   └── BiographySections (app/components/BiographySections.jsx)
│   └── SectionPage (app/researcher/[slug]/section/[sectionSlug]/page.js)
│       ├── ResearcherPageLayout
│       ├── FilterableArchiveSection (app/components/FilterableArchiveSection.jsx)
│       │   ├── ArchiveFilterPanel (components/ArchiveFilterPanel.jsx)
│       │   └── SidebarItemCard (app/components/SidebarItemCard.jsx)
│       ├── SmartContentRenderer (components/SmartContentRenderer.jsx)
│       └── SidebarContentPage (app/components/SidebarContentPage.jsx)
│           └── SidebarItemCard
└── Footer (app/components/Footer.jsx)
```

### Server vs Client Component Split
**Server Components** (default — no `"use client"`):
- All route `page.js` and `loading.js` files
- `BiographySections`, `ProfileCard`, `SidebarContentPage`, `SidebarItemCard`, `ContentUnavailable`
- `ResearcherPageLayout`, `SmartContentRenderer`
- All block renderers, all UI primitives (except carousel/dialog)

**Client Components** (`"use client"`):
- `ResearcherSearchList`, `SidebarNavigation`, `PageBreadcrumb`, `FilterableArchiveSection`
- `Footer`, `SiteHeader`, `MobileSectionsSidebar`
- `ArchiveFilterPanel`, `FilterPanel`
- `ProtectedImage`, `ResearcherGalleryViewer`, `GalleryCarousel`
- `Breadcrumb`, `carousel.jsx`, `dialog.jsx`
