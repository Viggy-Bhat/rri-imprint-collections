# SQLite to MariaDB Migration Guide

> **Purpose**: Complete migration guide covering the SQLite-to-MariaDB transition. Includes operational procedures, safety checklists, backup/restore commands, and recovery workflows.
> **Audience**: Backend developers, database administrators — assumes basic Linux and Django familiarity.
> **Prerequisites**: [Database architecture](../architecture/database-architecture.md), [Wagtail content architecture](../architecture/wagtail-content-architecture.md).
> **Related**: [Migration best practices](./best-practices.md) — workflow and verification checklist. [Wagtail migration issues (post-mortem)](./wagtail-migration-issues.md) — the StreamField schema mismatch bug.

---

## 1. Why SQLite Was Abandoned

SQLite served as the initial development database but presented two critical problems:

### Concurrency Limitations
SQLite uses a single-writer lock — only one write transaction at a time. Wagtail's page tree operations write to multiple tables per save (Page, Revision, ContentType, StreamField data). Simultaneous admin auto-saves and API fetches caused "database is locked" errors.

### ALTER TABLE Limitations
SQLite cannot rename columns, alter column types, or add columns with non-null defaults in a single operation. Wagtail's StreamField migrations use `AlterField` operations that require table recreation on SQLite, with unreliable results under Django's SQLite backend.

## 2. Current Migration State

All researcher migrations are consolidated into a single `0001_initial.py` (7,189 bytes, generated 2026-05-13):

- **Depends on**: `wagtailcore.0096`, `wagtailimages.0027`
- **Creates**: `ResearcherPage`, `ResearcherSectionPage`, `SiteSettings`
- **No incremental migrations** (0002, 0003, etc.) exist — the migration tree starts fresh

### Limitations of Consolidation
- You cannot roll back individual schema changes — the migration is all-or-nothing
- The audit trail of incremental changes is lost
- If a schema bug is found, you must create a forward migration to fix it

**Ruling**: Never squash migrations again without archiving the originals.

## 3. The StreamField Schema Mismatch Bug

The most severe bug in this project: `SidebarItemBlock` defined 6 fields in `blocks.py` but the database migration stored only 4. Wagtail serializes from the migration schema, not from code, so `smart_content` and `gallery` silently returned `undefined` from the API. The frontend rendered empty states despite editors confirming content in Wagtail admin.

**Root cause**: `blocks.py` was updated without running `makemigrations`. The fix was generating and applying a new migration.

**Full post-mortem**: [wagtail-migration-issues.md](./wagtail-migration-issues.md)
**Prevention workflow**: [best-practices.md](./best-practices.md)

**Critical rule from AGENTS.md**: After ANY change to `blocks.py` or `models.py`, immediately run `makemigrations` + `migrate`.

## 4. Pre-Migration Safety Checklist

Before performing any database migration (dev or production):

- [ ] `git status` is clean — no uncommitted changes
- [ ] All existing migrations are applied:
  ```bash
  python manage.py showmigrations researchers
  # All entries should show [X]
  ```
- [ ] Current database is backed up (see §5 or §6 below)
- [ ] Backup has been verified (file size, readable content)
- [ ] `python manage.py makemigrations --check --dry-run` reports no pending migrations:
  ```bash
  python manage.py makemigrations --check --dry-run
  # Expected: "No changes detected"
  ```
- [ ] You know the rollback procedure (see §12)
- [ ] For production: maintenance window has been communicated, staging migration was tested first

## 5. SQLite Backup Procedure

### File-Level Backup
```bash
# Stop the dev server first (Ctrl+C)
cp backend/db.sqlite3 "backups/db_$(date +%Y%m%d_%H%M%S).sqlite3"
```

### Django Fixture Export
```bash
cd backend
source ../.venv/bin/activate
python manage.py dumpdata --natural-foreign --natural-primary --indent 2 > ../backups/pre_migration_dump.json
```

**Expected output**: A JSON file (typically 400-500 KB for this project). The output is silent with `--indent 2` — the file is created without console output.

**Verification**:
```bash
wc -l ../backups/pre_migration_dump.json       # should have content (>0 lines)
python -c "import json; json.load(open('../backups/pre_migration_dump.json')); print('Valid JSON')"
# Expected: "Valid JSON"
```

## 6. MariaDB Backup Procedure

### Full Database Dump
```bash
mysqldump -u rri_user -p rri_imprint > backups/pre_migration_$(date +%Y%m%d_%H%M%S).sql
```

### Django Fixture Export
```bash
cd backend
source ../.venv/bin/activate
python manage.py dumpdata --natural-foreign --natural-primary --indent 2 > ../backups/pre_migration_dump.json
```

**Verification**:
```bash
tail -5 ../backups/pre_migration_*.sql
# Should see dump completion comment: "-- Dump completed on YYYY-MM-DD HH:MM:SS"

python -c "import json; json.load(open('../backups/pre_migration_dump.json')); print('Valid JSON')"
# Expected: "Valid JSON"
```

## 7. SQLite to MariaDB Migration Walkthrough

This procedure moves content from an existing SQLite database to a fresh MariaDB database.

### Prerequisites
- MariaDB 10.6+ installed and running
- Database and user created (see [database-setup.md](../setup/database-setup.md))
- Virtual environment activated with all dependencies installed

### Step 1: Export from SQLite
```bash
cd backend
source ../.venv/bin/activate
python manage.py dumpdata --natural-foreign --natural-primary --indent 2 > ../backups/export_from_sqlite.json
```

Verify:
```bash
grep -c '"model"' ../backups/export_from_sqlite.json
# Should return a positive number (count of serialized model instances)
```

### Step 2: Configure MariaDB Connection
Create or edit `backend/.env`:
```
DATABASE_URL=mysql://rri_user:rri_password@127.0.0.1:3306/rri_imprint
```

Be careful with special characters in passwords — URL-encode them if needed (e.g., `@` → `%40`).

### Step 3: Run Migrations on MariaDB
```bash
python manage.py migrate
```

**Expected output**:
```
Operations to perform:
  Apply all migrations: admin, auth, contenttypes, home, researchers, sessions, taggit, wagtailadmin, wagtailcore, wagtaildocs, wagtailembeds, wagtailimages, wagtailredirects, wagtailsearch, wagtailusers
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying contenttypes.0002_remove_content_type_name... OK
  ... (all migrations)
  Applying researchers.0001_initial... OK
```

Verify:
```bash
python manage.py showmigrations researchers
# Expected: [X] 0001_initial
```

### Step 4: Load Content Fixture
```bash
python manage.py loaddata ../backups/export_from_sqlite.json
```

**Expected output**: Each model type shows the count of loaded instances:
```
Installed N object(s) from N fixture(s)
```

**Troubleshooting**: If loaddata fails with integrity errors:
1. Content types may conflict — run `python manage.py migrate contenttypes zero --fake` then re-migrate
2. Natural key conflicts may require `--ignorenonexistent` flag

### Step 5: Seed Site Settings
```bash
python manage.py seed_sitesettings
```

**Expected output**: `SiteSettings seeded successfully`

### Step 6: Verify
```bash
# API check
curl -s http://127.0.0.1:8000/api/v2/pages/ | python -m json.tool | head -20

# Admin check
# Open http://127.0.0.1:8000/admin/ in a browser and verify pages are present
```

## 8. Fixture Export/Import

### Export (dumpdata)
```bash
cd backend
source ../.venv/bin/activate
python manage.py dumpdata --natural-foreign --natural-primary --indent 2 > ../backups/full_export.json
```

Flags explained:
- `--natural-foreign` — uses natural keys for foreign keys (portable across databases)
- `--natural-primary` — uses natural keys for primary keys where available
- `--indent 2` — human-readable JSON

### Import (loaddata)
```bash
python manage.py loaddata ../backups/full_export.json
```

**Import order**: Django processes fixtures in dependency order automatically. Content types and users are loaded before pages.

**Common loaddata errors**:

| Error | Cause | Fix |
|-------|-------|-----|
| `IntegrityError: duplicate key` | Data already exists in target database | Resolve conflicts manually or use `--ignorenonexistent` |
| `DeserializationError: contenttypes.ContentType matching query does not exist` | Content types mismatch between databases | Export and import contenttypes explicitly: `python manage.py dumpdata contenttypes --indent 2 > contenttypes.json` |
| Natural key not found | Natural key format changed between Django versions | Use `--natural-foreign --natural-primary` consistently |

## 9. Migration Verification Checklist

For the full checklist, see [best-practices.md §2](./best-practices.md). Quick verification:

```bash
# Pending migrations
python manage.py makemigrations --check --dry-run
# Expected: "No changes detected"

# Applied migrations
python manage.py showmigrations researchers
# All must show [X]

# API returns expected fields
curl -s http://127.0.0.1:8000/api/v2/pages/ | python -c "import sys,json; d=json.load(sys.stdin); print('items:', len(d.get('items',[])))"
# Expected: items: >0 (if content exists)
```

## 10. Failed Migration Recovery

### Scenario A: Migration Partially Applied
```bash
# Identify the failed migration
python manage.py showmigrations researchers
# Look for (no prefix) or [ ] instead of [X]

# Fake-apply if schema is correct but Django thinks it failed:
python manage.py migrate researchers <migration_name> --fake
```

### Scenario B: Schema Is Correct, Django Is Confused
```bash
# Fake-apply all pending migrations
python manage.py migrate researchers --fake
```

### Scenario C: Data Loss After Migration
```bash
# 1. Drop the corrupted database (or rollback to a good state)
# 2. Re-create and re-apply migrations
python manage.py migrate

# 3. Restore from fixture
python manage.py loaddata ../backups/pre_migration_dump.json
python manage.py seed_sitesettings
```

### Scenario D: Complete Database Corruption
```bash
# Drop and recreate database (MariaDB):
# mysql -u root -p -e "DROP DATABASE rri_imprint; CREATE DATABASE rri_imprint CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
# GRANT all privileges again

# Or for SQLite: delete db.sqlite3 and re-migrate

python manage.py migrate

# Restore from MariaDB dump:
mysql -u rri_user -p rri_imprint < ../backups/stable_wagtail_7_4_backup.sql

# Or from fixture:
python manage.py loaddata ../backups/clean_data.json
python manage.py seed_sitesettings
```

## 11. Production Migration Rules

1. **Never migrate without a verified backup** — no exceptions
2. **Test on staging first** — apply the same migration to a staging database before production
3. **Use a maintenance window** — Wagtail admin may be unavailable during migration
4. **Communicate before and after** — notify stakeholders of downtime and completion
5. **Run with `--noinput`** in automated environments:
   ```bash
   DJANGO_SETTINGS_MODULE=backend.settings.production python manage.py migrate --noinput
   ```
6. **Verify all health checks pass** post-migration (API, admin, frontend)

## 12. Emergency Rollback Procedure

### If Migration Just Applied (No Data Changes)
```bash
# Rollback one migration
python manage.py migrate researchers 0001

# Or rollback to zero (drops all researcher tables):
python manage.py migrate researchers zero
```

### If Data Was Modified
1. Stop the application
2. Restore database from pre-migration backup:
   ```bash
   mysql -u rri_user -p rri_imprint < ../backups/pre_migration_*.sql
   ```
3. Run migrations up to the last known-good point:
   ```bash
   python manage.py migrate researchers 0001
   ```
4. Verify with `showmigrations` and API curl
5. Restart the application

## 13. Backup File Caveat

**The following backup files are gitignored and are NOT available in a fresh repository clone:**

| File | Type | Gitignored by |
|------|------|---------------|
| `backups/clean_data.json` | Django fixture | `backups/**/*.json` |
| `backups/stable_wagtail_7_4_backup.sql` | MariaDB dump | `backups/*.sql` |
| `backups/before_wagtail_downgrade.sql` | MariaDB dump | `backups/*.sql` |
| `backups/sqlite-history/db.sqlite3` | SQLite file | `*.sqlite3` |

**To create equivalent backups from scratch:**

```bash
# Django fixture
cd backend && python manage.py dumpdata --natural-foreign --natural-primary --indent 2 > ../backups/clean_data.json

# MariaDB dump (from a running MariaDB instance)
mysqldump -u rri_user -p rri_imprint > ../backups/stable_wagtail_7_4_backup.sql
```

These commands must be run on a machine that already has a populated database.

## 14. Final Architecture

| Property | Value |
|----------|-------|
| Database | MariaDB 10.6+ |
| Driver | mysqlclient 2.2.7 |
| Charset | utf8mb4 |
| Collation | utf8mb4_general_ci |
| Connection | `DATABASE_URL` env var, parsed by `dj-database-url 2.3.0` |
| Pooling | `conn_max_age=60s` (`DJANGO_DB_CONN_MAX_AGE`) |
| SSL | Optional via `DATABASE_SSL_REQUIRE` |
| Dev fallback | SQLite when `DATABASE_URL` is unset |

### Dependency Versions (Verified)

| Package | Version | Purpose |
|---------|---------|---------|
| Django | 5.2.14 | Web framework |
| Wagtail | 7.4 | CMS |
| mysqlclient | 2.2.7 | MariaDB/MySQL driver |
| dj-database-url | 2.3.0 | DATABASE_URL parser |

## 15. Related Documentation

- **[best-practices.md](./best-practices.md)** — Standard migration workflow, verification checklist, rollback procedures
- **[wagtail-migration-issues.md](./wagtail-migration-issues.md)** — Complete post-mortem of the StreamField schema mismatch bug
- **[database-setup.md](../setup/database-setup.md)** — MariaDB installation, database/user creation, SQLite fallback
- **[backup-and-restore.md](../runtime/backup-and-restore.md)** — Ongoing backup strategy and restore procedures
- **[AGENTS.md](../../AGENTS.md)** — Critical "migrate immediately after block changes" rule
