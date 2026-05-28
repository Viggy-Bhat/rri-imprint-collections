# Local Development Setup

## Prerequisites

- Python 3.10+
- Node.js 18+
- MariaDB 10.6+ (or use SQLite for quick start)

## 1. Clone the Repository

```bash
git clone https://github.com/Viggy-Bhat/rri-imprint-collections.git
cd rri-imprint-collections
```

## 2. Virtual Environment

```bash
python3 -m venv .venv
source .venv/bin/activate       # Linux/Mac
# .venv\Scripts\activate        # Windows
```

## 3. Backend Dependencies

```bash
pip install -r backend/requirements.txt
```

## 4. MariaDB Setup

```sql
CREATE DATABASE rri_imprint CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'rri_user'@'localhost' IDENTIFIED BY 'rri_password';
GRANT ALL PRIVILEGES ON rri_imprint.* TO 'rri_user'@'localhost';
FLUSH PRIVILEGES;
```

The `DATABASE_URL` format for MariaDB:

```
mysql://rri_user:rri_password@127.0.0.1:3306/rri_imprint
```

## 5. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and set:

- `DATABASE_URL` — MariaDB connection string (or omit for SQLite fallback)
- `DJANGO_SECRET_KEY` — any strong random string for dev

## 6. Run Migrations

```bash
cd backend
source ../.venv/bin/activate
python manage.py migrate
```

## 7. Seed Site Settings

```bash
python manage.py seed_sitesettings
```

## 8. Create Superuser

```bash
python manage.py createsuperuser
```

## 9. Start Backend

```bash
python manage.py runserver
```

Backend runs at `http://127.0.0.1:8000`. Wagtail admin at `http://127.0.0.1:8000/admin/`.

## 10. Frontend Dependencies

```bash
cd frontend
npm install
```

## 11. Frontend Environment

```bash
cp .env.example .env.local
```

Default value: `NEXT_PUBLIC_WAGTAIL_BASE_URL=http://127.0.0.1:8000`

## 12. Start Frontend

```bash
npm run dev
```

Frontend runs at `http://localhost:3000`.

## 13. Verification Checklist

- [ ] Wagtail admin loads at `http://127.0.0.1:8000/admin/`
- [ ] API responds at `http://127.0.0.1:8000/api/v2/pages/`
- [ ] Frontend renders at `http://localhost:3000`
- [ ] Researcher pages appear on the home page (after publishing in admin)
