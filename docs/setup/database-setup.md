# Database Setup

> **Purpose**: Guide to setting up the database for the RRI Imprint Collections project — both SQLite (zero-config) and MariaDB (recommended for production-like environments).
> **Audience**: Backend developers and database administrators.
> **Prerequisites**: [Backend setup](./backend-setup.md). Python virtual environment with dependencies installed.

---

## Overview

The project supports two database backends:

| Backend | When to Use | Configuration |
|---------|------------|---------------|
| SQLite | Quick start, single-user development, no setup needed | No configuration — used when `DATABASE_URL` is unset |
| MariaDB 10.6+ | Production-like environments, concurrency needed, team development | Set `DATABASE_URL` env var |

The database selection logic lives in `backend/backend/settings/base.py`:

1. If `DATABASE_URL` env var is set → parsed by `dj-database-url` (supports MySQL, MariaDB, PostgreSQL)
2. If `DATABASE_URL` is unset → falls back to SQLite at `backend/db.sqlite3`

---

## Option A: SQLite (Default — Zero Configuration)

No setup required. When no `DATABASE_URL` is set, Django creates and uses `backend/db.sqlite3` automatically.

### Verification
```bash
cd backend
python manage.py dbshell
# Opens SQLite shell:
# sqlite> .tables
# sqlite> .quit
```

### When NOT to Use SQLite

SQLite is unsuitable for production because:
- Single-writer lock causes "database is locked" errors under concurrent access
- Cannot handle simultaneous Wagtail admin auto-saves and API requests
- ALTER TABLE limitations complicate StreamField migrations

**For anything beyond single-developer exploration, use MariaDB.**

---

## Option B: MariaDB (Recommended)

### Step 1: Install MariaDB

```bash
sudo apt update
sudo apt install -y mariadb-server mariadb-client
```

### Step 2: Secure the Installation

```bash
sudo mysql_secure_installation
```

Follow prompts:
- Set root password
- Remove anonymous users: Yes
- Disallow root login remotely: Yes
- Remove test database: Yes
- Reload privilege tables: Yes

### Step 3: Start and Enable the Service

```bash
sudo systemctl start mariadb
sudo systemctl enable mariadb
```

Verify:
```bash
sudo systemctl status mariadb
# Expected: Active: active (running)
```

### Step 4: Create Database and User

```bash
sudo mysql -u root <<EOF
CREATE DATABASE rri_imprint
 CHARACTER SET utf8mb4 
 COLLATE utf8mb4_general_ci;

  **Verification**
  SELECT DEFAULT_COLLATION_NAME
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME='rri_imprint';

**Expected**
utf8mb4_general_ci

CREATE USER 'rri_user'@'localhost'
IDENTIFIED BY 'rri_password';
GRANT ALL PRIVILEGES
ON rri_imprint.*
TO 'rri_user'@'localhost';
FLUSH PRIVILEGES;
EOF
```

Verify the user can connect:
```bash
mysql -u rri_user -p rri_password -e "SELECT 1 AS connected;"
# Expected:
# +-----------+
# | connected |
# +-----------+
# |         1 |
# +-----------+
```

### Step 5: Configure DATABASE_URL

Create `backend/.env` (if it doesn't exist):
```
DATABASE_URL=mysql://rri_user:rri_password@127.0.0.1:3306/rri_imprint
```

**Important**: If your password contains special characters (`@`, `:`, `/`, `%`), URL-encode them:
- `@` → `%40`
- `:` → `%3A`
- `/` → `%2F`
- `%` → `%25`

### Step 6: Run Migrations

```bash
cd backend
source ../.venv/bin/activate
python manage.py migrate
```

**Verification**:
```bash
python manage.py showmigrations researchers
# Expected: [X] 0001_initial

python manage.py dbshell -c "SHOW TABLES;"
# Shows ~30 tables (Wagtail creates many tables)
```

### Step 7: Seed Data and Create Superuser

```bash
python manage.py seed_sitesettings
python manage.py createsuperuser
```

---

## Charset and Collation

The project enforces MariaDB charset in `base.py`:

```python
if "mysql" in db_config.get("ENGINE", ""):
    db_config["OPTIONS"]["charset"] = "utf8mb4"
    db_config["OPTIONS"]["init_command"] = (
        "SET SESSION collation_connection = 'utf8mb4_general_ci'"
    )
```

**Why `utf8mb4`**: Supports full Unicode including emoji and special characters. Wagtail content can include any Unicode text.
**Why `utf8mb4_general_ci`**: Case-insensitive collation for search and sorting compatibility.

---

## Connection Pooling

The project enables persistent connections via `dj-database-url`:

```python
db_config = dj_database_url.parse(
    DATABASE_URL,
    conn_max_age=env_int("DJANGO_DB_CONN_MAX_AGE", 60),
)
```

`conn_max_age=60` means database connections are held for 60 seconds before being recycled. This reduces connection overhead. Adjust with `DJANGO_DB_CONN_MAX_AGE` env var (in seconds).

---

## Loading Existing Data

### From a Django Fixture

```bash
python manage.py loaddata ../backups/clean_data.json
```

**Important**: `backups/clean_data.json` is **gitignored** — it only exists if previously exported from another environment. If you don't have it, you must create content manually in Wagtail admin.

**To export a fixture for sharing**:
```bash
python manage.py dumpdata --natural-foreign --natural-primary --indent 2 > ../backups/clean_data.json
```

Note that this will be gitignored by the `.gitignore` rules (`backups/**/*.json`).

### From a MariaDB SQL Dump

```bash
mysql -u rri_user -p rri_imprint < ../backups/stable_wagtail_7_4_backup.sql
```

The SQL dumps are also gitignored (`backups/*.sql`).

---

## WSL-Specific Notes

On WSL (Windows Subsystem for Linux), MariaDB may require:

### Service Management
WSL doesn't use `systemd` by default on older WSL versions:
```bash
sudo service mariadb start    # WSL-style command
sudo systemctl start mariadb  # If systemd is enabled
```

### Connection Issues
If `mysql` fails to connect via TCP:
1. Check MariaDB is listening:
   ```bash
   sudo ss -tlnp | grep 3306
   ```
2. If no output, MariaDB may need TCP enabled. Edit `/etc/mysql/mariadb.conf.d/50-server.cnf` and ensure:
   ```
   bind-address = 127.0.0.1
   ```
3. Restart MariaDB: `sudo service mariadb restart`

### File System Performance
Always work from the Linux filesystem (`/home/`), not Windows (`/mnt/c/`). Database performance is significantly worse on the Windows-mounted filesystem.

---

## Verification Checklist

After MariaDB setup:

- [ ] MariaDB is running: `sudo systemctl status mariadb` or `sudo service mariadb status`
- [ ] Database exists: `mysql -u rri_user -p -e "USE rri_imprint; SELECT DATABASE();"`
- [ ] Migrations applied: `python manage.py showmigrations researchers` shows `[X] 0001_initial`
- [ ] Site settings seeded: `python manage.py seed_sitesettings` succeeds
- [ ] Can create superuser: `python manage.py createsuperuser`
- [ ] API responds: `curl -s http://127.0.0.1:8000/api/v2/pages/` returns JSON
- [ ] `DATABASE_URL` is set in `backend/.env`

---

## Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Wrong charset on database | Unicode characters corrupted | Recreate with `CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci` |
| User lacks privileges | `Access denied` on migrate | `GRANT ALL PRIVILEGES ON rri_imprint.* TO 'rri_user'@'localhost'; FLUSH PRIVILEGES;` |
| MariaDB not running | `Can't connect to MySQL server` | `sudo systemctl start mariadb` |
| Wrong DATABASE_URL format | `could not translate host name` | Use `127.0.0.1:3306`, not `localhost:3306` |
| Special chars in password unescaped | Connection refused | URL-encode password characters |
| WRONG_COLLATION error on WSL | Collation mismatch between MariaDB versions | Set `collation_connection` in `base.py` options |

---

## Related Documentation

- **[sqlite-to-mariadb.md](../migrations/sqlite-to-mariadb.md)** — Full migration walkthrough between databases
- **[environment-variables.md](./environment-variables.md)** — Complete variable reference including all database-related variables
- **[backup-and-restore.md](../runtime/backup-and-restore.md)** — Backup procedures for both backends
- **[database-architecture.md](../architecture/database-architecture.md)** — Schema design and StreamField storage
