# Backup and Restore

Protect your data against server failure, accidental deletion, or corruption.

## What to Back Up

| Data | Location | Frequency | Size |
|---|---|---|---|
| MariaDB database | On the server | Daily | Typically < 100 MB |
| Media files (images, documents) | `/opt/rri-imprint/backend/media/` | Weekly | Depends on uploads |
| Environment configuration | `/opt/rri-imprint/backend/.env` | Per change | < 1 KB |

**The code** (`/opt/rri-imprint/`) does not need to be backed up — it lives in Git.

## Database Backup

### Daily Dump with Retention

Add this to root's crontab to dump the database daily and keep 30 days of backups:

```bash
sudo crontab -e
```

Add the following line:

```cron
# Daily MariaDB backup — keep 30 days
0 2 * * * /usr/bin/mysqldump -u rri_user -p'<your-password>' rri_imprint | gzip > /backups/db/rri_$(date +\%Y\%m\%d).sql.gz && find /backups/db -name 'rri_*.sql.gz' -mtime +30 -delete
```

**Note**: The `%` signs in `date` must be escaped with `\` in crontab.

### Create the Backup Directory

```bash
sudo mkdir -p /backups/db /backups/media
sudo chmod 750 /backups
```

### What This Does

- Runs nightly at 2:00 AM
- Creates a compressed SQL dump: `/backups/db/rri_20260615.sql.gz`
- Deletes any backup older than 30 days
- Can be restored with `gunzip -c` + `mysql`

### Manual Backup

```bash
mysqldump -u rri_user -p rri_imprint | gzip > /backups/db/rri_manual_$(date +%Y%m%d).sql.gz
```

## Media Files Backup

### Weekly Archive

Add to root's crontab:

```cron
# Weekly media backup — keep 90 days
0 3 * * 0 tar czf /backups/media/rri_media_$(date +\%Y\%m\%d).tar.gz -C /opt/rri-imprint/backend media && find /backups/media -name 'rri_media_*.tar.gz' -mtime +90 -delete
```

### Manual Backup

```bash
tar czf /backups/media/rri_media_manual_$(date +%Y%m%d).tar.gz -C /opt/rri-imprint/backend media
```

## Restore from Backup

### Restore the Database

```bash
# Restore the most recent backup
gunzip -c /backups/db/rri_$(date +%Y%m%d).sql.gz | mysql -u rri_user -p rri_imprint

# Or restore a specific file
gunzip -c /backups/db/rri_20260601.sql.gz | mysql -u rri_user -p rri_imprint
```

**Important**: The database must exist before restoring. If it was dropped, recreate it first:

```bash
mysql -u root -p -e "CREATE DATABASE rri_imprint CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p -e "GRANT ALL ON rri_imprint.* TO 'rri_user'@'localhost';"
```

### Restore Media Files

```bash
sudo tar xzf /backups/media/rri_media_20260601.tar.gz -C /opt/rri-imprint/backend
sudo chown -R rri:rri /opt/rri-imprint/backend/media
```

### Verify the Restore

After restoring the database, run Django's system check:

```bash
su - rri bash -c "
  cd /opt/rri-imprint/backend
  source .venv/bin/activate
  python manage.py check
  python manage.py showmigrations
"
# All migrations should show [X] (applied)
```

Then verify the API responds:

```bash
curl https://yourdomain.com/api/site-settings/
# Expected: JSON response with institute settings
```

## Full Crontab Reference

Here is a complete crontab that covers all backup needs:

```cron
# ─── Database ───────────────────────────────────────
# Daily at 2 AM, keep 30 days
0 2 * * * /usr/bin/mysqldump -u rri_user -p'<password>' rri_imprint | gzip > /backups/db/rri_$(date +\%Y\%m\%d).sql.gz && find /backups/db -name 'rri_*.sql.gz' -mtime +30 -delete

# ─── Media ──────────────────────────────────────────
# Weekly on Sunday at 3 AM, keep 90 days
0 3 * * 0 tar czf /backups/media/rri_media_$(date +\%Y\%m\%d).tar.gz -C /opt/rri-imprint/backend media && find /backups/media -name 'rri_media_*.tar.gz' -mtime +90 -delete
```

## Recommended — Off-Site Copy

If the server fails, on-site backups are lost too. Copy backups to another server or cloud storage.

### Using `rsync` to Another Server

```bash
# In crontab, after the backup commands:
0 4 * * * rsync -az --delete /backups/ user@backup-server:/backups/rri/
```

### Using `rclone` to Cloud Storage

```bash
# Install rclone
sudo apt install -y rclone
# Configure (interactive)
rclone config
# In crontab:
0 5 * * * rclone sync /backups/ remote:rri-backups/
```

## Recommended — Test Restores Periodically

A backup that has never been restored is not a backup. Once a month:

1. Restore the latest backup to a temporary database
2. Run `python manage.py check` and `python manage.py showmigrations`
3. Verify a researcher page loads via the API
4. Drop the test database

## Summary

| Task | Schedule | Command |
|---|---|---|
| Database backup | Daily at 2 AM | `mysqldump \| gzip > /backups/db/...` |
| Media backup | Weekly at 3 AM Sunday | `tar czf /backups/media/...` |
| Backup cleanup | Same as backup | `find -mtime +30 -delete` |
| Off-site copy | Daily at 4 AM | `rsync /backups/ user@backup-server:/backups/` |
| Restore test | Monthly | Restore + verify API |
