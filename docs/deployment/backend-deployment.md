# Backend Deployment — Django + Gunicorn

Deploy the Django/Wagtail backend with Gunicorn as the application server.

## 1. Clone the Repository

```bash
cd /opt
sudo git clone <your-repo-url> rri-imprint
sudo chown -R rri:rri /opt/rri-imprint
```

## 2. Create Virtual Environment and Install Dependencies

```bash
su - rri bash -c "
  cd /opt/rri-imprint/backend
  python3.11 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
"
```

**Note**: If `pip install` fails with `mysqlclient` errors, verify `libmariadb-dev` and `pkg-config` are installed (see server-prerequisites.md). The `mysqlclient` package compiles against MariaDB's C libraries.

## 3. Configure Environment Variables

```bash
su - rri bash -c "
  cd /opt/rri-imprint/backend
  cp .env.example .env
  chmod 600 .env
"
```

Edit `/opt/rri-imprint/backend/.env` and set every value:

```ini
# Core
DJANGO_SETTINGS_MODULE=backend.settings.production
DJANGO_SECRET_KEY=<run command below to generate>

# Networking
DJANGO_ALLOWED_HOSTS=yourdomain.com
DJANGO_CORS_ALLOWED_ORIGINS=https://yourdomain.com
DJANGO_CSRF_TRUSTED_ORIGINS=https://yourdomain.com

# Database
DATABASE_URL=mysql://rri_user:<your-password>@127.0.0.1:3306/rri_imprint

# Cache (Redis — highly recommended)
REDIS_URL=redis://127.0.0.1:6379/1

# Wagtail
WAGTAILADMIN_BASE_URL=https://yourdomain.com/admin
```

Generate a secure secret key:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

Copy the output and paste it as the value for `DJANGO_SECRET_KEY`.

**Why each variable is needed**:

| Variable | Purpose |
|---|---|
| `DJANGO_SETTINGS_MODULE` | Tells Django which settings to load (dev vs production) |
| `DJANGO_SECRET_KEY` | Cryptographic signing — sessions, CSRF, password reset tokens |
| `DJANGO_ALLOWED_HOSTS` | Prevents Host header attacks; must match your domain |
| `DJANGO_CORS_ALLOWED_ORIGINS` | Allows the frontend to make API requests from your domain |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | Allows CSRF-protected POST requests from your domain |
| `DATABASE_URL` | MariaDB connection string |
| `REDIS_URL` | Redis cache — without this, caching is per-worker (mostly useless) |
| `WAGTAILADMIN_BASE_URL` | Used in admin notification emails and external links |

## 4. Run Migrations

```bash
su - rri bash -c "
  cd /opt/rri-imprint/backend
  source .venv/bin/activate
  python manage.py migrate --noinput
"
```

### Verification

```bash
su - rri bash -c "
  cd /opt/rri-imprint/backend
  source .venv/bin/activate
  python manage.py showmigrations researchers
"
# Expected: [X] 0001_initial
```

## 5. Collect Static Files

Copies Django and Wagtail admin static assets so Nginx can serve them directly.

```bash
su - rri bash -c "
  cd /opt/rri-imprint/backend
  source .venv/bin/activate
  python manage.py collectstatic --noinput
"
```

### Verification

```bash
ls /opt/rri-imprint/backend/static/
# Expected: admin/, css/, js/, wagtail_admin/, etc.
```

## 6. Seed Default Site Settings

Populates the database with the institute's default contact information (editable later in Wagtail admin).

```bash
su - rri bash -c "
  cd /opt/rri-imprint/backend
  source .venv/bin/activate
  python manage.py seed_sitesettings
"
```

## 7. Create Admin User

```bash
su - rri bash -c "
  cd /opt/rri-imprint/backend
  source .venv/bin/activate
  python manage.py createsuperuser
"
```

Follow the prompts to set a username, email, and password.

## 8. Run Django System Checks

Ensures no production-critical configuration issues exist.

```bash
su - rri bash -c "
  cd /opt/rri-imprint/backend
  source .venv/bin/activate
  DJANGO_SETTINGS_MODULE=backend.settings.production python manage.py check --deploy --fail-level ERROR
"
```

This should exit with code 0. If it reports warnings (not errors), you can review them but they are not blockers.

## 9. Set Up Gunicorn Systemd Service

Create `/etc/systemd/system/rri-backend.service`:

```ini
[Unit]
Description=RRI Backend — Gunicorn (Django + Wagtail)
After=network.target mariadb.service redis-server.service
Wants=mariadb.service redis-server.service

[Service]
User=rri
Group=rri
WorkingDirectory=/opt/rri-imprint/backend
Environment=DJANGO_SETTINGS_MODULE=backend.settings.production

ExecStart=/opt/rri-imprint/backend/.venv/bin/gunicorn \
  backend.wsgi:application \
  --workers 4 \
  --bind unix:/run/rri-backend.sock \
  --timeout 120 \
  --max-requests 1000 \
  --max-requests-jitter 50

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**What the settings do**:

| Setting | Why |
|---|---|
| `User=rri` | Runs as non-root — limits damage if the app is compromised |
| `--workers 4` | Handles concurrent requests; adjust based on CPU cores (`2 * cores + 1`) |
| `--bind unix:/run/rri-backend.sock` | Unix socket is faster than TCP; Nginx connects to it |
| `--timeout 120` | Workers that hang for 2+ minutes get killed (StreamField processing can be slow) |
| `--max-requests 1000` | Prevents memory leaks by restarting workers periodically |
| `Restart=always` | Auto-restarts if the process crashes |

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now rri-backend
```

### Verification

```bash
sudo systemctl status rri-backend
# Expected: Active: active (running)

# Test the socket directly
curl --unix-socket /run/rri-backend.sock http://localhost/api/site-settings/
# Expected: JSON response with institute settings
```

## Summary — What You Have After This Step

- [x] Backend code cloned to `/opt/rri-imprint/backend/`
- [x] Python virtual environment created and dependencies installed
- [x] `.env` configured with production values (permissions 600)
- [x] Database migrated, static files collected
- [x] Default site settings seeded
- [x] Admin user created
- [x] Django deploy checks pass
- [x] Gunicorn running as a systemd service on Unix socket

Next step: `frontend-deployment.md`
