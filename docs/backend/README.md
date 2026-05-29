> **Purpose**: Index of backend documentation covering Django project structure, settings, models, services, middleware, Wagtail configuration, and security.
> **Audience**: Backend developers, Django/Wagtail engineers.
> **Prerequisites**: [System architecture overview](../architecture/system-overview.md), [docs/README.md](../README.md).
> **Related**: [backend/README.md](../../backend/README.md) for quick-start and dev commands.

## Documents

- **[project-structure.md](./project-structure.md)** — Django project layout, app responsibilities, layer boundaries, dependency graph
- **[settings-architecture.md](./settings-architecture.md)** — base.py / dev.py / production.py hierarchy, environment variable reference
- **[models.md](./models.md)** — ResearcherPage, ResearcherSectionPage, SiteSettings, StreamField block reference
- **[services-and-utilities.md](./services-and-utilities.md)** — Service layer business logic, utility modules, management commands
- **[middleware.md](./middleware.md)** — Middleware stack and ApiSecurityHeadersMiddleware
- **[wagtail-configuration.md](./wagtail-configuration.md)** — Wagtail hooks, admin customization, Draftail extensions
- **[security.md](./security.md)** — Production security hardening, CORS, CSRF, HSTS, SSL

## Key Rules

- **[Critical] After ANY change to blocks.py or models.py, run `makemigrations` + `migrate` immediately** — see [AGENTS.md](../../AGENTS.md)
- The backend runs at `http://127.0.0.1:8000` in development (Wagtail admin at `/admin/`)
- Always use `DJANGO_SETTINGS_MODULE=backend.settings.production` for production

## Quick Nav

- **Want to understand the code layout?** → [project-structure.md](./project-structure.md)
- **Need to add an environment variable?** → [settings-architecture.md](./settings-architecture.md)
- **Need to add a new field to ResearcherPage?** → [models.md](./models.md)
- **Debugging API responses?** → [services-and-utilities.md](./services-and-utilities.md) + [../api/endpoints.md](../api/endpoints.md)
- **Doing a production deployment?** → [security.md](./security.md)
