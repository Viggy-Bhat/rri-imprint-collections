# Migration Documentation

> **Purpose**: Index of migration documentation — SQLite-to-MariaDB transition, Wagtail migration issues, post-mortems, best practices, and recovery procedures.
> **Audience**: Backend developers, database administrators, anyone modifying models or StreamField blocks.
> **Prerequisites**: [Backend models](../backend/models.md), [Database architecture](../architecture/database-architecture.md).
> **Related**: [AGENTS.md](../../AGENTS.md) — critical migration rule.

## Documents

- **[sqlite-to-mariadb.md](./sqlite-to-mariadb.md)** — SQLite to MariaDB transition: rationale, data transfer, final architecture
- **[wagtail-migration-issues.md](./wagtail-migration-issues.md)** — POST-MORTEM: StreamField schema mismatch bug — the worst bug in this project
- **[best-practices.md](./best-practices.md)** — Migration workflow, verification checklist, rollback procedures, prevention guidelines

## Critical Rule (from AGENTS.md)

**After ANY change to `blocks.py` or `models.py`, immediately run:**
```bash
python manage.py makemigrations
python manage.py migrate
```

This rule exists because the most severe bug in this project was caused by updating block definitions without regenerating migrations.

## Quick Nav

- **Need to understand the migration history?** → [sqlite-to-mariadb.md](./sqlite-to-mariadb.md)
- **Debugging "undefined" or missing fields in API?** → [wagtail-migration-issues.md](./wagtail-migration-issues.md)
- **About to make a model/block change?** → [best-practices.md](./best-practices.md)
