# Getting Started

> **Purpose**: Fastest path from a fresh clone to a running development environment. Covers both backend (Django/Wagtail) and frontend (Next.js/React).
> **Audience**: Developers who have never seen this repository.
> **Prerequisites**: Linux or WSL2 terminal, internet connection.

## System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| OS | Ubuntu 22.04+, WSL2, macOS | Ubuntu 22.04 LTS |
| Python | 3.10+ | 3.11 or 3.12 |
| Node.js | 18.18+ | 20 LTS |
| Package manager | pip + npm | — |
| Disk space | 500 MB | 1 GB |
| RAM | 2 GB | 4 GB |

**No Docker is required.** The project runs natively.

## Quick Start (15 Minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/Viggy-Bhat/rri-imprint-collections.git
cd rri-imprint-collections
```

### 2. Create Virtual Environment

```bash
python3 -m venv .venv
```

Activate it (do this in every new terminal):

```bash
source .venv/bin/activate     # Linux/Mac/WSL
# .venv\Scripts\activate      # Windows PowerShell
```

**Verification**: Your prompt should show `(.venv)` prefix.

### 3. Install Backend Dependencies

```bash
pip install -r backend/requirements.txt
```

**Expected output**: Progress bars showing package downloads. No errors.

**Verification**:
```bash
python -c "import django; print('Django', django.VERSION)"
# Expected: Django (5, 2, 14, 'final', 0)
```

**If `mysqlclient` fails to build**: Install system dependencies first:
```bash
sudo apt install python3-dev default-libmysqlclient-dev build-essential
```
Then re-run `pip install`.

### 4. Run Migrations (SQLite — Zero Configuration)

By default, the project uses SQLite in development. No database setup is needed.

```bash
cd backend
python manage.py migrate
```

**Expected output**: A long list of `Applying <app>.<migration>... OK` lines ending with `Applying researchers.0001_initial... OK`.

### 5. Seed Initial Data

```bash
python manage.py seed_sitesettings
```

**Expected output**:
```
SiteSettings seeded successfully
```

If you see "No Wagtail Site found," this is normal on a fresh database — a Home page must be created first. Continue to step 6, create a Home page in Wagtail admin, then re-run this command.

### 6. Create Admin User

```bash
python manage.py createsuperuser
```

Follow the prompts. This account is used for Wagtail admin.

### 7. Start the Backend

```bash
python manage.py runserver
```

**Expected output**:
```
Watching for file changes with StatReloader
Performing system checks...
System check identified no issues (0 silenced).
May 29, 2026 - 12:00:00
Django version 5.2.14, using settings 'backend.settings.dev'
Starting development server at http://127.0.0.1:8000/
```

### 8. Install Frontend Dependencies

Open a **new** terminal:

```bash
cd frontend
npm install
```

**Expected output**: Progress bar showing package downloads. **Do not use `yarn` or `pnpm`** — this project uses npm (confirmed by `package-lock.json`).

**Verification**:
```bash
npx next --version
# Expected: Next.js 16.2.3
```

### 9. Start the Frontend

```bash
npm run dev
```

**Expected output**:
```
▲ Next.js 16.2.3 (Turbopack)
- Local:        http://localhost:3000
```

### 10. Verify Everything

- [ ] Backend: Open `http://127.0.0.1:8000/admin/` — Wagtail admin login page appears
- [ ] API: Open `http://127.0.0.1:8000/api/v2/pages/` — JSON response (may be empty initially)
- [ ] Frontend: Open `http://localhost:3000` — Home page renders with "From the Archives..." heading

### 11. Create Your First Page

1. Go to `http://127.0.0.1:8000/admin/` and log in
2. In Wagtail admin, go to Pages → Home → Add child page → **Researcher Page**
3. Fill in the title and basic fields
4. **Publish** the page (required for API visibility)
5. Refresh `http://localhost:3000` — the researcher should appear on the home page

## Using MariaDB Instead of SQLite

See [database-setup.md](./database-setup.md) for MariaDB installation and configuration. After setting up MariaDB:

1. Create the database and user
2. Set `DATABASE_URL` in `backend/.env`
3. Run `python manage.py migrate`
4. Run `python manage.py seed_sitesettings`
5. Run `python manage.py createsuperuser`

## Common First-Time Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `mysqlclient` install fails | Missing MariaDB client libraries | `sudo apt install python3-dev default-libmysqlclient-dev build-essential` |
| `npm install` hangs | Network/proxy issue | Use `npm install --prefer-offline` or check connectivity |
| Port 8000 already in use | Another Django instance running | `lsof -i :8000` then `kill <PID>` |
| Port 3000 already in use | Another Next.js instance | Change port: `npm run dev -- -p 3001` |
| Frontend shows no researchers | Pages not published in Wagtail | In Wagtail admin, open each page and click **Publish** |
| "No Wagtail Site found" after seed_sitesettings | Home page not created yet | Create Home page in Wagtail admin first |
| Images show as broken on frontend | Backend not running | Start `python manage.py runserver` in another terminal |
| Template not found error | Wrong working directory | Run `manage.py` from `backend/`, not project root |

## Next Steps

- **[backend-setup.md](./backend-setup.md)** — Detailed backend walkthrough
- **[frontend-setup.md](./frontend-setup.md)** — Detailed frontend walkthrough
- **[database-setup.md](./database-setup.md)** — MariaDB setup
- **[environment-variables.md](./environment-variables.md)** — Full variable reference

## Related Documentation

- [System architecture overview](../architecture/system-overview.md)
- [Runtime operations](../runtime/operations.md) — daily operational tasks
- [Backup and restore](../runtime/backup-and-restore.md)
