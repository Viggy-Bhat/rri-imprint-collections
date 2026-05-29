# Backup and Restore

> **Purpose**: Complete guide to backing up and restoring the RRI Imprint Collections project — covering database, media files, and configuration.
> **Audience**: Backend developers and system administrators.
> **Prerequisites**: [Setup guides](../setup/README.md), [Operations](./operations.md).

---

## Important: Gitignored Artifacts

**The following backup files are gitignored and are NOT available in a fresh repository clone:**

| File | Gitignored By |
|------|---------------|
| `backups/*.sql` | `.gitignore:35` |
| `backups/**/*.sql` | `.gitignore:36` |
| `backups/**/*.json` | `.gitignore:37` |
| `*.sqlite3` | `.gitignore:32` |

**You must create your own backups.** Commands below show how to generate each type.

---

## 1. What to Back Up

| Component | Location | Frequency | Method |
|-----------|----------|-----------|--------|
| Database (MariaDB) | Remote server | Daily | `mysqldump` |
| Database (SQLite) | `backend/db.sqlite3` | Before schema changes | File copy + `dumpdata` |
| Media files | `backend/media/` | Weekly | `rsync` or `tar` |
| Environment files | `.env`, `backend/.env`, `frontend/.env.local` | On change | File copy |
| Code | Git repository | Every commit | `git push` |

---

## 2. MariaDB Backup

### Full Database Dump

```bash
mysqldump -u rri_user -prri_password rri_imprint > backups/db_backup_$(date +%Y%m%d_%H%M%S).sql
```

**Expected output**: No console output (silent success). The file is created in `backups/`.

**Verification**:
```bash
head -5 backups/db_backup_*.sql
# Expected: "-- MariaDB dump ... Host: localhost    Database: rri_imprint"

tail -3 backups/db_backup_*.sql
# Expected: "-- Dump completed on YYYY-MM-DD  HH:MM:SS"
```

### Compressed Dump

```bash
mysqldump -u rri_user -prri_password rri_imprint | gzip > backups/db_backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Single Database (without grants/users)

```bash
mysqldump -u rri_user -prri_password --no-create-db --single-transaction rri_imprint > backups/db_data_only_$(date +%Y%m%d).sql
```

---

## 3. SQLite Backup

### File-Level Copy

```bash
cp backend/db.sqlite3 "backups/db_$(date +%Y%m%d_%H%M%S).sqlite3"
```

**Stop the Django dev server first** — copying while the database is open may produce an inconsistent snapshot.

### Django Fixture Export

```bash
cd backend
source ../.venv/bin/activate
python manage.py dumpdata --natural-foreign --natural-primary --indent 2 > ../backups/fixture_$(date +%Y%m%d_%H%M%S).json
```

**Expected output**: Silent (no output). File created in `backups/`.

**Verification**:
```bash
python -c "import json; d=json.load(open('../backups/fixture_*.json')); print(f'{len(d)} objects')"
# Expected: N objects (a positive integer)
```

---

## 4. Django Fixture Backup (Both Databases)

Works for both MariaDB and SQLite:

```bash
cd backend
source ../.venv/bin/activate
python manage.py dumpdata --natural-foreign --natural-primary --indent 2 > ../backups/full_dump.json
```

**Fixtures include**:
- All ResearcherPage instances (with StreamField content)
- All ResearcherSectionPage instances
- SiteSettings singleton
- HomePage instance
- All User accounts (including superuser)
- Image and Document references (via Wagtail natural keys)
- Content type records

**Excludes**: Raw uploaded files (media). The fixture references images by their primary key, but the actual image files in `backend/media/` must be backed up separately.

---

## 5. Media File Backup

```bash
# Tar archive
tar -czf backups/media_backup_$(date +%Y%m%d).tar.gz backend/media/

# Or rsync to another location
rsync -av backend/media/ /backup/location/media/
```

**What's in `backend/media/`**: All uploaded images and documents from Wagtail admin. These are stored as files on disk (FileSystemStorage). They are NOT included in Django fixture exports.

---

## 6. Environment Configuration Backup

```bash
mkdir -p backups/config_$(date +%Y%m%d)
cp .env backend/.env frontend/.env.local backups/config_$(date +%Y%m%d)/
```

(`.env.local` may not exist — it's safe if the copy fails.)

---

## 7. Restore from MariaDB Dump

### Full Restore

```bash
mysql -u rri_user -prri_password rri_imprint < backups/db_backup_YYYYMMDD_HHMMSS.sql
```

**Prerequisites**: The database `rri_imprint` must exist. If dropped:
```bash
mysql -u root -p -e "CREATE DATABASE rri_imprint CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON rri_imprint.* TO 'rri_user'@'localhost'; FLUSH PRIVILEGES;"
```

### Restore from Compressed Dump

```bash
gunzip -c backups/db_backup_YYYYMMDD_HHMMSS.sql.gz | mysql -u rri_user -prri_password rri_imprint
```

### Verification After Restore

```bash
python manage.py showmigrations researchers
# Expected: [X] 0001_initial

curl -s http://127.0.0.1:8000/api/site-settings/ | python -m json.tool
# Expected: institute settings JSON

python manage.py seed_sitesettings
# Expected: "SiteSettings already exist; no changes made" (if already in backup)
```

---

## 8. Restore from Django Fixture

```bash
cd backend
source ../.venv/bin/activate
python manage.py flush --noinput    # WARNING: deletes all data
python manage.py loaddata ../backups/full_dump.json
```

**If `flush` is too destructive**, loaddata will attempt to insert/update records by primary key. Conflicts produce integrity errors — in that case, flush is required.

**Verification**:
```bash
python manage.py dbshell
# Run queries to verify page count:
# SELECT COUNT(*) FROM wagtailcore_page;
```

---

## 9. Restore from SQLite Backup

### Restore File Copy

```bash
# Stop the Django dev server first
cp backups/db_YYYYMMDD_HHMMSS.sqlite3 backend/db.sqlite3
```

### Restore from Fixture into SQLite

```bash
# Start fresh SQLite database
rm backend/db.sqlite3
python manage.py migrate
python manage.py loaddata ../backups/full_dump.json
python manage.py seed_sitesettings
```

---

## 10. Creating Initial Backups from Scratch

If you don't have the gitignored backup files (`clean_data.json`, `stable_wagtail_7_4_backup.sql`), create them:

### MariaDB SQL Dump
```bash
mysqldump -u rri_user -prri_password rri_imprint > backups/stable_wagtail_7_4_backup.sql
```

### Django Fixture
```bash
cd backend
source ../.venv/bin/activate
python manage.py dumpdata --natural-foreign --natural-primary --indent 2 > ../backups/clean_data.json
```

### Dependency Snapshot
```bash
pip freeze > backups/dependency-history/requirements-$(date +%Y%m%d).txt
```

These files will be gitignored but are available on the machine that created them.

---

## 11. Automated Backup Script (Cron Example)

Add to crontab (`crontab -e`):

```cron
# Daily database dump at 2 AM
0 2 * * * mysqldump -u rri_user -prri_password rri_imprint | gzip > /path/to/backups/daily/db_$(date +\%Y\%m\%d).sql.gz

# Delete dumps older than 30 days
0 3 * * * find /path/to/backups/daily/ -name "db_*.sql.gz" -mtime +30 -delete

# Weekly full fixture export
0 4 * * 0 cd /path/to/backend && source ../.venv/bin/activate && python manage.py dumpdata --natural-foreign --natural-primary --indent 2 > ../backups/weekly/fixture_$(date +\%Y\%m\%d).json

# Weekly media backup
0 5 * * 0 tar -czf /path/to/backups/weekly/media_$(date +\%Y\%m\%d).tar.gz /path/to/backend/media/
```

**Replace `/path/to/` with actual project paths.**

---

## 12. Integration with Migration Workflow

Before any migration, create a backup:

```bash
cd backend
source ../.venv/bin/activate

# Quick fixture export
python manage.py dumpdata --natural-foreign --natural-primary --indent 2 > ../backups/pre_migration_$(date +%Y%m%d_%H%M%S).json

# If using MariaDB, also take a full dump
mysqldump -u rri_user -prri_password rri_imprint > ../backups/pre_migration_db_$(date +%Y%m%d_%H%M%S).sql
```

See [sqlite-to-mariadb.md](../migrations/sqlite-to-mariadb.md) for complete migration backup and recovery procedures.

---

## 13. Related Documentation

- **[sqlite-to-mariadb.md](../migrations/sqlite-to-mariadb.md)** — Database migration and recovery procedures
- **[operations.md](./operations.md)** — Daily operational tasks
- **[database-architecture.md](../architecture/database-architecture.md)** — Schema design
- **[database-setup.md](../setup/database-setup.md)** — Database installation
