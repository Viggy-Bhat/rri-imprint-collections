# RRI Imprint Collections — Documentation Hub

> **Purpose**: Central documentation index and navigation hub for the RRI Imprint Collections project.
> **Audience**: All contributors — developers, deployment engineers, maintainers, system administrators.
> **Prerequisites**: Reading the root [README.md](../README.md) for project overview.

---

## Documentation Hierarchy

```
docs/
├── README.md                              <-- YOU ARE HERE
│
├── api/                                   (2 files)
│   ├── README.md                          Forthcoming (Phase A) — API section index
│   └── endpoints.md                       Current — complete API endpoint reference
│
├── architecture/                          (2 files, expanding to 8)
│   ├── README.md                          Current — architecture section index (created Phase B)
│   ├── system-overview.md                 Current — high-level system architecture (expanded to ~200 lines)
│   ├── pagination-architecture.md         Current — pagination & archive design (214 lines)
│   ├── data-flow.md                       Forthcoming (Phase B)
│   ├── wagtail-content-architecture.md    Forthcoming (Phase B)
│   ├── database-architecture.md           Forthcoming (Phase B)
│   ├── caching-architecture.md            Forthcoming (Phase B)
│   └── decisions.md                       Forthcoming (Phase B)
│
├── archive/                               (9 files — historical snapshots)
│   ├── BACKGROUND_SETUP.md                Stale — initial debugging context (114 lines)
│   ├── IMPLEMENTATION_SUMMARY.md          Stale — Phase 1 implementation notes (304 lines)
│   ├── INVESTIGATION_FINDINGS_DETAILED.md Stale — smart content investigation (331 lines)
│   ├── plan.md                            Stale — original smart content fix plan (380 lines)
│   ├── QUICK_REFERENCE.md                 Stale — debugging commands reference (201 lines)
│   ├── SMART_CONTENT_DEBUG_ANALYSIS.md    Stale — smart content root cause (335 lines)
│   ├── SMART_CONTENT_FIX_SUMMARY.md       Stale — fix summary & verification (236 lines)
│   ├── structure.md                       Stale — smart content StreamField structure (294 lines)
│   └── block-history/                     Stale — legacy block definitions
│       └── blocks_structblock_legacy.py   Pre-migration legacy code snapshot
│
├── backend/                               (empty — forthcoming)
│   └── .gitkeep
│
├── deployment/                            (empty — forthcoming)
│   └── .gitkeep
│
├── frontend/                              (empty — forthcoming)
│   └── .gitkeep
│
├── future-roadmap/                        (empty — forthcoming)
│   └── .gitkeep
│
├── runtime/                               (empty — forthcoming)
│   └── .gitkeep
│
├── setup/                                 (1 file)
│   └── setup-local.md                     Current — local development setup (112 lines)
│
├── troubleshooting/                       (empty — forthcoming)
│   └── .gitkeep
│
└── migrations/                            (1 file)
    └── sqlite-to-mariadb.md               Current — SQLite to MariaDB migration history (48 lines)
```

---

## Where Developers Should Start

| Scenario | Start Here |
|---|---|
| If you're new to the project | [Root README.md](../README.md) then [System Overview](architecture/system-overview.md) |
| If you're setting up locally | [Local Setup Guide](setup/setup-local.md) |
| If you're deploying to production | [Root README.md deployment section](../README.md#deployment-guide) then [Security guide](backend/security.md) *(forthcoming)* |
| If you're debugging API issues | [API Endpoints Reference](api/endpoints.md) |
| If you're changing StreamField blocks | [AGENTS.md](../AGENTS.md) — "After ANY StreamField block change, migrate immediately" |
| If you're building frontend components | [System Overview](architecture/system-overview.md) then [Data Flow](architecture/data-flow.md) *(forthcoming)* |
| If you're managing database migrations | [Migration History](migrations/sqlite-to-mariadb.md) |
| If you're looking at historical context | [Archive](archive/) — historical investigation documents |

---

## Onboarding Paths

### New Developer

1. **[Root README.md](../README.md)** — Project overview, tech stack, completed work summary, local dev commands.
2. **[System Architecture Overview](architecture/system-overview.md)** — Headless CMS pattern, Django/Next.js interaction, StreamField data model at a glance.
3. **[Local Development Setup](setup/setup-local.md)** — Prerequisites, virtual environment, `npm install`, database setup, running both servers.
4. **[Backend Project Structure](backend/project-structure.md)** *(forthcoming — Phase C)* — Django project layout, app organization, settings hierarchy.
5. **[Data Models](backend/models.md)** *(forthcoming — Phase C)* — `ResearcherPage`, `ResearcherSectionPage`, `SiteSettings`, StreamField block definitions.

### Deployment Engineer

1. **[Root README.md](../README.md)** — Deployment section: Linux setup, environment variables, gunicorn, nginx, SSL.
2. **[Settings Architecture](backend/settings-architecture.md)** *(forthcoming — Phase C)* — `base.py`, `dev.py`, `production.py` hierarchy, every environment variable and its effect.
3. **[Security Hardening](backend/security.md)** *(forthcoming — Phase C)* — `ApiSecurityHeadersMiddleware`, CORS, CSRF, HSTS, session security.
4. **[Deployment Guides](deployment/)** *(forthcoming — directory empty, not yet written)* — Platform-specific deployment instructions.
5. **[Caching Architecture](architecture/caching-architecture.md)** *(forthcoming — Phase B)* — Redis vs LocMem fallback, cache invalidation strategy.

### Maintainer

1. **[AGENTS.md](../AGENTS.md)** — Critical rules: StreamField migration discipline, settings switching, custom API endpoints, frontend conventions.
2. **[Architecture Decisions](architecture/decisions.md)** *(forthcoming — Phase B)* — Why headless CMS was chosen, why SQLite was abandoned, consolidation of migrations, pagination design rationale.
3. **[API Endpoints Reference](api/endpoints.md)** — All endpoints: Wagtail built-in, custom views, archive pagination, filtered item search.
4. **[Services & Utilities](backend/services-and-utilities.md)** *(forthcoming — Phase C)* — Business logic layer (`archive_service.py`), utility modules (text, mapping, extraction, sorting, pagination).
5. **[Migration History](migrations/sqlite-to-mariadb.md)** — Why SQLite failed, StreamField schema mismatch recovery, consolidated `0001_initial.py`.

### System Administrator

1. **[Settings Architecture](backend/settings-architecture.md)** *(forthcoming — Phase C)* — Complete environment variable reference, production enforcement.
2. **[Security Hardening](backend/security.md)** *(forthcoming — Phase C)* — Security headers, SSL configuration, allowed hosts, CORS origins.
3. **[Deployment Guides](deployment/)** *(forthcoming — directory empty, not yet written)* — Server provisioning, nginx reverse proxy, SSL certificates.
4. **[Runtime Operations](runtime/)** *(forthcoming — directory empty, not yet written)* — Monitoring, logging, backup/restore procedures.
5. **[Database Operations](migrations/)** — Migration history, SQLite to MariaDB transition, operational notes.

---

## Documentation Map

### api/

| File | Status | Last Updated | Lines | Notes |
|---|---|---|---|---|
| README.md | Forthcoming (Phase A 2026-05-29) | — | — | Section index; being created this phase |
| endpoints.md | Current (Phase A 2026-05-29) | 2026-04-22 | 185 | Comprehensive; being expanded to ~350 lines this phase. Covers Wagtail Pages API, custom image/settings endpoints, archive pagination, filtered items, section count |

### architecture/

| File | Status | Last Updated | Lines | Notes |
|---|---|---|---|---|
| README.md | Current (Phase B 2026-05-29) | 2026-05-29 | — | Section index with 7 documents, onboarding paths |
| system-overview.md | Current (Phase B 2026-05-29) | 2026-05-29 | ~200 | Headless CMS pattern, tech stack table with rationale, data model class diagram, StreamField hierarchy, API flow, rendering pipeline, dev vs production comparison, known constraints |
| pagination-architecture.md | Current | 2026-04-22 | 214 | Server-side filtering, pagination, type-specific endpoints. Excellent detail; no changes needed |
| data-flow.md | Forthcoming (Phase B) | — | — | Full request lifecycle: Wagtail admin -> DB -> API -> Next.js -> React component |
| wagtail-content-architecture.md | Forthcoming (Phase B) | — | — | Page models, StreamField block hierarchy, content authoring patterns |
| database-architecture.md | Forthcoming (Phase B) | — | — | Schema design, StreamField JSON storage, model relationships |
| caching-architecture.md | Forthcoming (Phase B) | — | — | Redis dependency, LocMem fallback, cache key strategy |
| decisions.md | Forthcoming (Phase B) | — | — | Architecture Decision Records: headless CMS choice, SQLite abandonment, migration consolidation |

### backend/

| File | Status | Last Updated | Lines | Notes |
|---|---|---|---|---|
| README.md | Forthcoming (Phase C) | — | — | Section index |
| project-structure.md | Forthcoming (Phase C) | — | — | Django app layout, module responsibilities, import conventions |
| settings-architecture.md | Forthcoming (Phase C) | — | — | `base.py`/`dev.py`/`production.py` hierarchy, all environment variables |
| middleware.md | Forthcoming (Phase C) | — | — | `ApiSecurityHeadersMiddleware` detail, request/response flow |
| security.md | Forthcoming (Phase C) | — | — | CORS, CSRF, HSTS, session security, deployment hardening checklist |
| models.md | Forthcoming (Phase C) | — | — | `ResearcherPage`, `ResearcherSectionPage`, `SiteSettings`, StreamField blocks |
| services-and-utilities.md | Forthcoming (Phase C) | — | — | `archive_service.py`, text/mapping/extraction/sorting/pagination utilities |
| wagtail-configuration.md | Forthcoming (Phase C) | — | — | Wagtail hooks (`wagtail_hooks.py`), admin customization, Draftail extensions |

### archive/

| File | Status | Last Updated | Lines | Notes |
|---|---|---|---|---|
| BACKGROUND_SETUP.md | Stale (historical reference) | 2026-04-22 | 114 | Initial smart content debugging context. Outdated — code has been fixed |
| IMPLEMENTATION_SUMMARY.md | Stale (historical reference) | 2026-04-22 | 304 | Phase 1 implementation notes. Historical only |
| INVESTIGATION_FINDINGS_DETAILED.md | Stale (historical reference) | 2026-04-22 | 331 | Detailed smart content investigation. Bug has been fixed; kept for reference |
| plan.md | Stale (historical reference) | 2026-04-22 | 380 | Original smart content fix plan. Completed — archive only |
| QUICK_REFERENCE.md | Stale (historical reference) | 2026-04-22 | 201 | Debugging commands and queries. Outdated workflow |
| SMART_CONTENT_DEBUG_ANALYSIS.md | Stale (historical reference) | 2026-04-22 | 335 | Root cause analysis of smart content issue. Fixed — historical reference |
| SMART_CONTENT_FIX_SUMMARY.md | Stale (historical reference) | 2026-04-22 | 236 | Fix summary and verification steps. Completed |
| structure.md | Stale (historical reference) | 2026-04-22 | 294 | Smart content StreamField structure mapping. Schema has since changed |
| block-history/blocks_structblock_legacy.py | Stale (historical reference) | 2026-04-22 | — | Legacy StructBlock definitions from before migration consolidation |

### deployment/

| File | Status | Last Updated | Lines | Notes |
|---|---|---|---|---|
| (directory) | Forthcoming | — | — | Empty. Needs: deployment guides for various platforms, nginx configuration details, gunicorn tuning, process supervision |

### frontend/

| File | Status | Last Updated | Lines | Notes |
|---|---|---|---|---|
| (directory) | Forthcoming | — | — | Empty. Needs: component architecture, routing guide, data fetching patterns, styling conventions, image handling details |

### future-roadmap/

| File | Status | Last Updated | Lines | Notes |
|---|---|---|---|---|
| (directory) | Forthcoming | — | — | Empty. Needs: planned features, technical debt items, architecture evolution plans |

### migrations/

| File | Status | Last Updated | Lines | Notes |
|---|---|---|---|---|
| sqlite-to-mariadb.md | Current | 2026-04-22 | 48 | SQLite abandonment rationale. Needs expansion with wagtail-migration-issues.md and best-practices.md |

### runtime/

| File | Status | Last Updated | Lines | Notes |
|---|---|---|---|---|
| (directory) | Forthcoming | — | — | Empty. Needs: monitoring setup, logging configuration, backup/restore procedures, health check endpoints |

### setup/

| File | Status | Last Updated | Lines | Notes |
|---|---|---|---|---|
| setup-local.md | Current | 2026-04-22 | 112 | Local development prerequisites and commands. Accurate for current dev workflow |

### troubleshooting/

| File | Status | Last Updated | Lines | Notes |
|---|---|---|---|---|
| (directory) | Forthcoming | — | — | Empty. Needs: common error scenarios, diagnostic procedures, resolution steps |

---

## Missing Documentation

### Empty Directories (no content beyond `.gitkeep`)

| Directory | Priority | What's Needed |
|---|---|---|
| `docs/deployment/` | High | Platform-specific deployment guides, nginx configuration details, gunicorn tuning, process supervision (systemd), container deployment options |
| `docs/frontend/` | High | Component architecture map, App Router routing guide, data fetching patterns (`wagtailApi.js`, `researcherApi.js`), image handling (`ProtectedImage`, URL prefixing), styling conventions (Tailwind v4, `cn()`), `formatDate.js` reference |
| `docs/runtime/` | Medium | Monitoring and observability setup, logging configuration, backup/restore procedures, health check endpoint documentation |
| `docs/troubleshooting/` | Medium | Common error scenarios: CORS misconfiguration, missing `rri-pattern.png`, StreamField migration mismatches, Wagtail publish state issues, environment variable troubleshooting |
| `docs/future-roadmap/` | Low | Planned features, known technical debt items, architecture evolution plans, upgrade guides (Next.js, Django, Wagtail) |

### Missing Files in Populated Directories

| Missing File | Directory | Priority | Rationale |
|---|---|---|---|
| `wagtail-migration-issues.md` | `docs/migrations/` | High | Documents the worst bug in this repo: StreamField block changes without migration regeneration. Covers symptoms, diagnosis, fix procedure, prevention |
| `best-practices.md` | `docs/migrations/` | Medium | Migration workflow: when to `makemigrations`, how to verify schema alignment, testing migrations before deployment, handling merged migration trees |
| `README.md` | `docs/archive/` | Low | Index explaining what each historical document contains, when it was relevant, and why it's archived |

### Missing Cross-References

- `docs/api/endpoints.md` does not link to `docs/architecture/pagination-architecture.md` for archive endpoint design rationale
- `docs/setup/setup-local.md` does not link to `docs/backend/settings-architecture.md` for environment variable details
- `docs/architecture/system-overview.md` does not link to `docs/architecture/data-flow.md` (forthcoming) for detailed request lifecycle
- Root `README.md` links to `docs/` but does not point to this index as the primary documentation entry point
- `AGENTS.md` describes migration history but does not reference `docs/migrations/sqlite-to-mariadb.md`
- No document cross-references `backend/README.md` and `frontend/README.md` as complementary sub-project references

---

## Duplicate Information

Information appears in multiple places, creating maintenance burden. The canonical source should eventually be `docs/`; other files should link here.

### Deployment Information
- **Root README.md** — lines 116-252: Full deployment guide (server setup, env config, gunicorn, nginx, SSL)
- **backend/README.md** — contains deployment-related sections
- **docs/setup/setup-local.md** — overlaps with dev setup
- **Resolution**: Root README.md should be trimmed to quick reference + link to `docs/deployment/` (once written)

### API Endpoints
- **AGENTS.md** — lines 28-35: Lists all custom API endpoints
- **docs/api/endpoints.md** — Full endpoint reference with request/response examples
- **backend/README.md** — Contains endpoint summaries
- **Resolution**: `docs/api/endpoints.md` is canonical; others should link to it

### Architecture Overview
- **AGENTS.md** — lines 5-9: Architecture at a Glance
- **docs/architecture/system-overview.md** — Full architecture document
- **Root README.md** — lines 80-86: Architecture and Data Flow section
- **Resolution**: `docs/architecture/system-overview.md` is canonical; AGENTS.md and root README should link

### Local Setup Instructions
- **docs/setup/setup-local.md** — Dedicated setup guide (112 lines)
- **backend/README.md** — Backend-specific setup
- **frontend/README.md** — Frontend-specific setup
- **Root README.md** — lines 97-114: Local Development section
- **AGENTS.md** — lines 102-118: Dev Commands section
- **Resolution**: Consolidate quick start in root README; detailed steps in `docs/setup/`; sub-project READMEs provide module-specific context only

---

## Verification Notes

Known issues from codebase analysis that affect documentation accuracy:

### Missing Assets
- **`frontend/public/assets/background/rri-pattern.png`** — Referenced in `globals.css` and documented in root README (line 19, 265-266) and AGENTS.md (line 61) but the file does not exist in the repository. The fallback background color renders without the pattern. Documentation should note this as a setup step.

### Environment File Bug
- **`frontend/.env.example` line 2** — Contains concatenation bug: `NODE_ENV=productionNEXT_PUBLIC_WAGTAIL_BASE_URL=http://127.0.0.1:8000`. Two environment variables are on one line without a newline separator. Fixed in documentation but the source file still has the bug.

### Incorrect Documentation References
- **`frontend/README.md` line 221** — References `components.json` which does not exist in the repository. This is likely a holdover from a template or a planned file that was never created.

### Missing App Router Files
- No `error.js` or `not-found.js` files exist in the App Router. Next.js 16 conventions recommend these for graceful error handling and custom 404 pages. Documentation should note this gap.

### Containerization Gap
- `.dockerignore` files exist at the repository root but no `Dockerfile` or `docker-compose.yml` files are present. Container deployment is not documented. Either the `.dockerignore` files should be removed or container support should be added with corresponding documentation.

### Migration History Lost
- All migrations were consolidated into a single `backend/researchers/migrations/0001_initial.py`. Prior migration files (0002 through 0013+) are lost. The smart content/gallery schema mismatch fix was performed but the incremental migration history that documented the evolution is no longer available. `docs/migrations/sqlite-to-mariadb.md` covers the rationale but not the sequence of schema changes.

### Cache Configuration Gap
- Redis is listed in `backend/requirements.txt` but the Django cache configuration falls back to `LocMemCache` when `REDIS_URL` is not set. Production deployment documentation should emphasize setting `REDIS_URL` and document the performance implications of the LocMem fallback.

### Test Directory Present Without Framework
- `backend/researchers/tests/` contains 43 tests across 5 files, but no test runner configuration or CI pipeline is documented. AGENTS.md (line 67) explicitly states "No test framework is configured" for the frontend; the backend test situation is different but undocumented.

---

## Recommended Additional Documents

Beyond the documents planned for Phase A, B, and C, the following should eventually be added:

### Complete Documentation Sections

| Section | Documents Needed |
|---|---|
| `docs/frontend/` | `component-architecture.md`, `routing-guide.md`, `data-fetching.md`, `styling-conventions.md`, `image-handling.md`, `date-formatting.md`, `error-handling.md` |
| `docs/deployment/` | `production-checklist.md`, `nginx-configuration.md`, `gunicorn-tuning.md`, `systemd-service.md`, `ssl-certificates.md`, `docker-deployment.md`, `environment-variable-reference.md` |
| `docs/troubleshooting/` | `common-errors.md`, `cors-issues.md`, `migration-problems.md`, `build-failures.md`, `api-connectivity.md`, `database-connection.md` |
| `docs/runtime/` | `monitoring.md`, `logging.md`, `backup-and-restore.md`, `health-checks.md`, `performance-tuning.md`, `incident-response.md` |

### Additional Individual Documents

| Document | Location | Rationale |
|---|---|---|
| `wagtail-migration-issues.md` | `docs/migrations/` | The worst bug in this repo needs a dedicated troubleshooting guide |
| `best-practices.md` | `docs/migrations/` | Migration workflow, verification, and prevention guidelines |
| `README.md` | `docs/archive/` | Index for the 8 historical documents so new developers can understand what's archived and why |
| `testing.md` | `docs/backend/` | Document the existing 43 backend tests: what's covered, how to run, what's missing |
| `dependency-management.md` | `docs/runtime/` | `requirements.txt` freeze policy, npm dependency strategy, vulnerability scanning |

---

*This index was created as part of Phase A documentation effort (2026-05-29). It reflects the repository state as of that date and flags all known documentation gaps. Update this document when new documentation is added or existing documents are substantially revised.*
