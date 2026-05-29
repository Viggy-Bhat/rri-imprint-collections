# Migration Best Practices

> **Purpose**: Migration workflow, verification checklist, rollback procedures, and prevention guidelines for the RRI Imprint Collections project.
> **Audience**: Backend developers making model or StreamField block changes.
> **Prerequisites**: [Wagtail migration issues](./wagtail-migration-issues.md) — required reading before any block change.
> **Related**: [AGENTS.md](../../AGENTS.md), [Technical debt inventory](../architecture/technical-debt.md) — TD-3.

## 1. Standard Migration Workflow

Every model or block change must follow this exact sequence:

```bash
# 1. Make changes to blocks.py or models.py

# 2. Generate the migration
python manage.py makemigrations researchers

# 3. REVIEW the generated migration file BEFORE applying it
#    Verify:
#    - block_lookup includes ALL fields defined in blocks.py
#    - StreamField operations list correct block types
#    - No unintended schema changes (check for AlterField on unrelated fields)
#    - Migration depends on the correct previous migration
#    - The file is readable and well-formed

# 4. Apply the migration
python manage.py migrate researchers

# 5. Verify the API response includes new fields
curl -s http://127.0.0.1:8000/api/v2/pages/ | python -m json.tool

# 6. Test in Wagtail admin
#    - Create a new page and populate the new/changed fields
#    - Edit an existing page that uses the changed fields
#    - Publish and verify the change persists
#    - Re-open the page and confirm content is intact

# 7. Commit BOTH the code change AND the migration file together
git add researchers/blocks.py researchers/migrations/000X_*.py
git commit -m "Add <feature>: update SidebarItemBlock with <new field>"
```

## 2. Migration Verification Checklist

For every migration, verify each item:

- [ ] `python manage.py makemigrations --check --dry-run` reports clean (no pending migrations)
- [ ] Migration file is readable and well-structured (not an opaque binary blob)
- [ ] `block_lookup` count matches the number of blocks referenced in the StreamField
- [ ] All block types defined in `blocks.py` appear in the migration's `block_lookup`
- [ ] For each StructBlock, compare its field list in `blocks.py` against the field list in `block_lookup` — every field must be present
- [ ] Migration depends on the correct Wagtail core migration (currently `wagtailcore.0096`)
- [ ] No circular dependencies between migration files
- [ ] `python manage.py migrate` applies without errors
- [ ] `python manage.py showmigrations researchers` shows all migrations with `[X]`
- [ ] API endpoint returns expected field structure (test with curl and verify JSON keys)
- [ ] Wagtail admin: create, edit, publish, and re-open a page using the changed fields
- [ ] Frontend renders the new/changed data correctly (if applicable)

## 3. StreamField-Specific Migration Guidelines

Wagtail StreamField migrations have unique behavior that differs from standard Django model migrations:

### Block Lookup Mechanism

- StreamField changes generate `AlterField` operations with complete `block_lookup` dictionaries
- Each block type in the StreamField gets a numeric index in `block_lookup`
- The `block_lookup` is a **complete snapshot** — all blocks must be listed, not just the changed ones
- Adding a field to a StructBlock within a StreamField generates a new migration with an updated `block_lookup` that includes the new field index

### Detection

Wagtail detects StreamField changes by comparing the migration's `block_lookup` against the live definition in `blocks.py`. If any block type, field, or structure differs, `makemigrations` generates a new migration.

### Common Pitfalls

- **Adding a nested StreamBlock**: Each new block type requires a new index in `block_lookup`, and the parent StructBlock's field list must include the new block type index
- **Reordering fields**: Changing the order of fields in a StructBlock generates a new migration — the field list in `block_lookup` must match the definition order
- **Changing block parameters**: Modifying a CharBlock's `required` or `help_text` parameter triggers a migration

### Verification for StreamField Changes

```python
# In blocks.py:
class SidebarItemBlock(blocks.StructBlock):
    title = blocks.CharBlock(required=True)
    subtitle = blocks.CharBlock(required=False)
    slug = blocks.CharBlock(required=True, help_text="Used for URL routing")
    items = blocks.ListBlock(ItemStructBlock())
    smart_content = SmartContentBlock()
    gallery = blocks.ListBlock(ImageStructBlock(), label="Gallery Images")

# In the migration's block_lookup, the StructBlock (e.g., index 22) must list:
# [('title', 0), ('subtitle', 1), ('slug', 2), ('items', 8), ('smart_content', 15), ('gallery', 19)]
# All 6 fields present, indices match, order matches.
```

## 4. Rollback Procedures

### Rolling Back a Migration

```bash
# View current migration status
python manage.py showmigrations researchers

# Example output:
# researchers
#  [X] 0001_initial
#  [X] 0002_add_new_field

# Rollback one migration (reverts 0002, stays at 0001)
python manage.py migrate researchers 0001

# Rollback to beginning (drops all tables for the app)
python manage.py migrate researchers zero
```

### Recovering From a Failed Migration

```bash
# 1. Identify the failing migration
python manage.py showmigrations researchers
# A migration with [ ] means it was never applied

# 2. If the schema is already correct but Django thinks the migration failed,
#    fake-apply it to mark it as complete without running SQL:
python manage.py migrate researchers <migration_name> --fake

# 3. If the database is corrupted from a partial migration:
#    - Restore from the most recent backup (dumpdata/loaddata or SQL dump)
#    - Fake-apply all migrations up to the point of failure
#    - Generate and apply the corrected migration

# 4. If data was lost but the schema is correct:
#    - Fake-apply the broken migration
#    - Create a data migration to restore lost content from backup
```

## 5. Data Migration Patterns

When content needs transformation (not just schema changes), create a data migration:

```python
# File: researchers/migrations/000X_transform_data.py
from django.db import migrations

def migrate_sidebar_data(apps, schema_editor):
    ResearcherPage = apps.get_model('researchers', 'ResearcherPage')
    for page in ResearcherPage.objects.all():
        # Transform data — e.g., restructure sidebar_items
        for item in page.sidebar_items:
            if item.block_type == 'sidebar_item':
                # Add a default value for a new required field
                if 'new_field' not in item.value:
                    item.value['new_field'] = 'default_value'
        page.save()

class Migration(migrations.Migration):
    dependencies = [
        ('researchers', '000X_previous_schema_migration'),
    ]
    operations = [
        migrations.RunPython(
            migrate_sidebar_data,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
```

Key points for data migrations:
- Use `apps.get_model()` — not direct model imports — to get the historical version of the model
- Always provide a `reverse_code` (even if `noop`) for rollback safety
- Test on a copy of the database before running in production
- Data migrations should be a separate migration file from schema migrations

## 6. Fixture-Based Backup and Restore

### Before Any Risky Migration

```bash
# Export all content as a portable Django fixture
python manage.py dumpdata --natural-foreign --natural-primary --indent 2 > backup_before_migration.json

# Store the backup somewhere safe (not in the repo if it contains secrets)
```

### After a Failed Migration

```bash
# 1. Rollback to a known-good state (or drop and recreate the database)
# 2. Re-apply all migrations up to the point before the failure
python manage.py migrate researchers <last_good_migration>

# 3. Restore content from fixture
python manage.py loaddata backup_before_migration.json

# 4. Once verified, attempt the migration again with corrections
```

### Fixture Contents

The `backups/clean_data.json` fixture includes:
- All `ResearcherPage` instances and their StreamField content
- All `ResearcherSectionPage` instances
- `SiteSettings` singleton
- `HomePage` instance
- Image and document references (via natural keys)

## 7. Working With the Consolidated Migration

Since all migrations are consolidated into `0001_initial.py`:

- `manage.py` defaults to `backend.settings.dev` which uses the dev database (SQLite when no `DATABASE_URL` is set)
- New migrations are numbered 0002, 0003, etc. — they `depend on [('researchers', '0001_initial')]`
- Production requires `DJANGO_SETTINGS_MODULE=backend.settings.production`
- Always test migrations against both SQLite (dev) and MariaDB before deploying
- If a new developer clones the repo, they only need `python manage.py migrate` to get the full schema

### Limitations of Consolidation

- You cannot roll back individual schema changes — the consolidated migration is all-or-nothing
- The audit trail of incremental changes (why was field X added? when?) is lost
- If a specific migration is found to be buggy, you cannot target it for rollback — you must create a new forward migration to fix it

## 8. Prevention Guidelines

### Rule 1 — Immediate Migration

After ANY change to `blocks.py` or `models.py`, run `makemigrations` + `migrate` immediately. Do not batch multiple changes without generating intermediate migrations. This is the single most important rule — it exists because the worst bug in this project was caused by violating it.

### Rule 2 — Pre-Commit Check

Before committing, run:
```bash
python manage.py makemigrations --check --dry-run
```
If this reports changes, a migration file is missing from the commit.

### Rule 3 — CI Pipeline (Future)

When CI is implemented, add:
```yaml
# .github/workflows/ci.yml (example)
- name: Check for missing migrations
  run: python manage.py makemigrations --check --dry-run
```
A non-zero exit code fails the build. This prevents missing migrations from reaching any deployed environment.

### Rule 4 — Code Review

Every PR that touches `blocks.py` or `models.py` MUST include a migration file. Reviewers should verify the migration's `block_lookup` against the code changes.

### Rule 5 — Pair Verification

For StreamField changes specifically, have a second developer independently verify:
1. Checkout the PR branch
2. Run `makemigrations --dry-run` — should report "No changes detected"
3. Inspect the migration file's `block_lookup` against `blocks.py`

### Rule 6 — Testing

After every migration:
- Test the API endpoint returns the expected field structure
- Test the Wagtail admin: create, edit, publish, and re-open a page
- Test the frontend renders the new/changed data correctly

### Rule 7 — Documentation

If new migration patterns or pitfalls are discovered during development, update this document and [wagtail-migration-issues.md](./wagtail-migration-issues.md).

## 9. Known Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| StreamField schema mismatch | Medium | Very High | `makemigrations --check` in workflow; pair review for block changes |
| Data loss during migration | Low | High | `dumpdata` backup before every migration; test on staging first |
| Consolidated migration makes rollback harder | N/A | Medium | Create targeted forward migrations to fix problems; never rely on rollback |
| SQLite vs MariaDB migration divergence | Low | Medium | Test migrations on both database engines before deploying |
| Wagtail core migration dependency conflict | Low | High | Pin Wagtail version in requirements; test version upgrades in staging first |
| Missing migration committed to main | Medium | High | Pre-commit `makemigrations --check`; CI gate; code review checklist |
