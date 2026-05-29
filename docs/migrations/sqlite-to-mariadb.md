# SQLite to MariaDB Migration History

> **Purpose**: Document the transition from SQLite to MariaDB, including rationale, data transfer procedure, final architecture, and backup strategy.
> **Audience**: Backend developers, database administrators.
> **Prerequisites**: [Database architecture](../architecture/database-architecture.md).

## 1. Why SQLite Was Abandoned

SQLite served as the initial development database but presented two critical problems:

### Concurrency Limitations

SQLite uses a single-writer lock — only one write transaction can execute at a time. Wagtail's page tree operations write to multiple tables in a single save (Page, Revision, ContentType, and potentially StreamField data), and simultaneous admin and API access caused write contention. Under even moderate load, SQLite raised "database is locked" errors when the Wagtail admin auto-saved drafts while the Next.js frontend fetched API data.

### ALTER TABLE Limitations for StreamField

SQLite's `ALTER TABLE` support is minimal — it cannot rename columns, alter column types, or add columns with non-null defaults in a single operation. Wagtail's auto-generated migrations for StreamField changes use `AlterField` to replace the entire StreamField column with an updated `block_lookup` dictionary. On SQLite, these operations often require table recreation, which Django handles with varying reliability. Multiple StreamField migrations in sequence compounded the risk of schema corruption.

## 2. Migration Stabilization

The migration history grew to 25+ files through iterative development and schema fixes. This was consolidated into a single `0001_initial.py` migration to:

- Eliminate migration dependency conflicts that accumulated across 25+ files
- Provide a clean starting point for new deployments
- Remove the accumulated history of debugging migrations

### What Was Lost

The incremental migration history (files 0002 through 0013+) is no longer in the repository. Individual migration records — including `migration 0013` that originally defined SidebarItemBlock with only 4 fields, `migration 0014` that created ResearcherSectionPage, and `migration 0015` that added the missing smart_content and gallery fields — were all squashed into the consolidated `0001_initial.py`.

**Ruling**: Never squash migrations again without archiving the originals. Squashing destroys the audit trail needed to understand how the schema evolved and to roll back specific changes.

## 3. The StreamField Schema Mismatch Bug

The most severe bug in this project's history was a schema mismatch where `SidebarItemBlock` in `blocks.py` defined 6 fields (title, subtitle, slug, items, smart_content, gallery) but the database migration stored only 4 (title, subtitle, slug, items). The Wagtail API serialized from the migration schema, not from code, so `smart_content` and `gallery` silently returned `undefined`. The frontend rendered empty states despite content being authored in Wagtail admin.

The fix required generating migration 0015 to add the missing fields to the schema and verifying the migration was applied to both dev and production databases. The incident created the "migrate immediately after block changes" rule in AGENTS.md.

**Full post-mortem**: [wagtail-migration-issues.md](./wagtail-migration-issues.md)

## 4. Data Transfer

Content was transferred between databases using Django's `dumpdata`/`loaddata`:

```bash
python manage.py dumpdata --natural-foreign --natural-primary --indent 2 > clean_data.json
python manage.py loaddata clean_data.json
```

The `clean_data.json` fixture preserves all researcher pages, site settings, and media references. It is stored in `backups/clean_data.json`.

Using `--natural-foreign` and `--natural-primary` ensures the fixture uses natural keys (e.g., content type app_label+model) instead of numeric primary keys, making it portable across database engines. Direct SQL export (e.g., `mysqldump` on SQLite or `sqlite3 .dump` on MariaDB) would not be portable and was avoided.

## 5. Final Architecture

| Property | Value |
|----------|-------|
| Database | MariaDB 10.6+ |
| Driver | mysqlclient 2.2.7 |
| Charset | utf8mb4 |
| Collation | utf8mb4_general_ci |
| Connection | `DATABASE_URL` env var, parsed by `dj-database-url` |
| Pooling | `conn_max_age=60s` (configurable) |
| SSL | Optional via `DATABASE_SSL_REQUIRE` |
| Dev fallback | SQLite when no `DATABASE_URL` is set |

## 6. Backup Strategy

The repository contains these backup artifacts:

| File | Type | Description |
|------|------|-------------|
| `backups/clean_data.json` | Django fixture | All content (pages, settings, media references) |
| `backups/stable_wagtail_7_4_backup.sql` | MariaDB dump | Full database snapshot at Wagtail 7.4 |
| `backups/before_wagtail_downgrade.sql` | MariaDB dump | Pre-downgrade safety backup |
| `backups/dependency-history/requirements-pre-wagtail-7-4.txt` | Pip freeze | Dependency snapshot at Wagtail 7.3rc1 |
| `backups/sqlite-history/db.sqlite3` | SQLite file | Final SQLite database before MariaDB transition |

### Restore Procedure

From Django fixture:
```bash
python manage.py loaddata backups/clean_data.json
```

From MariaDB dump:
```bash
mysql -u <user> -p <database> < backups/stable_wagtail_7_4_backup.sql
```

## 7. Wagtail Version History

The project evolved through multiple Wagtail versions:

| Version | Status | Notes |
|---------|--------|-------|
| Wagtail 6.3.5 | Initial | Project bootstrap |
| Wagtail 7.3rc1 | Intermediate | Dependency snapshot at `backups/dependency-history/requirements-pre-wagtail-7-4.txt` |
| Wagtail 7.4 | Current | Production version; `before_wagtail_downgrade.sql` was taken before a temporary downgrade attempt |

## 8. Lessons Learned

1. **Never update blocks.py without generating migrations** — the StreamField schema mismatch bug was entirely preventable
2. **Always verify block_lookup in migration files matches blocks.py** — the mismatch was detectable but no one checked
3. **Use dumpdata/loaddata for data portability** — not direct SQL export; `--natural-foreign --natural-primary` ensures cross-engine portability
4. **Test migrations on a staging database before production** — the bug was discovered in dev, but could have reached production
5. **Keep migration files in version control; never squash without archiving** — the audit trail from 25+ files to 0001_initial is irrecoverable
