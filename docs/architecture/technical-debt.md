# Technical Debt Inventory

> **Purpose**: Consolidated inventory of all identified technical debt items with priority, impact, remediation effort, recommended solutions, dependencies, and target milestones.
> **Audience**: Maintainers, architects, engineering leads planning refactoring cycles.
> **Prerequisites**: [System overview](./system-overview.md), [Architecture decisions](./decisions.md).
> **Related**: [Known constraints](./system-overview.md#8-known-constraints-and-technical-debt), [Future roadmap](../future-roadmap/README.md) (forthcoming).

---

## Summary

| Priority | Count | Items |
|----------|-------|-------|
| High | 3 | TD-1, TD-2, TD-3 |
| Medium | 5 | TD-4, TD-5, TD-6, TD-7, TD-8 |
| Low | 8 | TD-9, TD-10, TD-11, TD-12, TD-13, TD-14, TD-15, TD-16 |

---

## High Priority

### TD-1: StreamField Extraction at Request Time (No DB-Level Filtering)

**Priority**: High
**Impact**: Performance degrades linearly with content volume. Every API request for publications/guidance/news scans all StreamField blocks, deserializes JSON, extracts matching types, then filters/sorts/paginates entirely in Python. With hundreds of researchers and thousands of items, cache misses will become prohibitively slow.
**Estimated Remediation Effort**: Large (requires data migration + new models + new API layer)
**Recommended Solution**: Implement the relational migration roadmap in [pagination-architecture.md](./pagination-architecture.md#10-future-relational-migration-roadmap): extract StreamField blocks into Django models (Publication, Guidance, News), add data migration, dual-write during transition, then switch API to ORM queries.
**Dependencies**: MariaDB (no PostgreSQL-specific features required)
**Target Milestone**: Before researcher count exceeds 50 or any single researcher exceeds 500 items
**Related ADRs**: ADR-2 (StreamField Over Relational Models), ADR-14 (Python-Level Block Extraction)
**Reference**: `backend/researchers/services/archive_service.py:87-121` — `extract_and_filter_by_type()` scans all sidebar sections

---

### TD-2: No Event-Driven Cache Invalidation

**Priority**: High
**Impact**: Content editors must wait up to 5 minutes (or restart the dev server) to see published changes in the API and frontend. In a multi-editor production environment, this causes confusion and support tickets.
**Estimated Remediation Effort**: Medium (add Wagtail signal handlers + cache key management)
**Recommended Solution**: Register Wagtail `page_published` and `page_unpublished` signal handlers that invalidate relevant cache keys. For Redis, use key pattern deletion (`cache.delete_pattern("views.decorators.cache.cache_page.researcher_publications.*")`). For LocMemCache, provide a management command for manual invalidation.
**Dependencies**: Redis for pattern-based key deletion; LocMem does not support key scanning
**Target Milestone**: Before production deployment with multiple editors
**Related ADRs**: ADR-11 (Time-Based Cache Invalidation)
**Reference**: `backend/researchers/views.py:16` — `@cache_page(300)` decorators, `backend/backend/settings/base.py:254-271` — cache configuration

---

### TD-3: Consolidated Migration History Lost

**Priority**: High
**Impact**: Cannot audit how the database schema evolved. Any rollback requires creating a new reverse migration from current state. The worst bug in this project (StreamField schema mismatch where `smart_content` and `gallery` fields silently returned `undefined`) has no migration record showing how it was fixed.
**Estimated Remediation Effort**: Small (document the known history + enforce migration discipline)
**Recommended Solution**: 
1. Document the known schema evolution in `docs/migrations/` as a narrative (even without the original migration files)
2. Create `docs/migrations/wagtail-migration-issues.md` with the schema mismatch post-mortem
3. Enforce the AGENTS.md rule: "After ANY StreamField block change, migrate immediately"
4. Never squash migrations again without archiving the originals
**Dependencies**: None
**Target Milestone**: Immediate
**Related ADRs**: ADR-6 (Consolidated Migrations)
**Reference**: `backend/researchers/migrations/0001_initial.py` — single consolidated migration

---

## Medium Priority

### TD-4: No Test Framework for Frontend

**Priority**: Medium
**Impact**: Zero test coverage for React components, API integration, data normalization, or rendering logic. Regressions in the component tree (which has been merged and refactored multiple times per git history) are caught only by manual testing.
**Estimated Remediation Effort**: Large (add testing framework + write initial tests)
**Recommended Solution**: Add Jest + React Testing Library for component tests. Add MSW (Mock Service Worker) for API mocking in integration tests. Start with the most critical paths: `researcherApi.js` normalization functions, `SmartContentRenderer`, `FilterableArchiveSection`.
**Dependencies**: Requires adding test dependencies to `package.json`
**Target Milestone**: Before next major frontend refactoring
**Related ADRs**: ADR-3 (JavaScript-Only Frontend)
**Reference**: AGENTS.md:67 — "No test framework is configured. Do not add tests unless explicitly requested."

---

### TD-5: No API Versioning on Custom Endpoints

**Priority**: Medium
**Impact**: Changing any custom API endpoint contract requires coordinated deployment of both backend and frontend. No path exists for running multiple API versions simultaneously during a transition. Breaking changes risk downtime.
**Estimated Remediation Effort**: Medium (add URL prefix + version negotiation)
**Recommended Solution**: Add `/api/v1/` prefix to all custom endpoints. Maintain current unversioned URLs as redirects during transition. Future breaking changes get `/api/v2/` endpoints with a deprecation window.
**Dependencies**: Frontend must update all API URLs in `researcherApi.js`, `FilterableArchiveSection.jsx`, `wagtailApi.js`, `siteSettingsApi.js`, and section page components
**Target Milestone**: Before any endpoint contract changes
**Related ADRs**: ADR-8 (Custom API Endpoints Supplementing Wagtail's Built-in API)
**Reference**: `backend/backend/urls.py:29-61` — unversioned URL patterns

---

### TD-6: No Docker/Container Support

**Priority**: Medium
**Impact**: No environment reproducibility. Each deployment target requires manual setup of system packages (Python, Node.js, MariaDB, Redis). Onboarding new developers requires following a multi-page setup guide. Cannot leverage container orchestration for scaling.
**Estimated Remediation Effort**: Medium (create Dockerfiles + compose file)
**Recommended Solution**: Create `backend/Dockerfile` and `frontend/Dockerfile`, plus `docker-compose.yml` for local development (with MariaDB and Redis services). Remove existing `.dockerignore` files if Docker is truly unwanted, or implement containers properly.
**Dependencies**: None (standalone)
**Target Milestone**: Before more than 2 developers join the project
**Related ADRs**: ADR-5 (No Docker for Deployment)
**Reference**: `.dockerignore` files exist in `backend/` and `frontend/` but no Dockerfiles

---

### TD-7: No CI/CD Pipeline

**Priority**: Medium
**Impact**: No automated testing, linting, or build verification. Broken code can be committed to main without detection. The current branch strategy relies on manual discipline.
**Estimated Remediation Effort**: Medium (add GitHub Actions workflows)
**Recommended Solution**: Add `.github/workflows/ci.yml` with: Python lint (flake8/ruff), Django system checks, run backend tests (43 existing tests), frontend ESLint, frontend build verification. Add `.github/workflows/deploy.yml` for automated deployment when ready.
**Dependencies**: TD-4 (frontend tests) should be partially addressed first
**Target Milestone**: Before the next release to production
**Related ADRs**: None directly
**Reference**: No `.github/` directory exists in the repository; 43 backend tests are already written but not automated

---

### TD-8: Substring Search Without Full-Text Indexing

**Priority**: Medium
**Impact**: Archive search (`filter_items()` in `archive_service.py`) performs case-insensitive Python-level substring matching across title, author, and journal fields. No stemming, ranking, or relevance scoring. Search quality is poor for non-exact matches.
**Estimated Remediation Effort**: Medium (add Django full-text search or integrate external search)
**Recommended Solution**: If staying with MariaDB, use MySQL full-text indexes on extracted content columns (requires TD-1 relational migration first). Alternative: integrate Wagtail's search backend with PostgreSQL full-text search. For now, document the limitation.
**Dependencies**: TD-1 (relational migration) to store searchable fields in indexed columns
**Target Milestone**: After TD-1 relational migration
**Related ADRs**: ADR-13 (Substring Search Over Full-Text Indexing)
**Reference**: `backend/researchers/services/archive_service.py:189-217` — `filter_items()` search logic

---

## Low Priority

### TD-9: Missing App Router Error Boundaries

**Priority**: Low
**Impact**: No custom `error.js` or `not-found.js` files in the App Router. Unhandled errors render Next.js default error pages, which do not match the academic branding. Navigation to non-existent routes shows a generic 404.
**Estimated Remediation Effort**: Small (create 2 files + styling)
**Recommended Solution**: Create `app/error.js` (with branded error UI and retry button), `app/not-found.js` (with branded 404 page and link back to home).
**Dependencies**: None
**Target Milestone**: Before production launch
**Reference**: No `error.js` or `not-found.js` exists in `frontend/app/`

---

### TD-10: Dead filtered-items Endpoint

**Priority**: Low
**Impact**: Dead code in the backend. Increases maintenance surface and potential confusion for new developers. The endpoint is defined, tested, and cached but never called.
**Estimated Remediation Effort**: Small (remove view, URL pattern, and service function)
**Recommended Solution**: Remove `researcher_section_filtered_items` view from `views.py`, remove URL pattern from `urls.py`, remove `get_researcher_filtered_items` from `archive_service.py`. Verify no external consumers first (confirmed zero frontend usage on 2026-05-29).
**Dependencies**: Must verify no external API consumers (API is public)
**Target Milestone**: Next cleanup cycle
**Reference**: `backend/researchers/views.py:15-41`, `backend/backend/urls.py:31-34`

---

### TD-11: Missing Background Pattern Image

**Priority**: Low
**Impact**: The background pattern referenced in `globals.css` and three documentation files does not exist in the repository. The fallback background color renders correctly, but the intended visual design is incomplete.
**Estimated Remediation Effort**: Trivial (provide the image file or update CSS to remove the reference)
**Recommended Solution**: Place `rri-pattern.png` at `frontend/public/assets/background/rri-pattern.png` and verify it renders correctly. If the pattern is intentionally absent, remove the reference from CSS and update documentation.
**Dependencies**: Requires the original image asset
**Target Milestone**: Before production launch
**Reference**: `frontend/README.md:225`, `README.md:19`, AGENTS.md:61

---

### TD-12: Phantom components.json Reference

**Priority**: Low
**Impact**: `frontend/README.md:221` references `components.json` (shadcn/ui config) which does not exist in the repository. This is misleading for developers trying to understand the UI component setup.
**Estimated Remediation Effort**: Trivial (remove the reference or create the file)
**Recommended Solution**: Remove the reference from `frontend/README.md` since the project uses a manually created `ui/card.jsx` rather than shadcn/ui CLI-generated components.
**Dependencies**: None
**Target Milestone**: Immediate (documentation cleanup)

---

### TD-13: .dockerignore Files Without Dockerfiles

**Priority**: Low
**Impact**: Confusing repository state. Two `.dockerignore` files exist (in `backend/` and `frontend/`) but no `Dockerfile` or `docker-compose.yml` exists. These files were left behind when Docker was removed (commit `ced6c23`).
**Estimated Remediation Effort**: Trivial (remove files or implement Docker)
**Recommended Solution**: If Docker will be implemented (TD-6), keep the files. Otherwise, remove them to avoid confusion.
**Dependencies**: TD-6 decision
**Target Milestone**: Resolved by TD-6

---

### TD-14: Redis Listed in Requirements But LocMem Fallback

**Priority**: Low
**Impact**: Redis is a declared dependency in `requirements.txt` and documented as the production cache backend, but the code gracefully falls back to LocMemCache when `REDIS_URL` is not set. Production deployments not setting `REDIS_URL` lose shared caching across workers.
**Estimated Remediation Effort**: Trivial (document in deployment guide)
**Recommended Solution**: In production deployment documentation, add a prominent note: "Set `REDIS_URL` or each Gunicorn worker will have its own independent cache, causing inconsistent behavior and wasted memory." Consider making Redis required in production settings.
**Dependencies**: None
**Target Milestone**: Resolved by production deployment documentation
**Reference**: `backend/backend/settings/base.py:254-271`

---

### TD-15: No Rate Limiting or Usage Analytics on Public API

**Priority**: Low
**Impact**: The public API has no rate limiting, authentication, or usage tracking. Cannot identify abusive consumers or gather usage metrics. Mitigated by aggressive server-side caching.
**Estimated Remediation Effort**: Small (add Django rate limiting middleware)
**Recommended Solution**: Add `django-ratelimit` or a custom middleware for `/api/` routes. For analytics, add request counting to the structured logging (`logger.info` with endpoint metadata). Not urgent while the API is not public.
**Dependencies**: None
**Target Milestone**: Before public API announcement
**Related ADRs**: ADR-9 (No Authentication on Public API)

---

### TD-16: Static Docs/Archive Directory (8 Historical Documents)

**Priority**: Low
**Impact**: 8 historical documents in `docs/archive/` totaling ~2,900 lines. All are marked as stale. They document bugs that are already fixed and plans that are already executed. They serve as institutional memory but increase reading volume for new developers.
**Estimated Remediation Effort**: Small (add archive index + prune irrelevant docs)
**Recommended Solution**: Add `docs/archive/README.md` explaining what each document contains and why it's preserved. Consider removing documents that contain only debugging commands and quick-fix instructions (QUICK_REFERENCE.md, BACKGROUND_SETUP.md) since their fixes are already applied.
**Dependencies**: None
**Target Milestone**: Next documentation cleanup cycle

---

## Quick Wins (Low Effort, High Value)

These items can be resolved in a single session and provide immediate benefit:

| ID | Item | Estimated Effort |
|----|------|-----------------|
| TD-10 | Remove dead filtered-items endpoint | 30 minutes |
| TD-12 | Fix phantom components.json reference | 5 minutes |
| TD-13 | Resolve .dockerignore confusion | 5 minutes |
| TD-11 | Provide or remove background pattern reference | 15 minutes |
| TD-14 | Document Redis requirement prominently | 10 minutes |

---

## Cross-Reference Matrix

| Debt ID | Related ADRs | Related Documents | Source Files |
|---------|-------------|-------------------|--------------|
| TD-1 | ADR-2, ADR-14 | pagination-architecture.md:174-186 | `archive_service.py:87-121` |
| TD-2 | ADR-11 | caching-architecture.md | `views.py:16`, `archive_views.py:52,79,106,133` |
| TD-3 | ADR-6 | sqlite-to-mariadb.md | `migrations/0001_initial.py` |
| TD-4 | ADR-3 | — | `frontend/app/`, `frontend/components/` |
| TD-5 | ADR-8 | endpoints.md | `backend/backend/urls.py:29-61` |
| TD-6 | ADR-5 | — | `backend/.dockerignore`, `frontend/.dockerignore` |
| TD-7 | — | — | — |
| TD-8 | ADR-13 | — | `archive_service.py:189-217` |
| TD-9 | — | — | `frontend/app/` |
| TD-10 | — | endpoints.md:295 | `views.py:15-41`, `urls.py:31-34` |
| TD-11 | — | system-overview.md | `README.md:19`, `frontend/README.md:225` |
| TD-12 | — | — | `frontend/README.md:221` |
| TD-13 | ADR-5 | — | `backend/.dockerignore`, `frontend/.dockerignore` |
| TD-14 | — | caching-architecture.md | `base.py:254-271` |
| TD-15 | ADR-9 | endpoints.md:481-487 | — |
| TD-16 | — | docs/README.md:154-166 | `docs/archive/` |
