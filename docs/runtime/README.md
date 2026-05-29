# Runtime Operations

> **Purpose**: Day-to-day operational documentation for the RRI Imprint Collections project.
> **Audience**: Backend developers, system administrators, and maintainers.
> **Prerequisites**: [Setup guides](../setup/README.md), [Architecture overview](../architecture/system-overview.md).

## Documents

| Document | Purpose |
|----------|---------|
| [operations.md](./operations.md) | Daily operational tasks, cache management, dependency upgrades, logging and monitoring |
| [backup-and-restore.md](./backup-and-restore.md) | Backup procedures, restore procedures, verification |

## Quick Reference

| Task | Command |
|------|---------|
| Check service health | `curl -s http://127.0.0.1:8000/api/v2/pages/ \| python -m json.tool \| head -5` |
| Apply migrations | `python manage.py migrate` |
| Check for pending migrations | `python manage.py makemigrations --check --dry-run` |
| Clear cache | `python manage.py shell -c "from django.core.cache import cache; cache.clear()"` |
| Export all data | `python manage.py dumpdata --natural-foreign --natural-primary --indent 2 > backup.json` |
| Restore data | `python manage.py loaddata backup.json` |
| Show migration status | `python manage.py showmigrations` |
| Create superuser | `python manage.py createsuperuser` |
| Seed site settings | `python manage.py seed_sitesettings` |
| Check Django system health | `python manage.py check --deploy` |
| View database shell | `python manage.py dbshell` |
| Clean expired sessions | `python manage.py clearsessions` |

## Related Documentation

- [Migration guide](../migrations/sqlite-to-mariadb.md)
- [Migration best practices](../migrations/best-practices.md)
- [Production readiness checklist](../deployment/production-checklist.md) (forthcoming)
