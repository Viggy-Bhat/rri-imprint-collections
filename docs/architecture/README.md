# Architecture Documentation Index

> **Purpose**: Index and navigation hub for architecture documentation covering the RRI Imprint Collections headless CMS system. Provides entry points for understanding system design, data flow, and technical decisions.
> **Audience**: All contributors — developers, maintainers, system architects, and reviewers evaluating architectural changes.
> **Prerequisites**: [docs/README.md](../README.md) for the complete documentation hierarchy.
> **Related**: [AGENTS.md](../../AGENTS.md) for critical development rules, [API Endpoints](../api/endpoints.md) for endpoint reference.

---

## Documents

| # | Document | Description |
|---|----------|-------------|
| 1 | [system-overview.md](system-overview.md) | High-level architecture: headless CMS pattern, tech stack, data model, API flow, rendering pipeline, dev vs production, and known constraints. |
| 2 | [data-flow.md](data-flow.md) | Full request lifecycle: from Wagtail admin content authoring through database storage, API serialization, and Next.js Server Component rendering to the browser. |
| 3 | [wagtail-content-architecture.md](wagtail-content-architecture.md) | Page models (`ResearcherPage`, `ResearcherSectionPage`, `HomePage`), StreamField block hierarchy, content authoring patterns, and CMS configuration details. |
| 4 | [database-architecture.md](database-architecture.md) | Schema design, StreamField JSON storage in MariaDB, model relationships, migration history, and database operations. |
| 5 | [caching-architecture.md](caching-architecture.md) | Redis vs LocMem fallback strategy, cache key design, TTL configuration, cache invalidation approach, and performance implications. |
| 6 | [pagination-architecture.md](pagination-architecture.md) | Server-side filtering, sorting, and pagination design for archive endpoints (publications, guidance, news). |
| 7 | [decisions.md](decisions.md) | Architecture Decision Records (ADRs): why headless CMS, why SQLite was abandoned, migration consolidation rationale, pagination design choices. |

---

## Reading Order

**New developers** should start with [system-overview.md](system-overview.md) then [data-flow.md](data-flow.md).

**Those working on content models** should read [wagtail-content-architecture.md](wagtail-content-architecture.md) then [database-architecture.md](database-architecture.md).

**Those debugging performance** should start with [caching-architecture.md](caching-architecture.md) then [pagination-architecture.md](pagination-architecture.md).

**Those evaluating architectural changes** should review [decisions.md](decisions.md) first.
