# Frontend — RRI Imprint Collections

Next.js 16.2.3 frontend for the RRI Imprint Collections platform. Consumes the Django/Wagtail backend API to render researcher profiles, sections, galleries, and rich-text content.

## Tech Stack

- **Framework**: Next.js 16.2.3 (App Router, Turbopack enabled)
- **Runtime**: React 19.2.4
- **Language**: JavaScript (`.js` / `.jsx`) — no TypeScript
- **Styling**: Tailwind CSS v4 with `@tailwindcss/postcss`
- **Fonts**: Geist (sans/mono via `next/font`), Playfair Display + Libre Baskerville (serif via Google Fonts in CSS)

## Quick Start

```bash
cd frontend
npm install
# Copy environment file
cp .env.example .env.local
# Edit .env.local if your backend runs somewhere other than http://127.0.0.1:8000
npm run dev
```

The dev server starts at `http://localhost:3000`.

## Available Scripts (via root package.json)

```bash
npm run dev    # Start Next.js dev server (Turbopack)
npm run build  # Production build
npm run start  # Start production server
npm run lint   # Run ESLint
```

Lint a specific file with auto-fix:
```bash
npx eslint app/page.js --fix
```

## Environment Variables

Create `.env.local` from `.env.example`:

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_WAGTAIL_BASE_URL` | `http://127.0.0.1:8000` | Django/Wagtail backend base URL. Must be `NEXT_PUBLIC_` because the browser needs it for image URLs. |

## Architecture Overview

### App Router Structure

```
app/
├── page.js                          # Home page — lists all researchers
├── layout.js                        # Root layout: SiteHeader, PageBreadcrumb, Footer
├── globals.css                      # Global styles, Tailwind v4 imports, academic theme
├── loading.js                       # Global loading fallback
├── lib/
│   ├── config.js                    # Wagtail API URL helpers
│   ├── wagtailApi.js                # Image fetch utilities
│   ├── siteSettingsApi.js           # Footer/site settings fetch
│   └── formatDate.js                # Date formatting helpers
├── researcher/
│   └── [slug]/
│       ├── page.js                  # Researcher profile page
│       ├── loading.js               # Profile page loading state
│       ├── researcherApi.js         # Data normalization helpers for researcher pages
│       ├── section/
│       │   └── [sectionSlug]/
│       │       └── page.js          # Section detail page (publications, guidance, etc.)
│       ├── gallery/
│       │   └── page.js              # Gallery page
│       ├── publications/
│       │   └── page.js              # Publications alias
│       ├── guidance/
│       │   └── page.js              # Guidance alias
│       └── [section]/
│           └── page.js              # Legacy redirect: /[section] → /section/[section]
└── researchers/
    └── [slug]/
        └── gallery/                  # Alternative gallery route
```

### Frontend Architecture — Component Layer

```
components/
├── layout/
│   ├── SiteHeader.jsx               # Site header with hero section (client component)
│   ├── SiteHeader.module.css         # Header CSS module
│   ├── Footer.jsx                   # Site footer
│   └── PageBreadcrumb.jsx           # Breadcrumb trail (client component)
│   └── index.js                     # Barrel exports
│
├── researchers/
│   ├── BiographySections.jsx        # Renders bio sections with rich text
│   ├── MobileSectionsSidebar.jsx    # Mobile sidebar drawer (client component)
│   ├── ProfileCard.jsx              # Researcher profile sidebar card
│   ├── ResearcherPageLayout.jsx     # 2/3-column layout for researcher pages
│   ├── SidebarContentPage.jsx       # Generic sidebar item renderer
│   ├── SidebarItemCard.jsx          # Card for sidebar list items
│   ├── SidebarNavigation.jsx        # Sidebar nav links (client component)
│   └── index.js                     # Barrel exports
│
├── archive/
│   ├── FilterableArchiveSection.jsx # Filter panel for publications/guidance (client component)
│   └── index.js                     # Barrel exports
│
├── gallery/
│   ├── GalleryCarousel.jsx          # Reusable image carousel
│   ├── ResearcherGalleryViewer.jsx  # Full gallery view for a researcher
│   └── index.js                     # Barrel exports
│
├── media/
│   ├── ProtectedImage.jsx           # Image with right-click/drag protection (client component)
│   └── index.js                     # Barrel exports
│
├── ui/
│   └── card.jsx                     # Reusable Card primitive
│
├── ArchiveFilterPanel.jsx           # Filter UI for archive sections (client component)
├── ContentUnavailable.jsx           # Error/fallback state
├── ResearcherSearchList.jsx         # Searchable researcher list (client component)
└── SmartContentRenderer.jsx         # Renders smart content blocks (publications, guidance, news, supervision, gallery)
```

**Key principles:**
- `app/` is the **route layer only** — pages, layouts, and loading states
- `components/` is the **unified UI layer** — all reusable components live here
- **Domain-based organization**: `layout/`, `researchers/`, `archive/`, `gallery/`, `media/`, `ui/`
- **Barrel exports** (`index.js`) allow clean multi-imports from domain directories
- **Import convention**: Always use `@/components/...` paths; never import from `@/app/components/...`

### Utilities

```
lib/
└── utils.js                         # `cn()` helper — merges clsx + tailwind-merge
```

## Key Conventions

### JavaScript, Not TypeScript
- Use `.js` for plain JavaScript, `.jsx` for JSX files.
- Use JSDoc for type hints when helpful.

### Server Components by Default
- Do not add `"use client"` unless you need: React hooks, browser APIs, or event handlers.
- Data fetching happens in Server Components (async page functions).

### Path Aliases
Always use `@/` for imports:
```javascript
import { SiteHeader } from "@/components/layout";
import { ResearcherPageLayout } from "@/components/researchers";
import { cn } from "@/lib/utils";
```

### Class Name Composition
Use the `cn()` utility from `@/lib/utils` instead of template literals:
```javascript
import { cn } from "@/lib/utils";
// Good
<div className={cn("base-classes", variantClasses[variant], className)} />
// Avoid
<div className={`base-classes ${variant} ${className}`} />
```

### Tailwind v4
- The project uses Tailwind CSS v4 with the `@tailwindcss/postcss` plugin.
- Custom theme colors and `@apply` classes are defined in `app/globals.css`.

### Academic Theme Colors
- Primary accent: `#8b1c1c` (deep red)
- Secondary accent: `#8b1f1f` (slightly different red)
- Background: `#f8f6f2` (warm cream)
- Overlay: `rgba(248, 246, 242, 0.8)`

### Image Handling
Wagtail API returns relative image URLs (e.g., `/media/images/...`). The frontend manually prefixes them with the backend base URL:
```javascript
import { getWagtailBackendBaseUrl } from "@/app/lib/config";
const base = getWagtailBackendBaseUrl();
// imageUrl = base + "/media/images/..."
```

This is handled automatically in `researcherApi.js` and `wagtailApi.js`.

### Rich Text Rendering
Wagtail `RichTextBlock` content arrives as HTML strings. Render with `dangerouslySetInnerHTML` inside a `.rich-text-content` container:
```jsx
<div
  className="rich-text-content"
  dangerouslySetInnerHTML={{ __html: section.content }}
/>
```
This is safe because content is authored in the trusted CMS, not by end users.

### No Tests
No test framework is configured. Do not add tests unless explicitly requested.

## Data Flow

1. **Wagtail API** (`/api/v2/pages/`) returns researcher pages with nested StreamField blocks.
2. **Page components** fetch data server-side via `fetch()` with `{ cache: "no-store" }`.
3. **researcherApi.js** normalizes deeply nested block structures:
   - `sidebar_items[].value.smart_content[]` — smart content blocks
   - `sidebar_items[].value.gallery[]` — gallery images
   - `bio_sections[].value.content` — rich text HTML
4. **SmartContentRenderer** renders publication, guidance, news, supervision, and gallery blocks.
5. **BiographySections** renders bio sections with rich text styling.

## Important Files

| File | Purpose |
|------|---------|
| `next.config.mjs` | Next.js config — Turbopack root, remote image patterns for `127.0.0.1:8000` |
| `postcss.config.mjs` | PostCSS config — `@tailwindcss/postcss` plugin |
| `eslint.config.mjs` | ESLint config — `eslint-config-next/core-web-vitals` |
| `jsconfig.json` | Path aliases: `@/*` maps to `./*` |
| `components.json` | shadcn/ui config (tsx: false, rsc: true) |

## Static Assets

- Background pattern: `public/assets/background/rri-pattern.png` (must exist or background fails silently)
- RRI Logo: `public/assets/background/RRI-Logo-Colour.png`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Background not visible | Ensure `public/assets/background/rri-pattern.png` exists |
| Images not loading | Check `NEXT_PUBLIC_WAGTAIL_BASE_URL` points to running backend |
| Wagtail API empty | Ensure pages are **published** in Wagtail admin |
| Smart content missing | See backend README — run migrations after block changes |

## Related

- [Root AGENTS.md](../AGENTS.md) — Full-stack agent guidelines
- [Backend README](../backend/README.md) — Backend setup and architecture
