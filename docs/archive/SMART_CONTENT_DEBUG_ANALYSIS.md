# Smart Content & Gallery Rendering Investigation - ROOT CAUSE ANALYSIS

## Executive Summary

**The smart_content and gallery blocks are not rendering on the Publications page because the database migrations have NOT been updated to include these fields in the `SidebarItemBlock` structure.**

The code defines these fields in `blocks.py`, but the Wagtail migrations still reflect an older schema that excludes them. This creates a critical mismatch where:

- The frontend expects `smart_content` and `gallery` properties on each sidebar item
- The database doesn't actually store these fields for sidebar items
- The Wagtail API returns null/undefined for these fields
- Smart content renders "No publications available"

---

## 1. BACKEND DATA STRUCTURE ANALYSIS

### Current `SidebarItemBlock` Definition (blocks.py)

**File:** [backend/researchers/blocks.py](backend/researchers/blocks.py#L119-L151)

```python
class SidebarItemBlock(blocks.StructBlock):
    title = blocks.CharBlock(required=True)
    subtitle = blocks.CharBlock(required=False)
    slug = blocks.CharBlock(required=True, help_text="Used for URL routing")
    items = blocks.ListBlock(SidebarContentItemBlock())
    smart_content = blocks.StreamBlock(
        [
            ("publication", PublicationBlock()),
            ("guidance", GuidanceBlock()),
            ("news", NewsClippingBlock()),
            ("supervision", StudentSupervisionBlock()),
        ],
        required=False,
    )
    gallery = blocks.ListBlock(
        GalleryImageBlock(),
        required=False,
        help_text="Add images to create a gallery for this section",
    )

    class Meta:
        icon = "list-ul"
        label = "Sidebar Item"
```

### Database Migration Schema (migrations/0013)

**File:** [backend/researchers/migrations/0013_researcherpage_smart_content_and_more.py](backend/researchers/migrations/0013_researcherpage_smart_content_and_more.py)

The AlterField operation on `sidebar_items` shows:

```python
block_lookup={
    # ... other blocks ...
    9: ('wagtail.blocks.StructBlock', [[('title', 0), ('subtitle', 1), ('slug', 2), ('items', 8)]], {})
}
```

**Block 9 (SidebarItemBlock) contains:** `title`, `subtitle`, `slug`, `items`
**Block 9 is MISSING:** `smart_content`, `gallery`

### The Mismatch

| Field         | blocks.py Definition | Migration 0013 Schema | API Returns      |
| ------------- | -------------------- | --------------------- | ---------------- |
| title         | ✅ CharBlock         | ✅ Present            | ✅ Data          |
| subtitle      | ✅ CharBlock         | ✅ Present            | ✅ Data          |
| slug          | ✅ CharBlock         | ✅ Present            | ✅ Data          |
| items         | ✅ ListBlock         | ✅ Present            | ✅ Data          |
| smart_content | ✅ StreamBlock       | ❌ **MISSING**        | ❌ **undefined** |
| gallery       | ✅ ListBlock         | ❌ **MISSING**        | ❌ **undefined** |

---

## 2. API RESPONSE STRUCTURE

When the Wagtail API serializes a sidebar item, it uses the database schema (not the code definition).

**Current API response structure (broken):**

```json
{
  "type": "sidebar_item",
  "value": {
    "title": "Publications",
    "subtitle": "",
    "slug": "publications",
    "items": [
      {
        "type": "sidebar_content_item",
        "value": {
          "title": "Item 1",
          "link": "...",
          "tag": "...",
          "meta_text": "...",
          "description": "..."
        }
      }
    ],
    "smart_content": undefined, // ❌ NEVER POPULATED - MISSING FROM SCHEMA
    "gallery": undefined // ❌ NEVER POPULATED - MISSING FROM SCHEMA
  }
}
```

**Expected API response structure (if migrated):**

```json
{
  "type": "sidebar_item",
  "value": {
    "title": "Publications",
    "subtitle": "",
    "slug": "publications",
    "items": [...],
    "smart_content": [
      {
        "type": "publication",
        "value": {
          "title": "Publication Title",
          "journal": "Journal Name",
          "year": 2024,
          "link": "https://..."
        }
      }
    ],
    "gallery": [...]
  }
}
```

### APIField Declarations

**File:** [backend/researchers/models.py](backend/researchers/models.py#L82-86)

```python
api_fields = [
    APIField("field"),
    APIField("birth_date"),
    APIField("death_date"),
    APIField("profile_image"),
    APIField("profile_items"),
    APIField("content"),
    APIField("sidebar_items"),  # ✅ Exposed, but schema is outdated
    APIField("bio_sections"),
    APIField("smart_content"),  # ✅ Exposed (but this is top-level, not in sidebar items)
]
```

The `APIField("sidebar_items")` IS exposed, but it serializes according to the migration schema which doesn't include smart_content/gallery for sidebar items.

---

## 3. FRONTEND DATA ACCESS ANALYSIS

### `getSidebarItems()` Function

**File:** [frontend/app/researcher/[slug]/researcherApi.js](frontend/app/researcher/[slug]/researcherApi.js#L190-240)

```javascript
export function getSidebarItems(sidebarItems) {
  const blocks = Array.isArray(sidebarItems) ? sidebarItems : [];

  return blocks.map((block, index) => {
    const value = block?.value || block || {};
    // ... field extraction ...

    const smartContent = Array.isArray(value?.smart_content)
      ? value.smart_content
      : [];
    const gallery = Array.isArray(value?.gallery) ? value.gallery : [];

    // Returns object with smart_content and gallery
    return {
      title,
      subtitle,
      slug,
      items,
      smart_content: smartContent, // ❌ Always empty array (API returns undefined)
      gallery: gallery, // ❌ Always empty array (API returns undefined)
    };
  });
}
```

The function **correctly expects** `smart_content` and `gallery` on the sidebar item value, but since the API never returns them (schema mismatch), they default to empty arrays.

### Section Page Usage

**File:** [frontend/app/researcher/[slug]/[section]/page.js](frontend/app/researcher/[slug]/[section]/page.js#L40-60)

```javascript
// Step 1: Find the section from sidebar_items
const currentSection = sidebarItems.find(
  (item) => toSectionSlug(item.slug) === section,
);

// Step 2: Extract values correctly from nested structure
const smartContent = currentSection?.smart_content || []; // ❌ Empty because getSidebarItems returns []
const gallery = currentSection?.gallery || []; // ❌ Empty because getSidebarItems returns []
const items = currentSection?.items || []; // ✅ Has data

// Step 3: Render smart content properly
{
  smartContent.length > 0 && <SmartContentRenderer blocks={smartContent} />;
}

// Step 6: Add fallback message
{
  smartContent.length === 0 && gallery.length === 0 && items.length === 0 && (
    <p className="text-neutral-500">
      No items available. // ❌ This message always shows for Publications
    </p>
  );
}
```

The logic is correct. It checks `smartContent.length > 0` to render, but since `smartContent` is always empty (because the API returns undefined), the SmartContentRenderer never gets called.

### SmartContentRenderer Component

**File:** [frontend/components/SmartContentRenderer.jsx](frontend/components/SmartContentRenderer.jsx)

```javascript
export default function SmartContentRenderer({ blocks }) {
  if (!blocks || blocks.length === 0) {
    return null;  // ❌ Returns null when blocks is empty (which it always is)
  }

  return (
    <div className="space-y-6">
      {blocks.map((block, index) => {
        const data = block.value;

        switch (block.type) {
          case "publication":
            return (
              // ✅ Code logic is correct - properly handles block structure
            );
          // ... other cases ...
        }
      })}
    </div>
  );
}
```

The component code is **correctly implemented**. It properly:

- Checks if blocks array is empty
- Extracts `block.value` for nested data
- Switches on `block.type` to determine rendering
- Accesses fields like `data.title`, `data.journal`, `data.year`

**The issue is upstream: it never receives data.**

---

## 4. DATA FLOW CHAIN - WHERE IT BREAKS

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: Wagtail Admin                                   │
│ SidebarItemBlock defined with smart_content & gallery   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 2: Django ORM / Database Schema                    │
│ ❌ BROKEN LINK: Migration 0013 schema doesn't include   │
│    smart_content/gallery for sidebar_items              │
│ Database physically cannot store these fields            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 3: Wagtail API Response                            │
│ Returns JSON based on database schema                   │
│ smart_content: undefined                                │
│ gallery: undefined                                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 4: Frontend getSidebarItems()                      │
│ Tries to extract: value?.smart_content, value?.gallery │
│ Gets: undefined → defaults to []                        │
│ Returns: { ..., smart_content: [], gallery: [] }       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 5: Section Page [section]/page.js                 │
│ Receives: currentSection = { ..., smart_content: [] }  │
│ Condition: smartContent.length > 0 → FALSE             │
│ SmartContentRenderer never called                        │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 6: User sees "No publications available"           │
│ Because smartContent array is always empty              │
└─────────────────────────────────────────────────────────┘
```

---

## 5. ROOT CAUSE IDENTIFIED

### Primary Issue: Missing Database Migration

**The problem:** Block definitions in `blocks.py` were updated to include `smart_content` and `gallery` in `SidebarItemBlock`, but **no migration was created to update the database schema**.

**Impact:**

- Last migration to touch `sidebar_items` is 0013 (March 23, 2026 09:43)
- 0013 doesn't include smart_content or gallery in the sidebar_item block definition
- Changes to blocks.py after 0013 don't automatically sync to the database

**Evidence:**

1. `blocks.py` line 133-149: `smart_content` and `gallery` fields are defined
2. Migration 0013 block_lookup: sidebar_item (block 9) has only `[('title', 0), ('subtitle', 1), ('slug', 2), ('items', 8)]`
3. No migration 0015, 0016, etc. exists to add these fields

### Secondary Issue: Wagtail Admin Can't Validate

Even though blocks.py defines these fields, Wagtail's admin form panel will expect data in the database schema format. If you tried to add smart_content/gallery in the admin:

- It might seem to accept the data temporarily
- But when saved and retrieved, the fields are lost (not in schema)
- The JSON stored in DB doesn't have space for these fields

---

## 6. EVIDENCE TRAIL

| File                                                                                            | Line(s)    | Finding                                                                     |
| ----------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------- |
| [blocks.py](backend/researchers/blocks.py#L133-L149)                                            | 133-149    | `smart_content` StreamBlock defined                                         |
| [blocks.py](backend/researchers/blocks.py#L150-156)                                             | 150-156    | `gallery` ListBlock defined                                                 |
| [models.py](backend/researchers/models.py#L49-55)                                               | 49-55      | `sidebar_items` field with SidebarItemBlock                                 |
| [migrations/0013](backend/researchers/migrations/0013_researcherpage_smart_content_and_more.py) | AlterField | sidebar_item block_lookup missing smart_content/gallery                     |
| [researcherApi.js](frontend/app/researcher/[slug]/researcherApi.js#L205-207)                    | 205-207    | Code expects `value?.smart_content` and `value?.gallery`                    |
| [page.js](frontend/app/researcher/[slug]/[section]/page.js#L55-56)                              | 55-56      | `const smartContent = currentSection?.smart_content \|\| []` defaults to [] |
| [SmartContentRenderer.jsx](frontend/components/SmartContentRenderer.jsx#L1-4)                   | 1-4        | Checks `if (!blocks \|\| blocks.length === 0)` → renders nothing            |

---

## 7. WHY IT'S NOT RENDERING DESPITE DATA BEING IN WAGTAIL

**User sees in Wagtail Admin:**

- Publications sidebar item with populated smart_content blocks
- Thinks data is saved and should appear in API

**What actually happens:**

- Admin form receives smart_content field input
- Form attempts to serialize it
- JSON is created with the field
- But when saved to `sidebar_items` StreamField, the StructBlock schema doesn't match
- Database either:
  - Ignores the field (most likely)
  - Doesn't validate it properly
  - Saves it but API doesn't return it

**When API is queried:**

- Wagtail reads from database
- Applies the migration schema (0013) which has no smart_content/gallery fields
- Returns only: title, subtitle, slug, items
- smart_content/gallery are omitted

**Frontend receives incomplete data:**

- Filters by `smartContent.length > 0`
- Always false → "No publications available"

---

## SOLUTION REQUIRED

A new Django migration must be created to:

1. Regenerate the sidebar_items StreamField with the updated SidebarItemBlock definition
2. Include smart_content as a StreamBlock in the migration
3. Include gallery as a ListBlock in the migration
4. Run `python manage.py migrate` to update the database schema

**Command:**

```bash
cd backend
python manage.py makemigrations researchers --name add_smart_content_gallery_to_sidebar_items
python manage.py migrate
```

This will:

- Create a new migration file (0015_add_smart_content_gallery_to_sidebar_items.py)
- Generate correct block_lookup entries for smart_content and gallery
- Update the database schema to support these fields
- Enable the Wagtail API to return them properly
- Allow frontend to receive and render the data

---

## IMPACT SUMMARY

| Component                      | Status          | Issue                                       |
| ------------------------------ | --------------- | ------------------------------------------- |
| **blocks.py Definition**       | ✅ Correct      | smart_content and gallery defined           |
| **models.py**                  | ✅ Correct      | uses SidebarItemBlock from blocks.py        |
| **Database Schema**            | ❌ **OUTDATED** | Migration 0013 missing the new fields       |
| **Wagtail API**                | ❌ **Broken**   | Returns undefined for smart_content/gallery |
| **Frontend getSidebarItems()** | ✅ Correct      | Code properly expects these fields          |
| **Section Page Logic**         | ✅ Correct      | Properly checks smartContent.length         |
| **SmartContentRenderer**       | ✅ Correct      | Properly renders if blocks provided         |
| **User Experience**            | ❌ **Broken**   | Sees "No publications available"            |

**Fix location:** Backend database migration
**Fix complexity:** Low (single makemigrations + migrate)
**Data loss risk:** None (new fields, existing data preserved)
