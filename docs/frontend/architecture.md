# Frontend Architecture

> **Purpose**: Complete architecture reference for the Next.js 16 App Router frontend — routing structure, component hierarchy, server/client component split, and design patterns.
> **Audience**: Frontend developers working on the Next.js codebase.
> **Prerequisites**: [System overview](../architecture/system-overview.md).
> **Related**: [API integration](./api-integration.md), [Rendering flow](./rendering-flow.md), [frontend/README.md](../../frontend/README.md).

## 1. App Router Structure

```
frontend/
├── app/
│   ├── layout.js                          # Root layout — SiteHeader, PageBreadcrumb, Footer, site settings fetch
│   ├── page.js                            # Home page — fetches all pages, filters ResearcherPage, renders ResearcherSearchList
│   ├── loading.js                         # Global loading skeleton with shimmer animation
│   ├── globals.css                        # Tailwind v4 imports, theme vars, typography, rich text, academic utilities
│   ├── favicon.ico                        # Favicon
│   ├── lib/
│   │   ├── config.js                      # getWagtailBackendBaseUrl(), getWagtailPagesApiUrl() — URL normalization
│   │   ├── wagtailApi.js                  # fetchImageDetails(), fetchImageDetailsBatch() — image API client
│   │   ├── siteSettingsApi.js             # getSiteSettings() — ISR-cached site settings fetch
│   │   └── formatDate.js                  # formatIndianDate(), formatIndianDateRange() — en-IN locale formatting
│   ├── researcher/[slug]/
│   │   ├── page.js                        # Researcher profile — fetches researcher, normalizes data, renders ResearcherPageLayout
│   │   ├── loading.js                     # 3-column skeleton: sidebar nav, main content, profile card
│   │   ├── researcherApi.js               # Core data normalization layer (395 lines) — all API fetch + transform functions
│   │   ├── section/[sectionSlug]/
│   │   │   └── page.js                    # Section detail — filter target routing, SmartContentRenderer, SidebarContentPage
│   │   ├── [section]/
│   │   │   ├── page.js                    # Legacy redirect: /researcher/[slug]/[section] → /researcher/[slug]/section/[section]
│   │   │   └── loading.js                 # Legacy section loading skeleton
│   │   ├── publications/page.js           # Legacy redirect: /researcher/[slug]/publications → /researcher/[slug]/section/publications
│   │   ├── guidance/page.js               # Legacy redirect: /researcher/[slug]/guidance → /researcher/[slug]/section/guidance
│   │   └── gallery/page.js                # Legacy redirect: /researcher/[slug]/gallery → /researchers/[slug]/gallery
│   └── researchers/[slug]/gallery/
│       └── page.jsx                        # Gallery page — fetches gallery images, renders ResearcherGalleryViewer
├── components/
│   ├── layout/
│   │   ├── index.js                       # Barrel export: SiteHeader, Footer, PageBreadcrumb
│   │   ├── SiteHeader.jsx                 # Client: Header with hero section, adapts for home vs inner pages
│   │   ├── SiteHeader.module.css          # CSS module for header — "IMPRINTS COLLECTION" badge, double-border effect
│   │   ├── Footer.jsx                     # Server: Site footer with RRI logo
│   │   └── PageBreadcrumb.jsx            # Client: Breadcrumb trail based on URL pathname
│   ├── researchers/
│   │   ├── index.js                       # Barrel export: 7 researcher components
│   │   ├── ResearcherPageLayout.jsx       # Server: 2/3-column responsive layout orchestrator
│   │   ├── BiographySections.jsx         # Server: Renders bio sections with dangerouslySetInnerHTML
│   │   ├── ProfileCard.jsx               # Server: Profile sidebar card with ProtectedImage
│   │   ├── SidebarNavigation.jsx         # Client: Desktop sidebar nav with active state
│   │   ├── MobileSectionsSidebar.jsx     # Client: Slide-out drawer for mobile navigation
│   │   ├── SidebarContentPage.jsx        # Server: Generic sidebar item list renderer
│   │   └── SidebarItemCard.jsx           # Server: Card for individual sidebar list items
│   ├── archive/
│   │   ├── index.js                       # Barrel export: FilterableArchiveSection
│   │   └── FilterableArchiveSection.jsx  # Client: Paginated, filtered archive view (201 lines)
│   ├── gallery/
│   │   ├── index.js                       # Barrel export: GalleryCarousel, ResearcherGalleryViewer
│   │   ├── GalleryCarousel.jsx           # Client: Full-screen lightbox with keyboard/touch nav (197 lines)
│   │   └── ResearcherGalleryViewer.jsx   # Client: Gallery grid with thumbnail strip + lightbox (146 lines)
│   ├── media/
│   │   ├── index.js                       # Barrel export: ProtectedImage
│   │   └── ProtectedImage.jsx            # Client: Image with right-click/drag protection
│   ├── ui/
│   │   └── card.jsx                       # Server: Reusable Card, CardHeader, CardContent, CardFooter
│   ├── SmartContentRenderer.jsx          # Server: Switches on block.type for publication/guidance/news/supervision/gallery (127 lines)
│   ├── ResearcherSearchList.jsx          # Client: Searchable, filterable researcher list on home page (71 lines)
│   ├── ArchiveFilterPanel.jsx            # Client: Filter UI panel — search, sort dropdown (7 options), year input (98 lines)
│   └── ContentUnavailable.jsx           # Server: Error/fallback component
├── lib/
│   └── utils.js                           # cn() — clsx + tailwind-merge utility
├── public/
│   └── assets/background/                 # Background pattern image location (rri-pattern.png)
├── next.config.mjs                        # Turbopack, remotePatterns for image optimization
├── postcss.config.mjs                     # @tailwindcss/postcss v4 plugin
├── eslint.config.mjs                      # ESLint 9 flat config, next/core-web-vitals
├── jsconfig.json                          # @/* path alias
└── package.json                           # next 16.2.3, react 19.2.4, clsx, tailwind-merge
```

## 2. Route Map

| URL Pattern | File | Type | Purpose |
|---|---|---|---|
| `/` | `app/page.js` | Server | Home page — lists all researchers |
| `/researcher/[slug]` | `app/researcher/[slug]/page.js` | Server | Researcher profile with bio, sidebar, profile card |
| `/researcher/[slug]/section/[sectionSlug]` | `app/researcher/[slug]/section/[sectionSlug]/page.js` | Server | Section detail with archive/smart content/sidebar list |
| `/researchers/[slug]/gallery` | `app/researchers/[slug]/gallery/page.jsx` | Server | Full gallery page with lightbox |
| `/researcher/[slug]/[section]` | `app/researcher/[slug]/[section]/page.js` | Redirect | Legacy: redirects to `/researcher/[slug]/section/[section]` |
| `/researcher/[slug]/publications` | `app/researcher/[slug]/publications/page.js` | Redirect | Legacy: redirects to `/researcher/[slug]/section/publications` |
| `/researcher/[slug]/guidance` | `app/researcher/[slug]/guidance/page.js` | Redirect | Legacy: redirects to `/researcher/[slug]/section/guidance` |
| `/researcher/[slug]/gallery` | `app/researcher/[slug]/gallery/page.js` | Redirect | Legacy: redirects to `/researchers/[slug]/gallery` |

Note: researcher profile and gallery use different path prefixes — `researcher/` (singular) for profiles, `researchers/` (plural) for gallery.

## 3. Component Hierarchy

```mermaid
graph TD
    RootLayout[RootLayout - Server] --> SiteHeader[SiteHeader - Client]
    RootLayout --> PageBreadcrumb[PageBreadcrumb - Client]
    RootLayout --> PageContent[/[page content]/]
    RootLayout --> Footer[Footer - Server]

    PageContent --> HomePage[HomePage - Server]
    PageContent --> ResearcherPage[ResearcherPage - Server]
    PageContent --> SectionPage[SectionPage - Server]
    PageContent --> GalleryPage[GalleryPage - Server]

    HomePage --> RSL[ResearcherSearchList - Client]

    ResearcherPage --> RPL[ResearcherPageLayout - Server]
    RPL --> SN[SidebarNavigation - Client]
    RPL --> MSS[MobileSectionsSidebar - Client]
    RPL --> PC[ProfileCard - Server]
    PC --> PI[ProtectedImage - Client]
    RPL --> BS[BiographySections - Server]

    SectionPage --> RPL2[ResearcherPageLayout - Server]
    SectionPage --> FAS[FilterableArchiveSection - Client]
    FAS --> AFP[ArchiveFilterPanel - Client]
    FAS --> SIC_C[SidebarItemCard - Server]
    SectionPage --> SCR[SmartContentRenderer - Server]
    SectionPage --> SCP[SidebarContentPage - Server]
    SCP --> SIC2[SidebarItemCard - Server]

    GalleryPage --> RGV[ResearcherGalleryViewer - Client]
    RGV --> GC[GalleryCarousel - Client]
```

## 4. Server Components vs Client Components

| Component | Type | File | Why Client |
|---|---|---|---|
| RootLayout | Server | `app/layout.js` | — |
| HomePage | Server | `app/page.js` | — |
| Loading (global) | Server | `app/loading.js` | — |
| ResearcherPage | Server | `app/researcher/[slug]/page.js` | — |
| ResearcherLoading | Server | `app/researcher/[slug]/loading.js` | — |
| ResearcherSectionPage | Server | `app/researcher/[slug]/section/[sectionSlug]/page.js` | — |
| ResearcherGalleryPage | Server | `app/researchers/[slug]/gallery/page.jsx` | — |
| Legacy redirects (4) | Client | `app/researcher/[slug]/*/page.js` | Uses `redirect()` from next/navigation |
| SiteHeader | Client | `components/layout/SiteHeader.jsx` | Uses `usePathname()` for home vs inner page adaptation |
| Footer | Server | `components/layout/Footer.jsx` | — |
| PageBreadcrumb | Client | `components/layout/PageBreadcrumb.jsx` | Uses `usePathname()` |
| ResearcherPageLayout | Server | `components/researchers/ResearcherPageLayout.jsx` | — |
| BiographySections | Server | `components/researchers/BiographySections.jsx` | — |
| ProfileCard | Server | `components/researchers/ProfileCard.jsx` | — |
| SidebarNavigation | Client | `components/researchers/SidebarNavigation.jsx` | Uses `usePathname()` for active state |
| MobileSectionsSidebar | Client | `components/researchers/MobileSectionsSidebar.jsx` | Uses `useState` for drawer toggle |
| SidebarContentPage | Server | `components/researchers/SidebarContentPage.jsx` | — |
| SidebarItemCard | Server | `components/researchers/SidebarItemCard.jsx` | — |
| SmartContentRenderer | Server | `components/SmartContentRenderer.jsx` | — |
| ResearcherSearchList | Client | `components/ResearcherSearchList.jsx` | Uses `useState`, `useMemo` for search filtering |
| FilterableArchiveSection | Client | `components/archive/FilterableArchiveSection.jsx` | Uses `useState`, `useEffect`, `useCallback` for pagination and filters (201 lines) |
| ArchiveFilterPanel | Client | `components/ArchiveFilterPanel.jsx` | Uses `useState` for mobile toggle |
| ResearcherGalleryViewer | Client | `components/gallery/ResearcherGalleryViewer.jsx` | Uses `useState` for lightbox state (146 lines) |
| GalleryCarousel | Client | `components/gallery/GalleryCarousel.jsx` | Uses `useState`, keyboard event handlers (197 lines) |
| ProtectedImage | Client | `components/media/ProtectedImage.jsx` | Uses browser event handlers (onContextMenu, onDragStart) |
| Card (ui) | Server | `components/ui/card.jsx` | — |
| ContentUnavailable | Server | `components/ContentUnavailable.jsx` | — |

## 5. Data Fetching Patterns

| Endpoint | Called From | Pattern | Caching |
|---|---|---|---|
| `GET /api/v2/pages/` | `app/page.js`, `app/researcher/[slug]/researcherApi.js` | `fetch(url, { cache: "no-store" })` | No cache (CMS content must be fresh) |
| `GET /api/v2/pages/<id>/` | `app/researcher/[slug]/researcherApi.js` | `fetch(url, { cache: "no-store" })` | No cache |
| `GET /api/v2/pages/?child_of=<id>` | `app/researcher/[slug]/researcherApi.js` | `fetch(url, { cache: "no-store" })` | No cache |
| `GET /api/site-settings/` | `app/layout.js` via `getSiteSettings()` | `fetch(url, { next: { revalidate: 300 } })` | ISR — 5-minute revalidation |
| `GET /api/images/<id>/` | `app/lib/wagtailApi.js` via `fetchImageDetails()` | `fetch(url, { cache: "no-store" })` | No cache (images may change) |
| `GET /api/researchers/<slug>/<sectionType>/?...` | `components/archive/FilterableArchiveSection.jsx` | Client-side `useEffect` fetch | No caching (every filter change triggers new fetch) |
| `GET /api/researchers/<slug>/sections/<section>/count/` | `app/researcher/[slug]/section/[sectionSlug]/page.js` | `fetch(url, { next: { revalidate: 300 } })` | ISR — 5-minute revalidation |
| Image URL resolution | `app/lib/wagtailApi.js`, `app/researcher/[slug]/researcherApi.js` | Relative URL prefix with `NEXT_PUBLIC_WAGTAIL_BASE_URL`, fallback to `/api/images/<id>/` | N/A (URL construction, not caching) |

## 6. Import Conventions

All internal imports use the `@/` path alias defined in `jsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

Examples from source code:
```javascript
import { cn } from "@/lib/utils"
import { getWagtailBackendBaseUrl, getWagtailPagesApiUrl } from "@/app/lib/config"
import { Footer, PageBreadcrumb, SiteHeader } from "@/components/layout"
import { ProfileCard, SidebarNavigation } from "@/components/researchers"
import { FilterableArchiveSection } from "@/components/archive"
import { ResearcherGalleryViewer } from "@/components/gallery"
import { ProtectedImage } from "@/components/media"
```

Components in domain directories are imported via barrel exports (index.js files). Top-level components (SmartContentRenderer, ResearcherSearchList, ArchiveFilterPanel, ContentUnavailable) are imported directly.

## 7. Component Organization

Components are organized by domain into subdirectories under `frontend/components/`, each with a barrel export `index.js`:

| Directory | Barrel Exports | Components |
|---|---|---|
| `layout/` | `SiteHeader`, `Footer`, `PageBreadcrumb` | 3 components |
| `researchers/` | `BiographySections`, `MobileSectionsSidebar`, `ProfileCard`, `ResearcherPageLayout`, `SidebarContentPage`, `SidebarItemCard`, `SidebarNavigation` | 7 components |
| `archive/` | `FilterableArchiveSection` | 1 component |
| `gallery/` | `GalleryCarousel`, `ResearcherGalleryViewer` | 2 components |
| `media/` | `ProtectedImage` | 1 component |
| `ui/` | No barrel export | `Card`, `CardHeader`, `CardContent`, `CardFooter` |
| Top-level | — | `SmartContentRenderer`, `ResearcherSearchList`, `ArchiveFilterPanel`, `ContentUnavailable` |

## 8. Routing Patterns

- **File-based routing**: Standard Next.js App Router convention. Directories define URL segments, `page.js` files define rendered content.
- **Dynamic segments**: `[slug]` in `app/researcher/[slug]/` captures the researcher identifier. `[sectionSlug]` in `app/researcher/[slug]/section/[sectionSlug]/` captures the section identifier.
- **Parallel hierarchies**: `researcher/` (singular, for profiles and sections) and `researchers/` (plural, for gallery) are separate parallel directory trees — not URL-rewritten, not shared layouts.
- **Redirect patterns**: Five legacy routes use `redirect()` from `next/navigation`:
  - `/researcher/[slug]/[section]` → `/researcher/[slug]/section/[section]`
  - `/researcher/[slug]/publications` → `/researcher/[slug]/section/publications`
  - `/researcher/[slug]/guidance` → `/researcher/[slug]/section/guidance`
  - `/researcher/[slug]/gallery` → `/researchers/[slug]/gallery`

## 9. Layout Hierarchy

The project uses a single root layout (`app/layout.js`). There are no nested layouts beyond the root.

```
RootLayout (app/layout.js)
├── SiteHeader
├── PageBreadcrumb
├── {children} (page content)
│   ├── HomePage (app/page.js)
│   ├── ResearcherPage (app/researcher/[slug]/page.js)
│   ├── SectionPage (app/researcher/[slug]/section/[sectionSlug]/page.js)
│   └── GalleryPage (app/researchers/[slug]/gallery/page.jsx)
└── Footer
```

Loading states are provided by co-located `loading.js` files:
- `app/loading.js` — Global loading skeleton
- `app/researcher/[slug]/loading.js` — 3-column researcher skeleton

## 10. Error Handling

There are no `error.js` or `not-found.js` files in the App Router. Instead:
- Researcher fetch failures return `hasError: true` which renders `<ContentUnavailable />`
- Researcher not found (no matching page) shows a custom "Researcher Not Found" message with a link home
- Section pages that don't match return `<ContentUnavailable />`
- Gallery page uses `notFound()` from `next/navigation` (triggers Next.js default 404)
- `FilterableArchiveSection` has an internal error state with retry button
- Image resolution failures return `null` (image silently omitted)

## 11. Known Frontend Technical Debt

| ID | Item | Impact | Notes |
|---|---|---|---|
| FE-1 | No error boundaries | No branded error pages | Missing `error.js` in all route segments. Default Next.js error UI is shown on uncaught exceptions. |
| FE-2 | No test framework | Zero test coverage | Per AGENTS.md. No Jest, Vitest, or Playwright configured. |
| FE-3 | Client-side filtered search on home page | Won't scale beyond ~100 researchers | `ResearcherSearchList` filters all researchers in memory with `useMemo`. No server-side search. |
| FE-4 | No TypeScript | No compile-time type safety | Intentional as per conventions. Only JSDoc comments used in select files. |
| FE-5 | `researcherApi.js` monolithic (395 lines) | Hard to navigate and maintain | Single file contains all normalization, fetching, and image resolution logic. No module splitting. |
| FE-6 | `researcher/` vs `researchers/` path divergence | Confusing URL structure | Profiles use singular path prefix, gallery uses plural. Inconsistent. |
| FE-7 | No loading.js for section or gallery pages | Section and gallery pages have no skeleton state | Only root and researcher profile have loading states. |
