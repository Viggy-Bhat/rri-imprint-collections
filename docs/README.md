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
├── runtime/                               (3 files)
│   ├── README.md                          Current — section index
│   ├── operations.md                      Current — daily ops, cache, logging (~350 lines)
│   └── backup-and-restore.md              Current — backup/restore procedures (~230 lines)
│
├── setup/                                 (7 files)
│   ├── README.md                          Current — section index
│   ├── getting-started.md                 Current — 15-minute quick start (~200 lines)
│   ├── backend-setup.md                   Current — detailed backend setup (~300 lines)
│   ├── frontend-setup.md                  Current — frontend installation (~200 lines)
│   ├── database-setup.md                  Current — MariaDB & SQLite setup (~260 lines)
│   ├── environment-variables.md           Current — 28-variable reference (~350 lines)
│   └── setup-local.md                     Deprecated — redirects to new docs
│
├── troubleshooting/                       (empty — forthcoming)
│   └── .gitkeep
│
└── migrations/                            (4 files)
    ├── README.md                          Current — section index
    ├── sqlite-to-mariadb.md               Current — full migration guide (~390 lines)
    ├── best-practices.md                  Current — migration workflow & verification
    └── wagtail-migration-issues.md        Current — StreamField schema mismatch post-mortem
```

---

## Where Developers Should Start

| Scenario | Start Here |
|---|---|
| If you're new to the project | [Root README.md](../README.md) then [System Overview](architecture/system-overview.md) |
| If you're setting up locally | [Getting Started](setup/getting-started.md) then [Backend Setup](setup/backend-setup.md) |
| If you're configuring environment variables | [Environment Variables Reference](setup/environment-variables.md) |
| If you're debugging API issues | [API Endpoints Reference](api/endpoints.md) |
| If you're changing StreamField blocks | [AGENTS.md](../AGENTS.md) — "After ANY StreamField block change, migrate immediately" |
| If you're building frontend components | [System Overview](architecture/system-overview.md) then [Data Flow](architecture/data-flow.md) |
| If you're managing database migrations | [Migration Guide](migrations/sqlite-to-mariadb.md) |
| If you're handling day-to-day operations | [Runtime Operations](runtime/operations.md) |
| If you're looking at historical context | [Archive](archive/) — historical investigation documents |

---

## Onboarding Paths

### New Developer

1. **[Root README.md](../README.md)** — Project overview, tech stack, completed work summary, local dev commands.
2. **[System Architecture Overview](architecture/system-overview.md)** — Headless CMS pattern, Django/Next.js interaction, StreamField data model at a glance.
3. **[Getting Started](setup/getting-started.md)** — 15-minute quick-start: clone, venv, install, migrate, run both servers.
4. **[Backend Setup](setup/backend-setup.md)** — Detailed Django setup, virtual environment, dependencies, migrations.
5. **[Frontend Setup](setup/frontend-setup.md)** — Next.js dev server, environment config, project structure.
6. **[Environment Variables](setup/environment-variables.md)** — Complete reference of all 28 configuration variables.

### Deployment Engineer

1. **[Root README.md](../README.md)** — Deployment section: Linux setup, environment variables, gunicorn, nginx, SSL.
2. **[Settings Architecture](backend/settings-architecture.md)** — `base.py`, `dev.py`, `production.py` hierarchy, every environment variable and its effect.
3. **[Security Hardening](backend/security.md)** — `ApiSecurityHeadersMiddleware`, CORS, CSRF, HSTS, session security.
4. **[Caching Architecture](architecture/caching-architecture.md)** — Redis vs LocMem fallback, cache invalidation strategy.

### Maintainer

1. **[AGENTS.md](../AGENTS.md)** — Critical rules: StreamField migration discipline, settings switching, custom API endpoints, frontend conventions.
2. **[Architecture Decisions](architecture/decisions.md)** — Why headless CMS was chosen, why SQLite was abandoned, consolidation of migrations, pagination design rationale.
3. **[API Endpoints Reference](api/endpoints.md)** — All endpoints: Wagtail built-in, custom views, archive pagination, filtered item search.
4. **[Services & Utilities](backend/services-and-utilities.md)** — Business logic layer (`archive_service.py`), utility modules.
5. **[Migration Guide](migrations/sqlite-to-mariadb.md)** — Database migration, backup/restore, recovery procedures.

### System Administrator

1. **[Settings Architecture](backend/settings-architecture.md)** — Complete environment variable reference, production enforcement.
2. **[Security Hardening](backend/security.md)** — Security headers, SSL configuration, allowed hosts, CORS origins.
3. **[Runtime Operations](runtime/operations.md)** — Monitoring, logging, cache management, backup/restore procedures, day-to-day tasks.
4. **[Database Operations](migrations/sqlite-to-mariadb.md)** — Migration history, SQLite to MariaDB transition, recovery procedures.

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
| README.md | Current | 2026-05-29 | 28 | Section index with critical rule reminder |
| sqlite-to-mariadb.md | Current | 2026-05-29 | ~390 | Complete migration guide: safety checklists, backup procedures, walkthrough, fixture export/import, recovery, rollback |
| best-practices.md | Current | 2026-05-29 | 280 | Standard migration workflow, verification checklist, StreamField-specific guidance, prevention rules |
| wagtail-migration-issues.md | Current | 2026-05-29 | 277 | Complete post-mortem of the StreamField schema mismatch bug — symptoms, diagnosis, root cause, fix procedure, prevention |

### runtime/

| File | Status | Last Updated | Lines | Notes |
|---|---|---|---|---|
| README.md | Current | 2026-05-29 | ~35 | Section index with quick command reference |
| operations.md | Current | 2026-05-29 | ~350 | Daily operations, service health checks, cache management, dependency upgrades, logging/monitoring, content publishing workflow |
| backup-and-restore.md | Current | 2026-05-29 | ~230 | MariaDB/SQLite backup, Django fixture export/import, media file backup, automated backup scripts, restore procedures |

### setup/

| File | Status | Last Updated | Lines | Notes |
|---|---|---|---|---|
| README.md | Current | 2026-05-29 | ~40 | Section index with technology version table |
| getting-started.md | Current | 2026-05-29 | ~200 | 15-minute quick-start: clone, venv, install, migrate, run both servers |
| backend-setup.md | Current | 2026-05-29 | ~300 | Detailed Django setup: dependencies, settings hierarchy, seed data, verification |
| frontend-setup.md | Current | 2026-05-29 | ~200 | Next.js setup: dependencies, environment config, dev server, build, lint |
| database-setup.md | Current | 2026-05-29 | ~260 | MariaDB installation, user/database creation, SQLite fallback, charset config, WSL notes |
| environment-variables.md | Current | 2026-05-29 | ~350 | Complete 28-variable reference: required/optional, defaults, source files, purpose |
| setup-local.md | Deprecated | 2026-05-29 | 5 | Redirects to new documentation structure |

### troubleshooting/

| File | Status | Last Updated | Lines | Notes |
|---|---|---|---|---|
| (directory) | Forthcoming | — | — | Empty. Needs: common error scenarios, diagnostic procedures, resolution steps |

---

## Missing Documentation

### Empty Directories (no content beyond `.gitkeep`)

| Directory | Priority | What's Needed |
|---|---|---|
| `docs/deployment/` | High | Platform-specific deployment guides, nginx configuration details, gunicorn tuning, process supervision (systemd) |
| `docs/frontend/` | High | Component architecture map, App Router routing guide, data fetching patterns, image handling, styling conventions |
| `docs/troubleshooting/` | Medium | Common error scenarios, diagnostic procedures, resolution steps |
| `docs/future-roadmap/` | Low | Planned features, known technical debt items, architecture evolution plans, upgrade guides |

### Missing Files in Populated Directories

| Missing File | Directory | Priority | Rationale |
|---|---|---|---|
| `README.md` | `docs/archive/` | Low | Index explaining what each historical document contains, and why it's archived |

### Missing Cross-References

- Root `README.md` links to `docs/` but does not cross-reference specific documents in setup/ or runtime/
- `AGENTS.md` describes migration history but does not reference `docs/migrations/sqlite-to-mariadb.md`
- No document cross-references `backend/README.md` and `frontend/README.md` as complementary sub-project references

---

## Duplicate Information

Information appears in multiple places, creating maintenance burden. The canonical source should be `docs/`; other files should link here. The old `setup-local.md` has been deprecated in favor of the new setup/ documents.

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
