# Wagtail Migration Issues — StreamField Schema Mismatch Post-Mortem

> **Purpose**: Complete post-mortem of the StreamField schema mismatch bug — the most severe bug in this project's history. Documents root cause, data flow impact, fix procedure, symptoms, diagnosis, and prevention.
> **Audience**: All developers — this bug must never recur. Required reading before any model or block change.
> **Prerequisites**: [Backend models](../backend/models.md), [Wagtail content architecture](../architecture/wagtail-content-architecture.md).
> **Related**: [SQLite to MariaDB migration](./sqlite-to-mariadb.md), [Best practices](./best-practices.md), [Architecture decisions](../architecture/decisions.md) — ADR-6 (Consolidated Migrations), [Technical debt inventory](../architecture/technical-debt.md) — TD-3.

## 1. Executive Summary

In early 2026, developers updated `blocks.py` to add `smart_content` (a StreamBlock for publications, guidance, news, supervision, and gallery sections) and `gallery` (a ListBlock of images) to `SidebarItemBlock`. The code now defined 6 fields on the block. However, no new migration was generated after the change — the database schema, frozen in migration 0013, stored only 4 fields.

Wagtail serializes StreamField data from the migration schema, not from live code definitions. The API therefore never returned `smart_content` or `gallery` data. The frontend received `undefined` for these fields and rendered empty states. Editors could see and edit content in the Wagtail admin (which works against the live model definition, not the migration schema), creating a perplexing disconnect: editors saw their content, but website visitors saw "No publications available."

The fix was generating migration 0015 to add the missing fields to the database schema. The resulting AGENTS.md rule — "After ANY change to blocks.py or models.py, immediately run makemigrations + migrate" — was created to prevent recurrence. All 25+ migrations were later consolidated into a single `0001_initial.py`.

## 2. Timeline

| Date | Event |
|------|-------|
| Pre-0013 | `SidebarItemBlock` defined in `blocks.py` with 4 fields: `title`, `subtitle`, `slug`, `items` |
| 2026-03-23 | Migration 0013 generated — block_lookup for SidebarItemBlock (block 9) reflects 4-field schema: `[('title', 0), ('subtitle', 1), ('slug', 2), ('items', 8)]` |
| Post-0013 | `blocks.py` updated — `smart_content` (StreamBlock with publication, guidance, news, supervision, gallery blocks) and `gallery` (ListBlock of ImageStructBlock) added. SidebarItemBlock now has 6 fields |
| (gap) | No new migration generated after the blocks.py change — schema mismatch begins |
| ~2026-04 | Frontend developers notice smart content sections rendering empty despite editor confirmation that content exists in Wagtail admin |
| Investigation | Root cause identified: migration 0013 block_lookup defines only 4 fields; blocks.py defines 6; API serializes from migration schema |
| Fix | Migration 0015 (`add_smart_content_gallery_to_sidebar_items`) generated — block_lookup updated to include all 6 fields: `[('title', 0), ('subtitle', 1), ('slug', 2), ('items', 8), ('smart_content', 15), ('gallery', 19)]` |
| 2026-05-13 | All migrations consolidated into single `0001_initial.py` — block_lookup for SidebarItemBlock (block 22) correctly contains all 6 fields with smart_content (entries 10-14) and gallery (entries 15-19) |

## 3. Root Cause Analysis

Four contributing factors combined to create the bug:

### Factor 1: No migration generated after blocks.py change

Developers updated `blocks.py` to add `smart_content` and `gallery` to `SidebarItemBlock` but did not run `python manage.py makemigrations`. Django's migration detector cannot generate migrations that were never requested.

### Factor 2: Wagtail serializes from migration schema, not code

When Wagtail serializes a StreamField for the API, it reads the database column's block structure from the most recently applied migration. The migration tracks which block types exist and how they map to numeric indices. If the migration schema says "4 fields," the serializer produces 4 fields — regardless of what `blocks.py` currently defines.

### Factor 3: No automated check existed

There was no pre-commit hook, CI check, or manual verification step that compared `blocks.py` definitions against the latest migration's `block_lookup`. The mismatch was invisible to standard development workflows.

### Factor 4: Silent failure mode

The bug produced no errors, no warnings, and no stack traces. The API returned structurally valid JSON — the `smart_content` and `gallery` keys were simply absent. Nothing in the request/response cycle indicated a problem.

## 4. Schema Mismatch Detail

Migration 0013's `block_lookup` for `SidebarItemBlock` (referenced as block 9 in the sidebar_items StreamField):

```python
# Migration 0013 — SidebarItemBlock had 4 fields
sidebar_items = StreamField([
    ('sidebar_item', 9)
], block_lookup={
    # ... blocks 0-7 for list items ...
    8: ('wagtail.blocks.ListBlock', (7,), {}),
    9: ('wagtail.blocks.StructBlock', [
        ('title', 0),
        ('subtitle', 1),
        ('slug', 2),
        ('items', 8),
        # smart_content — MISSING
        # gallery — MISSING
    ], {}),
})
```

After the fix (migration 0015, now consolidated into 0001_initial):

```python
# Current 0001_initial — SidebarItemBlock has 6 fields (block 22)
sidebar_items = StreamField([
    ('sidebar_item', 22)
], block_lookup={
    # ... blocks 0-9 for item structures ...
    10: ('wagtail.blocks.StructBlock', [...], {}),  # publication
    11: ('wagtail.blocks.StructBlock', [...], {}),  # guidance
    12: ('wagtail.blocks.DateBlock', ...),          # date
    13: ('wagtail.blocks.StructBlock', [...], {}),  # news
    14: ('wagtail.blocks.StructBlock', [...], {}),  # supervision
    15: ('wagtail.images.blocks.ImageChooserBlock', ...),
    16: ('wagtail.blocks.CharBlock', ...),          # caption
    17: ('wagtail.blocks.RichTextBlock', ...),      # about_image
    18: ('wagtail.blocks.StructBlock', [...]),      # gallery image struct
    19: ('wagtail.blocks.ListBlock', (18,), ...),   # gallery list
    # ... blocks 20-21 ...
    22: ('wagtail.blocks.StructBlock', [
        ('title', 0),
        ('subtitle', 1),
        ('slug', 2),
        ('items', 8),
        ('smart_content', 15),
        ('gallery', 19),
    ], {}),
})
```

### The MisMatch Table

| Field | `blocks.py` | Migration 0013 | API Returns |
|-------|-----------|---------------|-------------|
| `title` | CharBlock | Present | Data |
| `subtitle` | CharBlock | Present | Data |
| `slug` | CharBlock | Present | Data |
| `items` | ListBlock(ItemStructBlock) | Present | Data |
| `smart_content` | StreamBlock(publication, guidance, news, supervision, gallery) | **MISSING** | `undefined` |
| `gallery` | ListBlock(ImageStructBlock) | **MISSING** | `undefined` |

## 5. Data Flow Impact

The following diagram traces how content vanished between the Wagtail admin and the frontend:

```
blocks.py (6 fields defined: title, subtitle, slug, items, smart_content, gallery)
    │
    ▼
Database Schema (4 fields stored, frozen at migration 0013)  ← BROKEN LINK
    │
    ▼
Wagtail API serialize_stream_data() — reads migration schema, produces 4-field JSON
    │  smart_content = undefined
    │  gallery = undefined
    ▼
Frontend getSidebarItems() — destructures sidebar_items[].value
    │  smartContent = undefined → []
    │  gallery = undefined → []
    ▼
SectionPage.jsx — maps over smartContent, finds length === 0
    │
    ▼
SmartContentRenderer — never called (conditional: smartContent.length > 0)
    │
    ▼
User sees "No publications available" despite content in Wagtail admin
```

The break occurred between `blocks.py` and the database schema. Both the backend code (blocks.py) and the frontend code (getSidebarItems, SectionPage, SmartContentRenderer) were individually correct. The bug lived entirely in the invisible layer between them: the migration that wires the code definition into the database.

## 6. Symptoms

If this bug recurs, you will observe:

- Content is visible and editable in Wagtail admin (admin uses live model, not migration)
- Publishing works normally
- API response for `sidebar_items` shows `type`/`value`/`id` structure but specific fields (`smart_content`, `gallery`, or any newly added field) are absent from `value`
- Frontend renders empty states ("No publications available," empty galleries) despite confirmed content in Wagtail
- No console errors, no server errors, no HTTP 500s
- **The only automated clue**: `python manage.py makemigrations --dry-run` reports "No changes detected" even though `blocks.py` was modified — this should have generated a migration

## 7. Diagnosis Procedure

Step-by-step guide for developers encountering similar symptoms:

### Step 1: Inspect the API response
```bash
curl -s http://127.0.0.1:8000/api/v2/pages/<page_id>/ | python -m json.tool | grep -A 20 sidebar_items
```
Check if the expected fields appear in the `value` object. Missing fields are the primary symptom.

### Step 2: Check for pending migrations
```bash
python manage.py makemigrations --dry-run
```
If `blocks.py` was changed but this reports "No changes detected," the schema is out of sync.

### Step 3: Compare blocks.py against the migration
Inspect the most recent migration file for the relevant StreamField's `block_lookup`. Compare the StructBlock field list against `blocks.py`:
```python
# migration's block_lookup for the SidebarItemBlock (or relevant block)
# vs.
# blocks.py SidebarItemBlock definition
```
Every field in `blocks.py` must have a corresponding entry in the migration's `block_lookup`.

### Step 4: Check if makemigrations detects the change
If `makemigrations --dry-run` reports no changes but `blocks.py` has new fields, something is preventing detection. Verify:
- The app is in `INSTALLED_APPS`
- The migration directory has `__init__.py`
- No migration file already exists with the same changes

### Step 5: Verify migration is applied
```bash
python manage.py showmigrations researchers
```
All migrations should show `[X]` (applied). An `[ ]` (unapplied) migration is a problem.

## 8. Fix Procedure

```bash
# 1. Verify the mismatch exists
python manage.py makemigrations --dry-run
# Expected output if mismatch: "Migrations for 'researchers': researchers/migrations/0002_xxx.py"

# 2. Generate the migration
python manage.py makemigrations researchers

# 3. Review the generated migration file carefully
#    - Verify block_lookup includes ALL fields from blocks.py
#    - Check that StreamField operations reference correct block types
#    - Ensure the migration depends on the right prior migration

# 4. Apply the migration
python manage.py migrate researchers

# 5. Verify the API response now includes the new fields
curl -s http://127.0.0.1:8000/api/v2/pages/<page_id>/ | python -m json.tool

# 6. Restart the dev server (clears any cached serializers)
# Ctrl+C and restart: python manage.py runserver
```

## 9. Prevention

### 9.1 AGENTS.md Rule

**After ANY change to `blocks.py` or `models.py`, immediately run `makemigrations` + `migrate`.** Do not batch multiple changes without generating intermediate migrations.

### 9.2 Pre-Commit Check

```bash
python manage.py makemigrations --check --dry-run
```
This command exits with a non-zero status if migrations are needed but missing. Integrate it into your pre-commit workflow.

### 9.3 CI Pipeline (Future)

When implemented, the CI pipeline should run:
```bash
python manage.py makemigrations --check --dry-run
```
A non-zero exit code should fail the build. This catches missing migrations before they reach any environment.

### 9.4 Code Review Checklist

Every PR that touches `blocks.py` or `models.py` MUST include a migration file. Reviewers should:
- Verify the migration's `block_lookup` includes every field defined in `blocks.py`
- Compare StructBlock field lists between migration and code
- Run `makemigrations --check --dry-run` locally before approving

### 9.5 Pair Review

For StreamField changes specifically, have a second developer independently verify the migration by:
1. Checking out the PR branch
2. Running `makemigrations --dry-run` — should report "No changes detected"
3. Inspecting the migration file's `block_lookup` against `blocks.py`

### 9.6 Documentation

If new migration patterns or pitfalls are discovered, update this document and [best-practices.md](./best-practices.md).

## 10. Why It Was Particularly Dangerous

- **Silent failure**: No errors, no warnings, no stack traces — nothing appeared broken in logs or monitoring
- **Both ends were correct**: The backend code (`blocks.py`) and frontend code (`getSidebarItems`, `SectionPage`, `SmartContentRenderer`) were individually flawless — the bug was in the invisible wiring between them
- **Admin deception**: Wagtail admin appeared to work normally; editors typed into smart_content fields and saw their content saved. This eliminated the most obvious debugging path: "check if the admin works"
- **Delayed discovery**: The bug only surfaced when users reported "empty pages" despite editors confirming content. By then, the root cause (a migration missing from weeks earlier) was no longer top-of-mind
- **Difficult to debug by inspection**: Looking at the API response, missing keys look like absent data — not a schema problem. The connection to migration 0013 required digging into migration files

## 11. Current Risk Assessment

| Factor | Status | Assessment |
|--------|--------|------------|
| 0001_initial.py correctness | **OK** | Contains correct block_lookup for all current blocks — sidebar_items block 22 includes all 6 fields (title, subtitle, slug, items, smart_content with entries 10-14, gallery with entries 15-19) |
| Risk of recurrence | **LOW** | If the AGENTS.md rule is followed (makemigrations after every blocks.py change) |
| Risk of undetected mismatch | **MEDIUM** | No CI check for migration consistency is currently implemented |
| Risk if blocks.py is changed without migration | **VERY HIGH** | Same silent failure mode — no errors, no warnings, empty frontend, confused editors |

## 12. References to Archive Documents

The following archive documents contain the original investigation notes and evidence:

- `docs/archive/SMART_CONTENT_DEBUG_ANALYSIS.md` — Original root cause analysis including the full block_lookup comparison between migration 0013 (4 fields) and blocks.py (6 fields)
- `docs/archive/SMART_CONTENT_FIX_SUMMARY.md` — Fix summary with verification steps confirming API response and frontend rendering after migration 0015
- `docs/archive/INVESTIGATION_FINDINGS_DETAILED.md` — Detailed investigation with evidence trail, including test verification against Wagtail admin, API response, and frontend rendering
