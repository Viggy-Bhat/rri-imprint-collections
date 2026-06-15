# Deployment Guide — RRI Imprint Collections

How to deploy this project to a single Ubuntu 22.04 server.

## Prerequisites

- Ubuntu 22.04 server with root (or sudo) access
- A domain name pointed at the server's IP
- 2 GB RAM minimum (4 GB recommended)
- 20 GB disk minimum

## Architecture

```
                          ┌─────────────────────────────┐
                          │  Nginx (port 443)            │
                          │  SSL termination             │
                          └──────┬──────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
       ┌──────┴──────┐   ┌──────┴──────┐   ┌──────┴──────┐
       │ /api/*       │   │ /admin/*    │   │ /*           │
       │ /static/*    │   │ /documents/*│   │ (all else)   │
       │ /media/*     │   └──────┬──────┘   └──────┬──────┘
       │ (alias)      │          │                  │
       └──────┬───────┘          │                  │
              │                  ▼                  ▼
              │           ┌──────────────┐  ┌──────────────┐
              │           │  Gunicorn    │  │  Next.js     │
              │           │  Unix socket │  │  :3000       │
              │           │  Django API  │  │  Frontend    │
              │           │  + Admin     │  └──────────────┘
              │           └──────┬───────┘
              │                  │
              ▼                  ▼
       ┌──────────┐      ┌──────────┐
       │  Media   │      │  MariaDB │
       │  files   │      │  Redis   │
       └──────────┘      └──────────┘
```

## Documents — Read in Order

| Order | Document | What It Covers |
|---|---|---|
| 1 | `server-prerequisites.md` | Ubuntu packages, MariaDB, Redis, Node.js, firewall |
| 2 | `backend-deployment.md` | Django, Gunicorn, environment, migrations, systemd |
| 3 | `frontend-deployment.md` | Next.js build, systemd service |
| 4 | `nginx-config.md` | SSL cert, reverse proxy config, apply |
| 5 | `backup-and-restore.md` | Database dumps, media backups, restore steps |

## Quick-Start (for experienced operators)

```bash
# === 1. System ===
adduser --system --group rri
apt update && apt upgrade -y
apt install -y python3.11-full python3.11-dev libmariadb-dev pkg-config libssl-dev \
  zlib1g-dev nginx redis-server certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt install -y nodejs
ufw allow 22,80,443/tcp && ufw enable

# === 2. Database ===
mysql_secure_installation
mysql -e "CREATE DATABASE rri_imprint CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER 'rri_user'@'localhost' IDENTIFIED BY '<your-password>';"
mysql -e "GRANT ALL ON rri_imprint.* TO 'rri_user'@'localhost';"

# === 3. Application ===
git clone <repo-url> /opt/rri-imprint
chown -R rri:rri /opt/rri-imprint

su - rri bash -c "
  cd /opt/rri-imprint/backend
  python3.11 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
  cp .env.example .env
  # EDIT .env with production values
  nano .env
  chmod 600 .env
  python manage.py migrate --noinput
  python manage.py collectstatic --noinput
  python manage.py seed_sitesettings
  python manage.py createsuperuser
"

su - rri bash -c "
  cd /opt/rri-imprint/frontend
  npm install
  echo 'NEXT_PUBLIC_WAGTAIL_BASE_URL=https://yourdomain.com' > .env.local
  # EDIT next.config.mjs to add HTTPS remotePatterns
  nano next.config.mjs
  npm run build
"

# === 4. SSL & Nginx ===
certbot --nginx -d yourdomain.com

# === 5. Systemd services ===
# Copy the systemd unit files from the deployment docs
cp rri-backend.service /etc/systemd/system/
cp rri-frontend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now rri-backend rri-frontend
ln -s /etc/nginx/sites-available/rri /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# === 6. Backups (crontab) ===
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/bin/mysqldump -u rri_user -p'<password>' rri_imprint | gzip > /backups/db/rri_\$(date +\%Y\%m\%d).sql.gz && find /backups/db -name 'rri_*.sql.gz' -mtime +30 -delete") | crontab -
```

## Post-Deployment Smoke Test

```bash
# Backend API
curl -s https://yourdomain.com/api/site-settings/ | head -c 200

# Admin interface
curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com/admin/

# Frontend
curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com/

# Static files
curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com/static/css/...

# Security headers
curl -sI https://yourdomain.com/ | grep -i "x-frame-options\|x-content-type-options"

# Django system check
DJANGO_SETTINGS_MODULE=backend.settings.production /opt/rri-imprint/backend/.venv/bin/python \
  /opt/rri-imprint/backend/manage.py check --deploy --fail-level ERROR
```
