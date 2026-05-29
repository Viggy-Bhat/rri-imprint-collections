# Architecture Decision Records

> **Purpose**: Architecture Decision Records documenting key design choices, tradeoffs, and rationale.
> **Audience**: Maintainers, architects, future developers inheriting the codebase.
> **Prerequisites**: [System overview](./system-overview.md).
> **Related**: [Pagination architecture](./pagination-architecture.md), [Database architecture](./database-architecture.md).

---

## ADR-1: Headless CMS with Wagtail

**Status**: Accepted

**Date**: Initial project setup

**Context**: The project needed a CMS for editors to create structured researcher profiles, with a separate frontend for public viewing. Traditional Wagtail sites couple content and rendering via Django templates, which would constrain frontend technology choices and prevent the use of modern JavaScript frameworks. Alternatives considered:

- **Monolithic Wagtail**: Use Wagtail templates for all rendering. Rejected: limited interactivity, hard to achieve the gallery/sidebar UX with server-rendered templates.
- **WordPress headless**: Familiar to editors but StreamField-like flexible content blocks are harder to achieve without plugins.
- **Strapi/Contentful**: Would require migrating editors to a new admin UI. Wagtail's admin is well-known to the team.

**Decision**: Use Wagtail as a headless CMS serving a JSON API (both Wagtail's built-in v2 Pages API and custom endpoints), with Next.js as the independent frontend rendering layer. Wagtail handles content authoring and storage via its admin. Next.js fetches the API and renders all pages using Server Components, client components for interactive UI, and ISR for cacheable content.

**Consequences**:

- (+) Editors get the familiar Wagtail admin with StreamField flexibility for content structuring.
- (+) Frontend can iterate independently — React 19, Next.js 16 App Router, Tailwind CSS v4 — with no Wagtail template constraints.
- (+) No Wagtail template rendering in production; all presentation logic lives in the frontend.
- (+) Separation allows the frontend to be deployed on different infrastructure (e.g., Vercel) than the backend.
- (-) Two servers to deploy and maintain (Django + Next.js) instead of one.
- (-) Image URL handling requires manual prefixing (`NEXT_PUBLIC_WAGTAIL_BASE_URL`) because Wagtail returns relative URLs (e.g., `/media/images/photo.jpg`). The frontend must construct full URLs.
- (-) StreamField JSON is deeply nested (`{type, value, id}`) and requires a normalization layer in the frontend (`researcherApi.js`) to flatten sidebar items, extract smart content by type, and map section pages to navigation entries.
- (-) Cross-origin considerations: CORS must be configured correctly for the frontend domain in both dev and production..

---

## ADR-2: StreamField Over Relational Models

**Status**: Accepted

**Date**: Initial project setup

**Context**: Researcher content (publications, guidance, news, galleries, supervision) is highly variable. Each researcher has different numbers and types of items — some have 5 publications, others 50+. A single researcher might have publications but no guidance or news. Traditional relational models would require separate tables for each content type with foreign keys back to the researcher, plus separate admin interfaces.

Alternatives considered:

- **Separate Django models** (e.g., `Publication` model with FK to `ResearcherPage`): Would enable SQL-level filtering and aggregation, but would require separate admin interfaces, data migrations for schema changes, and risk of orphaned items when researcher pages are deleted.
- **Wagtail InlinePanel** with child models: Wagtail's InlinePanel allows editing child `Orderable` models inline on the parent page. Rejected because it would require one inline panel per content type, making the admin interface cluttered.
- **Hybrid approach**: Relational models populated via data migration from StreamField, with dual-write during transition. Reserved as a future migration path (see `pagination-architecture.md` Section 10).

**Decision**: Store all content as StreamField blocks within `ResearcherPage` (`sidebar_items`) and `ResearcherSectionPage` (`smart_content`), rather than creating separate Django models for publications, guidance, etc. The same 5 block types (`PublicationBlock`, `GuidanceBlock`, `NewsClippingBlock`, `StudentSupervisionBlock`, `GalleryBlock`) are usable in both the sidebar StreamBlock and section page StreamBlock.

**Consequences**:

- (+) Zero database migrations required for content schema changes — only block definitions in `blocks.py` need updating.
- (+) Editors can freely mix block types within sections (publications, guidance, news, gallery all in one StreamField).
- (+) Content stays tightly coupled to the researcher page — no orphaned items when pages are deleted.
- (+) Schema flexibility — adding a new field to `PublicationBlock` is a one-line code change with no `ALTER TABLE`.
- (-) No SQL-level filtering or aggregation — all filtering is Python-level (`archive_service.py:189-217`).
- (-) Performance degrades linearly with content volume — must deserialize and scan all blocks at request time.
- (-) No referential integrity within block content — can't enforce required fields or foreign key references at the database level.
- (-) Total item counts require full block scanning — no `SELECT COUNT(*)` equivalents.

---

## ADR-3: JavaScript-Only Frontend (No TypeScript)

**Status**: Accepted

**Date**: 2026-04 (commit `5adc872`: "refactor(frontend): convert TypeScript files to JavaScript and remove TS tooling")

**Context**: The frontend was initially written in TypeScript. During development, the team decided to remove TypeScript and use JavaScript exclusively. The conversion removed `tsconfig.json`, TypeScript type annotations, `@types/*` packages, and the TypeScript compiler from the build pipeline.

**Decision**: Use `.js`/`.jsx` files exclusively. Remove all TypeScript tooling (`tsconfig.json`, type annotations, `@types/*` packages). No compile-time type checking. JSDoc comments are used for type hints when helpful.

**Consequences**:

- (+) Faster iteration — no compilation step, no type errors blocking development.
- (+) Lower barrier for contributors unfamiliar with TypeScript.
- (+) Smaller `node_modules` — no TypeScript compiler or type definition packages.
- (-) No compile-time type safety — type errors (e.g., passing wrong prop types, accessing undefined properties) surface only at runtime, potentially in production.
- (-) No IDE autocompletion for API response shapes — developers must reference documentation (`docs/api/endpoints.md`) or inspect network responses to understand data shapes.
- (-) Larger testing burden — runtime validation must catch type errors that a compiler would otherwise flag. Currently, no test framework is configured for the frontend.
- (-) Refactoring risk — renaming a prop or changing a function signature requires manual search-and-replace across all call sites.

---

## ADR-4: MariaDB Over SQLite

**Status**: Accepted

**Date**: 2026-04 (commit `ced6c23`: "Remove Docker, setup MariaDB migration, and fix frontend 404s")

**Context**: SQLite was the initial database but caused concurrency issues with Wagtail's complex page tree operations. Multiple simultaneous admin edits or API requests during saves caused lock contention and failures. Additionally, Wagtail's StreamField migrations had limited `ALTER TABLE` support on SQLite.

**Decision**: Migrate to MariaDB as the primary database for all environments except local development (where SQLite remains as a zero-config fallback). Use `utf8mb4` charset for full Unicode support.

**Consequences**:

- (+) Row-level locking supports concurrent admin editing and API requests without blocking.
- (+) Native JSON column type for StreamField data (`use_json_field=True`).
- (+) `utf8mb4` charset for full Unicode support, including emoji and special characters in content.
- (+) Full `ALTER TABLE` support for complex schema changes.
- (-) Additional infrastructure dependency — MariaDB server must be installed, configured, and maintained.
- (-) More complex local setup — developers must install and configure MariaDB (or rely on SQLite fallback).
- (-) Data migration required — content was transferred via `dumpdata` -> `loaddata` -> `restore media files`.
- (-) Connection management adds complexity (`conn_max_age`, SSL configuration, charset enforcement).

---

## ADR-5: No Docker for Deployment

**Status**: Accepted

**Date**: 2026-04 (commit `ced6c23`)

**Context**: Docker configuration existed initially (`Dockerfile`, `docker-compose.yml`) but was removed during the MariaDB migration effort. The team opted for direct Linux deployment.

**Decision**: Direct Linux deployment with Gunicorn + nginx + systemd. No container orchestration. Dependencies are installed directly on the host OS.

**Consequences**:

- (+) Simpler deployment — fewer moving parts, no container networking to debug.
- (+) No Docker knowledge required for deployment engineers.
- (+) Direct filesystem access for media files, backups, and log management.
- (-) No environment reproducibility — dependency on host OS packages (Python version, system libraries, MariaDB client).
- (-) Manual setup required for each deployment target — no `docker-compose up` equivalent.
- (-) No horizontal scaling — single server architecture with no container orchestration for auto-scaling.
- (-) `.dockerignore` files still exist from the Docker era (candidate for cleanup).

---

## ADR-6: Consolidated Migrations

**Status**: Accepted

**Date**: 2026-04

**Context**: After the StreamField schema mismatch bug — where `blocks.py` was updated with `smart_content` and `gallery` fields but migrations were not regenerated, causing the API to silently return `undefined` — the decision was made to simplify migration management.

**Decision**: Squash all incremental migrations (0002 through 0013+) into a single `0001_initial.py`. Capture every StreamField block definition in `block_lookup` dictionaries within that single migration. The Home app retains its two separate migrations (model creation + initial data).

**Consequences**:

- (+) No migration dependency chains to manage — every deployment runs the same single migration.
- (+) Each `makemigrations` run detects all block changes against the consolidated baseline.
- (+) Easier to reason about current schema state — one file describes the complete database.
- (-) Incremental migration history is lost — cannot see how the schema evolved over time.
- (-) Future schema audits lack granularity — no record of when specific fields were added or changed.
- (-) Reverting a specific block change requires creating a new reverse migration from the current state.

---

## ADR-7: Offset-Based Pagination with Server-Side Filtering

**Status**: Accepted

**Date**: 2026-04 (documented in `docs/architecture/pagination-architecture.md`)

**Context**: The original implementation fetched all items at once and filtered client-side in `FilterableArchiveSection.jsx`. This became inefficient as content grew — a researcher with 100+ publications would transfer and parse all JSON on every page load.

**Decision**: Server-side offset-based pagination with fixed page size (default 10 items, maximum 50). Filtering (search, year), sorting (7 modes), and pagination all happen server-side against extracted StreamField data. The frontend fetches from type-specific endpoints (`/publications/`, `/guidance/`, `/news/`) with query parameters.

**Consequences**:

- (+) Predictable frontend memory usage — always 10 items regardless of total dataset size.
- (+) Server-side search, filter, and sort scale independently of frontend.
- (+) URL-shareable filter states via query parameters.
- (+) Clear separation between "no items exist" and "no items match filters" states in the UI.
- (-) Drifting results if content changes between page navigation — offset-based, not cursor-based.
- (-) All filtering happens in Python (no SQL queries), limiting scalability for very large datasets.
- (-) Total count requires scanning all items — not a `SELECT COUNT(*)` query.
- (-) Skeleton loading, error states, and empty state differentiation add frontend complexity.

---

## ADR-8: Custom API Endpoints Supplementing Wagtail's Built-in API

**Status**: Accepted

**Context**: Wagtail's built-in v2 API (`/api/v2/pages/`) provides page tree access with basic filtering (`?type=`, `?child_of=`, `?slug=`) but lacks:

- Type-specific endpoints (e.g., dedicated `/publications/` endpoint with publication-shaped responses)
- Server-side pagination (the Pages API returns all pages and all their StreamField blocks at once)
- Content filtering within StreamField blocks (searching by publication title, filtering by year)
- Sorting options (title, author, journal, newest/oldest)
- Utility data access (image URLs, site settings)

Alternatives considered:

- **Use only the Pages API and do everything client-side**: Rejected — inefficient as content grows (transferring 100+ items of deeply nested JSON per page load), and filtering/sorting logic would duplicate across components.
- **Extend Wagtail's v2 API router**: Wagtail's API router supports registering custom endpoints, but StreamField block filtering doesn't map cleanly to Wagtail's queryset-based API framework.
- **GraphQL (e.g., Wagtail Grapple)**: Would provide flexible queries but introduces a new dependency and learning curve.

**Decision**: Build custom Django views (`views.py`, `api/archive_views.py`) that wrap the service layer for type-specific data access. Eight custom endpoints supplement the single Wagtail Pages API endpoint.

**Consequences**:

- (+) Rich filtering and pagination capabilities tailored to each content type.
- (+) Type-specific endpoints with optimized response shapes.
- (+) Lightweight custom endpoints for specific use cases (image lookup, site settings).
- (-) Custom endpoints are not covered by Wagtail's API versioning — no `/api/v1/` or `/api/v2/` prefix.
- (-) Must maintain both Wagtail Pages API integration AND custom endpoint implementations.
- (-) The `filtered-items` endpoint (`views.py:15-41`) was created but is now unused by the frontend — candidate for removal.
- (-) Changing the API contract requires coordinated deployment of both backend and frontend.

---

## ADR-9: No Authentication on Public API

**Status**: Accepted

**Context**: All API data is publicly viewable researcher profiles. No private, user-specific, or role-restricted data exists. The Wagtail admin already uses separate, session-based authentication.

**Decision**: Zero authentication on all public API endpoints. Read-only access for all consumers with no tokens, sessions, API keys, or cookies required.

**Consequences**:

- (+) Zero authentication overhead per request — no token validation, session lookup, or permission checks.
- (+) Simpler frontend integration — no tokens, sessions, or cookies to manage in fetch calls.
- (+) Cacheable responses — no per-user cache key variation (`Vary: Cookie`).
- (+) Simpler deployment — no authentication infrastructure (OAuth server, API gateway).
- (-) No rate limiting at the API level (mitigated by 300s server-side caching).
- (-) No usage analytics — cannot identify or track API consumers.
- (-) If private content is added in the future, authentication must be retrofitted across all endpoints.

---

## ADR-10: Layered Backend Architecture

**Status**: Accepted

**Date**: 2026-04 (commit `c0493a2`: "feat: modularize researchers app into api/services/utils/tests layers")

**Context**: The original `views.py` was 579 lines of monolithic request handling, filtering, pagination, block extraction, and response formatting. All logic lived in a single file with no testability, no separation of concerns, and no reuse.

**Decision**: Split the `researchers` app into four layers with a strict dependency direction:

```
utils -> services -> api -> views
```

- **utils** — Pure functions: text normalization, mapping helpers, item extraction, sorting, pagination.
- **services** — Business logic: block extraction, section item building, filtering orchestration.
- **api** — Thin request handlers: parameter parsing, delegation to services, JSON response construction.
- **views** — URL-routed entry points: image lookup, site settings, legacy filtered-items endpoint.

Each layer depends only on the layer to its left. No upward references.

**Consequences**:

- (+) Testable in isolation — `SimpleTestCase` for utils and services, mocks for views.
- (+) Clear separation of concerns — each file has a single responsibility.
- (+) Reusable utilities — sorting and pagination functions shared across multiple endpoints.
- (+) 43 unit tests covering all layers (`test_pagination.py`, `test_filtering.py`, `test_archive_service.py`, `test_archive_views.py`, `test_edge_cases.py`).
- (-) More files to navigate — 7 files instead of the original 1 (`views.py`).
- (-) Strict import discipline required — no upward references between layers must be enforced manually.
- (-) Indirection — following a request path requires jumping through multiple files.

---

## ADR-11: Time-Based Cache Invalidation (No Event-Driven)

**Status**: Accepted

**Context**: The API needs caching to mitigate the performance cost of StreamField extraction at request time. Event-driven invalidation (e.g., Wagtail publish hooks) could provide near-instant cache updates but adds complexity.

**Decision**: Use purely time-based cache expiry (`@cache_page(300)` / `@cache_page(180)`) with no event-driven cache invalidation. Editors see stale content for up to 3-5 minutes after publishing changes.

**Consequences**:

- (+) Zero complexity — no signal handlers, webhook endpoints, or cache-busting logic.
- (+) Works identically across dev and production (same TTL logic).
- (+) No risk of cache invalidation bugs (e.g., partial invalidation, missed events).
- (-) Content editors experience a 3-5 minute delay before changes are visible to readers.
- (-) No way to force immediate cache refresh from the Wagtail admin.
- (-) Stale cache entries for deprecated block structures may cause frontend rendering issues until TTL expires.

---

## ADR-12: Rich Text Rendering via `dangerouslySetInnerHTML`

**Status**: Accepted

**Context**: Wagtail's `RichTextBlock` stores formatted content as HTML strings. Biography sections (`bio_sections`), sidebar item descriptions, and gallery captions all contain HTML markup from Wagtail's rich text editor (Draftail). The frontend must render this HTML faithfully — preserving headings, links, lists, and formatting — while maintaining visual consistency with the rest of the page.

Alternatives considered:

- **HTML-to-React parser** (e.g., `html-react-parser`): Would convert HTML to React elements, avoiding `dangerouslySetInnerHTML`. Rejected — adds a dependency, and the conversion overhead is unnecessary for trusted CMS-authored content.
- **Markdown as intermediate format**: Would require converting Wagtail's rich text to Markdown in the API, then parsing it in the frontend. Rejected — double conversion loses formatting fidelity and adds complexity.
- **Custom block renderer**: Map each Wagtail rich text feature (bold, italic, h2, h3, etc.) to dedicated React components. Rejected — over-engineering for content that is authored by trusted CMS editors.

**Decision**: Render all rich text HTML directly using React's `dangerouslySetInnerHTML` inside styled `.rich-text-content` containers. Apply base styles (typography, spacing, link colors) via Tailwind CSS prose-like utility classes.

**Consequences**:

- (+) Simple — no parsing libraries, no conversion layers, no custom block renderers.
- (+) Faithful rendering — HTML output from Wagtail's Draftail editor is preserved exactly as authored.
- (+) Performance — raw HTML injection is faster than parsing and rebuilding React element trees.
- (-) Security dependency — assumes all content authors are trusted. If untrusted contributors are ever added, this pattern would need to be replaced.
- (-) Style isolation — rich text styles must be scoped carefully (`.rich-text-content h2`, `.rich-text-content a`) to avoid affecting page-wide styles.
- (-) No interactive components within rich text — embedded rich text cannot contain React components; it's static HTML.

---

## ADR-13: Substring Search Over Full-Text Indexing

**Status**: Accepted

**Context**: The archive endpoints (`/publications/`, `/guidance/`, `/news/`) support a `?search=` parameter for filtering items. Search must work across StreamField content — publications, guidance, and news blocks embedded in sidebar items and section pages.

Alternatives considered:

- **Wagtail's database search backend** (`wagtail.search.backends.database`): Uses SQL `LIKE` or full-text indexes on `SearchField` annotations. Rejected — StreamField JSON column content is not indexed by Wagtail's search framework, and the search fields on `ResearcherPage` only cover the page's `title`, not nested StreamField content.
- **Elasticsearch/Solr** (`wagtail.search.backends.elasticsearch`): Would index all content including StreamField blocks via Wagtail's search signal handlers. Rejected — adds significant infrastructure complexity for a small dataset.
- **PostgreSQL full-text search**: Requires PostgreSQL (not MariaDB), which is not the chosen database.

**Decision**: Perform case-insensitive substring matching in Python (`archive_service.py:189-217`). The `filter_items` function scans extracted item dicts and checks whether the search term appears in `title`, `author`, or `journal` fields. No database-level search is used.

**Consequences**:

- (+) Zero infrastructure — no Elasticsearch cluster, no PostgreSQL extension, no search index to maintain.
- (+) Works identically in dev and production — no search backend differences.
- (+) Searchable fields can be changed entirely in Python without schema changes.
- (-) Linear scan — every search request deserializes all items and loops through them.
- (-) No relevance scoring — results are simple boolean matches; "quantum physics" matches "Quantum Mechanics" and "Physics Today" equally.
- (-) No stemming or fuzzy matching — "publication" does not match "publications".
- (-) Performance degrades with data growth — scanning 1000+ items per request becomes slow.

---

## ADR-14: Python-Level Block Extraction at Request Time

**Status**: Accepted

**Context**: Every API request for filtered/paginated content triggers extraction of StreamField blocks from the researcher's sidebar items and section pages. The `extract_and_filter_by_type` function in `archive_service.py:87-121` scans `sidebar_items` for matching block types, then falls back to scanning `ResearcherSectionPage.smart_content` if no blocks are found in the sidebar.

Alternatives considered:

- **Pre-computed/cached extracted data**: Extract blocks on publish and store normalized dicts in a separate table. Rejected — adds data duplication, requires signal handlers on Wagtail's page publish, and introduces potential for stale normalized data.
- **Database triggers to maintain a materialized view**: Would extract JSON fields into rows on INSERT/UPDATE. Rejected — MariaDB trigger complexity and schema coupling.
- **Wagtail's `with_content_json()`**: Wagtail provides a method to export/import content as JSON, but doesn't solve the extraction problem for live API requests.

**Decision**: Extract blocks from StreamField JSON at request time, apply filtering and sorting in Python, and paginate the results. Cache the final response (300s) to avoid repeated extraction for identical requests.

**Consequences**:

- (+) Always consistent — extraction uses the live StreamField data; no risk of stale pre-computed data.
- (+) Simple code path — no background jobs, no materialized views, no dual-write complexity.
- (-) Expensive on cache miss — full deserialization and block traversal on every uncached request.
- (-) Two-tier scanning — first scans `sidebar_items` for blocks, then falls back to `ResearcherSectionPage` queries if blocks aren't in the sidebar. This means blocks stored only on section pages always trigger a database query.
- (-) No partial extraction — all blocks of all types are deserialized even when only one type is requested.

