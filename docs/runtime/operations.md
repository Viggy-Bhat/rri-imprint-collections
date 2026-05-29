# Operations

> **Purpose**: Guide to daily operational tasks for the RRI Imprint Collections project — starting services, applying migrations, managing cache, upgrading dependencies, and monitoring.
> **Audience**: Backend developers and system administrators.
> **Prerequisites**: [Project setup](../setup/README.md), [Architecture overview](../architecture/system-overview.md).

---

## 1. Service Management

### Starting in Development

**Backend**:
```bash
cd backend
source ../.venv/bin/activate
python manage.py runserver
```
Runs on `http://127.0.0.1:8000`. Settings module defaults to `backend.settings.dev`.

**Frontend**:
```bash
cd frontend
npm install        # first time only
npm run dev
```
Runs on `http://localhost:3000` with Turbopack hot reload.

**Start order**: Backend first, then frontend. The frontend fetches data from the backend on load.

### Starting in Production

**Backend** (production settings):
```bash
cd backend
source ../.venv/bin/activate
DJANGO_SETTINGS_MODULE=backend.settings.production python manage.py migrate --noinput
DJANGO_SETTINGS_MODULE=backend.settings.production python manage.py collectstatic --noinput
DJANGO_SETTINGS_MODULE=backend.settings.production gunicorn backend.wsgi:application \
    --workers 4 --bind 0.0.0.0:8000 --timeout 120
```

`wsgi.py` defaults to `backend.settings.production` when the env var is not set, so `DJANGO_SETTINGS_MODULE` declaration above is explicit but technically redundant for gunicorn.

**Frontend** (production):
```bash
cd frontend
npm ci --omit=dev
npm run build
npm run start
```

Production deployment configuration (nginx, systemd, SSL) is not yet documented. See `README.md` inline guide for a basic setup.

### Stopping Services

- **Django dev server**: `Ctrl+C`
- **Next.js dev server**: `Ctrl+C`
- **Gunicorn**: `pkill gunicorn` or `kill <PID>`

---

## 2. Service Health Checks

The project has **no dedicated health check endpoint**. Use these endpoints for health verification:

**API availability**:
```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/v2/pages/
# Expected: 200
```

**Wagtail admin availability**:
```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/admin/login/
# Expected: 200 (redirect to login page)
```

**Frontend availability**:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Expected: 200
```

**Database connectivity** (MariaDB):
```bash
mysql -u rri_user -prri_password -e "SELECT 1 AS connected;"
# Expected: 1
```

**Django system check**:
```bash
cd backend && python manage.py check
# Expected: "System check identified no issues (0 silenced)."
```

---

## 3. Database Migrations

### Applying Migrations

```bash
cd backend
source ../.venv/bin/activate
python manage.py migrate
```

**Always backup before applying migrations** (see §7 below).

### Checking Migration Status

```bash
python manage.py showmigrations researchers
```

**Expected output**:
```
researchers
 [X] 0001_initial
```

`[X]` = applied, `[ ]` = pending.

### Checking for Pending Migrations

```bash
python manage.py makemigrations --check --dry-run
```

**Expected output if clean**: `"No changes detected"` with exit code 0.

A non-zero exit code means you have model/block changes without a corresponding migration — **generate one immediately** per the AGENTS.md rule.

### Rolling Back

```bash
# Rollback the researchers app to a specific migration
python manage.py migrate researchers 0001

# Rollback to beginning (drops tables)
python manage.py migrate researchers zero
```

**Full migration procedures and recovery**: [sqlite-to-mariadb.md](../migrations/sqlite-to-mariadb.md)

---

## 4. Cache Management

### Cache Architecture

| Mode | Backend | LOCATION | TTL |
|------|---------|----------|-----|
| Default (no REDIS_URL) | `LocMemCache` | `rri-imprint-default-cache` | 300s |
| With `REDIS_URL` set | `RedisCache` | From `REDIS_URL` | 300s |

### Cache TTLs by Endpoint

| Endpoint | Cache TTL |
|----------|-----------|
| `/api/researchers/<slug>/sections/<slug>/filtered-items/` | 300s |
| `/api/researchers/<slug>/publications/` | 300s |
| `/api/researchers/<slug>/guidance/` | 300s |
| `/api/researchers/<slug>/news/` | 180s |
| `/api/researchers/<slug>/sections/<slug>/count/` | 300s |
| `/api/images/<id>/` | 300s |
| `/api/site-settings/` | 300s |

TTLs are hardcoded in the `@cache_page` decorators.

### Clearing the Cache

**Via Django shell (works for both backends)**:
```bash
python manage.py shell -c "from django.core.cache import cache; cache.clear(); print('Cache cleared')"
```

**Via Redis CLI (if using Redis)**:
```bash
redis-cli FLUSHDB
```

### When to Clear

- After publishing or unpublishing content in Wagtail admin
- After importing data via `loaddata`
- After directly editing the database outside Wagtail admin
- When you see stale content on the frontend

Note: Wagtail may not automatically invalidate the Django cache on page publish. If stale data appears, clear the cache manually.

---

## 5. Content Publishing Workflow

### In Wagtail Admin

1. Edit any ResearcherPage in Wagtail admin
2. Add content to structured fields (sidebar items, bio sections, smart content)
3. Click **Publish** — unpublished pages are invisible to the API
4. The API should reflect changes within the cache TTL window (or immediately after cache clear)

### API Verification After Publishing

```bash
curl -s http://127.0.0.1:8000/api/v2/pages/<page_id>/ | python -m json.tool | head -30
```

### Frontend Verification

After publishing, the frontend displays changes:
- **Immediately**: if `NEXT_PUBLIC_WAGTAIL_BASE_URL` uses `cache: "no-store"` in `app/page.js`
- **After cache TTL**: if using ISR via `next: { revalidate: N }` in `siteSettingsApi.js`

---

## 6. Logging and Monitoring

### Logging Architecture

All logs go to **stdout** in structured JSON format:

```json
{"ts":"2026-05-29 12:00:00,123","level":"INFO","logger":"researchers","msg":"Request processed"}
```

### Logger Hierarchy

| Logger | Level | Purpose |
|--------|-------|---------|
| `django` | `DJANGO_LOG_LEVEL` (default `INFO`) | All Django internals |
| `django.request` | Always `WARNING` | HTTP 4xx/5xx responses |
| `researchers` | `DJANGO_LOG_LEVEL` (default `INFO`) | Application-level business logic |
| `search` | `DJANGO_LOG_LEVEL` (default `INFO`) | Search view operations |
| Root | `DJANGO_LOG_LEVEL` (default `INFO`) | Everything not caught by specific loggers |

### Setting Log Level

Set in `.env`:
```
DJANGO_LOG_LEVEL=DEBUG
```

Valid values: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`.

### Log Analysis Commands

**View backend logs in real time** (development):
```bash
# Logs go directly to the terminal running manage.py runserver
```

**View gunicorn logs** (production):
```bash
journalctl -u gunicorn -f    # if using systemd
```

**Parse structured logs** (for monitoring tools):
```bash
tail -f /var/log/gunicorn/access.log | python -c "import sys,json; [print(json.loads(l)) for l in sys.stdin]"
```

### Health Monitoring Recommendations

Since the project has no built-in health endpoint, use external monitoring:

- **Uptime monitoring**: Set up a 5-minute curl check against `http://127.0.0.1:8000/api/v2/pages/` expecting HTTP 200
- **Error tracking**: Consider integrating Sentry via `sentry-sdk` (not currently configured)
- **Performance monitoring**: Django Debug Toolbar for development; New Relic or similar for production (not configured)

### What to Watch For

| Condition | Logger | Level | Indicates |
|-----------|--------|-------|-----------|
| `database is locked` | `django.request` | ERROR | SQLite concurrency — switch to MariaDB |
| `Unable to fetch` | `researchers` | ERROR | API infrastructure issue |
| `Researcher not found` | `researchers` | INFO | Invalid slug request |
| `Image lookup failed` | `researchers` | INFO | Missing image reference |

---

## 7. Creating Backups Before Risky Operations

Before any of these operations, create a backup:

- Applying migrations
- Running `loaddata`
- Bulk content deletion in Wagtail admin
- Database engine migration
- Wagtail or Django version upgrade

**Quick backup command**:
```bash
cd backend && python manage.py dumpdata --natural-foreign --natural-primary --indent 2 > ../backups/pre_op_$(date +%Y%m%d_%H%M%S).json
```

**Full backup guide**: [backup-and-restore.md](./backup-and-restore.md)

---

## 8. Dependency Management

### Backend

All dependencies are pinned with exact versions in `backend/requirements.txt` (43 packages).

**Check outdated packages**:
```bash
pip list --outdated
```

**Upgrade a package**:
```bash
pip install --upgrade <package>==<new-version>
pip freeze > backend/requirements.txt    # update the lock file
```

**After upgrading**: Run migrations, test the API, test the Wagtail admin, and verify the frontend renders correctly.

**Key dependency constraints**:
- Wagtail versions must be compatible with Django versions. Check [Wagtail release notes](https://docs.wagtail.org/en/stable/releases/) before upgrading either.
- `mysqlclient` 2.2.7 requires MariaDB client libraries (`default-libmysqlclient-dev`)

### Frontend

Dependencies in `frontend/package.json` mix pinned and ranged versions.

**Check outdated packages**:
```bash
npm outdated
```

**Upgrade packages**:
```bash
npm update              # respect semver ranges
npm install <pkg>@latest  # specific package
```

**After upgrading**: Run `npm run build` and verify no build errors. Test with `npm run dev`.

### Security Updates

**Check for known vulnerabilities**:
```bash
# Backend
pip-audit

# Frontend
npm audit
```

Prioritize `HIGH` and `CRITICAL` vulnerabilities. Test after applying fixes.

### Rollback After Failed Upgrade

**Backend**:
```bash
# If you backed up requirements.txt before the upgrade:
pip install -r requirements_backup.txt
```

**Frontend**:
```bash
# npm update only modifies package.json ranges — lockfile defines exact versions
git checkout package.json package-lock.json
npm ci
```

---

## 9. Common Operational Tasks (Quick Reference)

| Task | Command |
|------|---------|
| Start dev backend | `cd backend && source ../.venv/bin/activate && python manage.py runserver` |
| Start dev frontend | `cd frontend && npm run dev` |
| Apply migrations | `python manage.py migrate` |
| Check migration status | `python manage.py showmigrations researchers` |
| Check for missing migrations | `python manage.py makemigrations --check --dry-run` |
| Clear cache | `python manage.py shell -c "from django.core.cache import cache; cache.clear()"` |
| Export all data | `python manage.py dumpdata --natural-foreign --natural-primary --indent 2 > backup.json` |
| Import data | `python manage.py loaddata backup.json` |
| Create admin user | `python manage.py createsuperuser` |
| Reset site settings | `python manage.py seed_sitesettings` |
| Run system checks | `python manage.py check --deploy` |
| Show URLs | `python manage.py show_urls` (if django-extensions is installed) |
| Clean sessions | `python manage.py clearsessions` |
| Collect static files | `DJANGO_SETTINGS_MODULE=backend.settings.production python manage.py collectstatic --noinput` |
| View installed packages | `pip freeze` |
| Lint frontend | `cd frontend && npm run lint` |
| Build frontend | `cd frontend && npm run build` |

---

## 10. Verification Procedures

After any configuration change or risky operation, verify:

1. **System checks pass**:
   ```bash
   python manage.py check
   ```

2. **All migrations applied**:
   ```bash
   python manage.py showmigrations | grep -c '\[ \]'
   # Expected: 0 (no unapplied migrations)
   ```

3. **API responds**:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/v2/pages/
   # Expected: 200
   ```

4. **Wagtail admin loads**:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/admin/login/
   # Expected: 200
   ```

5. **Site settings API responds**:
   ```bash
   curl -s http://127.0.0.1:8000/api/site-settings/ | python -m json.tool
   # Expected: JSON with institute_name, department, address, phone, email
   ```

---

## 11. Related Documentation

- **[backup-and-restore.md](./backup-and-restore.md)** — Complete backup and restore procedures
- **[sqlite-to-mariadb.md](../migrations/sqlite-to-mariadb.md)** — Database migration between engines
- **[best-practices.md](../migrations/best-practices.md)** — Migration workflow and prevention
- **[environment-variables.md](../setup/environment-variables.md)** — All configuration variables
- **[database-setup.md](../setup/database-setup.md)** — Database installation and configuration
- **[caching-architecture.md](../architecture/caching-architecture.md)** — Cache architecture details
- **[database-architecture.md](../architecture/database-architecture.md)** — Schema design
