# SQLite to MariaDB Migration History

## Why SQLite Was Abandoned

SQLite served as the initial development database but presented two critical issues:

1. **Concurrency limitations** — SQLite locks the entire database during writes, causing failures when Wagtail's admin and API are accessed simultaneously.
2. **Wagtail migration conflicts** — SQLite's limited ALTER TABLE support caused Wagtail's auto-generated migrations to fail or produce incorrect schema changes, particularly for StreamField columns.

## Migration Stabilization

The migration history grew to 25+ files through iterative development and schema fixes. This was consolidated into a single `0001_initial.py` migration to:

- Eliminate migration dependency conflicts
- Provide a clean starting point for new deployments
- Remove the accumulated history of debugging migrations

## The StreamField Schema Mismatch Bug

The most significant bug in the project's history:

1. `SidebarItemBlock` in `blocks.py` defined `smart_content` and `gallery` sub-streams
2. The corresponding database migration did not include these fields
3. The API silently returned `undefined` for these fields
4. The frontend showed empty states despite content being authored in Wagtail

The fix required:
- Creating a targeted migration to add the missing fields
- Verifying the migration was applied to both dev and production databases
- Adding the "migrate immediately after block changes" rule to AGENTS.md

## Data Transfer

Content was transferred between databases using Django's `dumpdata`/`loaddata`:

```bash
python manage.py dumpdata --natural-foreign --natural-primary --indent 2 > clean_data.json
python manage.py loaddata clean_data.json
```

The `clean_data.json` fixture preserves all researcher pages, site settings, and media references.

## Final Architecture

- **Database**: MariaDB with `utf8mb4` charset for full Unicode support
- **Connection**: Configured via `DATABASE_URL` environment variable
- **Driver**: `mysqlclient` (via `dj_database_url`)
- **Dev fallback**: SQLite remains available when `DATABASE_URL` is not set (dev settings only)
