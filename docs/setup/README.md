# Setup Documentation

> **Purpose**: Complete setup guides for the RRI Imprint Collections project — from a fresh clone to a running development environment.
> **Audience**: Developers and operators who have never seen this repository.
> **Prerequisites**: Basic familiarity with Linux command line, Python, and Node.js.

## Documents

| Document | Audience | Description |
|----------|----------|-------------|
| [getting-started.md](./getting-started.md) | New developers | Quick-start path (15 minutes) |
| [backend-setup.md](./backend-setup.md) | Developers | Python virtual environment, Django, Wagtail |
| [frontend-setup.md](./frontend-setup.md) | Developers | Node.js, Next.js, Tailwind |
| [database-setup.md](./database-setup.md) | Developers/DBAs | MariaDB installation, user creation, SQLite fallback |
| [environment-variables.md](./environment-variables.md) | All | Complete variable reference with defaults and sources |

## Quick-Start Path

If you want the fastest path to a running dev environment:

1. [getting-started.md](./getting-started.md) — 15-minute quick start
2. [database-setup.md](./database-setup.md) — if using MariaDB (skip for SQLite)
3. [environment-variables.md](./environment-variables.md) — reference when something doesn't work

## Technology Versions (Verified)

| Component | Version | Notes |
|-----------|---------|-------|
| Django | 5.2.14 | Pinned in `backend/requirements.txt` |
| Wagtail | 7.4 | CMS, pinned in `backend/requirements.txt` |
| Python | 3.10+ | Implicit — no `.python-version` or `pyproject.toml` specifier |
| Next.js | 16.2.3 | Pinned in `frontend/package.json` |
| React | 19.2.4 | Pinned in `frontend/package.json` |
| Tailwind CSS | v4 | `@tailwindcss/postcss` plugin |
| MariaDB | 10.6+ | mysqlclient 2.2.7 driver |
| Redis | Optional | redis 5.3.1, used only if `REDIS_URL` is set |
| Node.js | 18.18+ | Implicit minimum — Next.js 16 requires it |

## Related Documentation

- [System architecture overview](../architecture/system-overview.md) — Understand the headless CMS pattern
- [Data flow](../architecture/data-flow.md) — How data moves from Wagtail to the frontend
- [Runtime operations](../runtime/README.md) — Day-to-day operational tasks
- [Migration documentation](../migrations/README.md) — Database migration guides

## Deprecated

The previous setup guide at [setup-local.md](./setup-local.md) is deprecated. All content has been migrated to the documents listed above.
