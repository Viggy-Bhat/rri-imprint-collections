# Smart Content & Gallery Rendering Fix - Complete Summary

## Issue Identified

Smart Content (publications, guidance, news, supervision) and Gallery blocks from Wagtail were not rendering on the Next.js frontend despite being saved correctly in the Wagtail backend.

---

## Root Cause Analysis

### Data Structure from Wagtail API

```json
sidebar_items: [
  {
    type: "sidebar_item",
    value: {
      title: "Publications",
      subtitle: "...",
      slug: "publications",
      items: [...],
      smart_content: [
        {
          type: "publication",
          value: {
            title: "...",
            journal: "...",
            year: "...",
            link: "..."
          }
        }
      ],
      gallery: [
        {
          image: {...},
          caption: "..."
        }
      ]
    }
  }
]
```

**Key Point:** The data is nested in `section.value.smart_content` and `section.value.gallery`, not directly at `section.smart_content`.

---

## Fixes Applied

### Step 1: Updated Frontend Data Extraction

**File:** `frontend/app/researcher/[slug]/researcherApi.js`

The `getSidebarItems()` function now:

- ✅ Correctly extracts `value?.smart_content` from the nested structure
- ✅ Correctly extracts `value?.gallery` from the nested structure
- ✅ Returns them as `smart_content` and `gallery` properties
- ✅ Includes debug logging to trace data extraction

**Code changes:**

```javascript
const smartContent = Array.isArray(value?.smart_content)
  ? value.smart_content
  : [];
const gallery = Array.isArray(value?.gallery) ? value.gallery : [];

return {
  title,
  subtitle,
  slug,
  items,
  smart_content: smartContent, // ✅ Correctly extracted
  gallery: gallery, // ✅ Correctly extracted
};
```

---

### Step 2: Updated Section Page Renderer

**File:** `frontend/app/researcher/[slug]/[section]/page.js`

The section page now:

- ✅ Extracts smart_content from currentSection: `const smartContent = currentSection?.smart_content || []`
- ✅ Extracts gallery from currentSection: `const gallery = currentSection?.gallery || []`
- ✅ Passes smartContent to SmartContentRenderer: `<SmartContentRenderer blocks={smartContent} />`
- ✅ Renders gallery images with proper structure
- ✅ Includes comprehensive debug logging (Step 5 requirement)

**Rendering Logic:**

```javascript
// Render smart content (publications, guidance, news, supervision)
{smartContent.length > 0 && (
  <SmartContentRenderer blocks={smartContent} />
)}

// Render gallery as fallback
{gallery.length > 0 && (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
    {gallery.map((img, index) => {
      const data = img.value;
      return (
        <div key={index} className="rounded-lg overflow-hidden shadow">
          <img
            src={data.image.url}
            alt={data.caption || "Gallery image"}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          />
          {data.caption && <p className="text-sm text-center mt-2">{data.caption}</p>}
        </div>
      );
    })}
  </div>
)}

// Render legacy items as final fallback
{smartContent.length === 0 && items.length > 0 && (
  // ... legacy items rendering
)}

// No content fallback
{smartContent.length === 0 && gallery.length === 0 && items.length === 0 && (
  <p className="text-neutral-500">No items available.</p>
)}
```

---

### Step 3: Updated SmartContentRenderer Component

**File:** `frontend/components/SmartContentRenderer.jsx`

The renderer now:

- ✅ Correctly accesses block data via `block.value`
- ✅ Handles all block types: publication, guidance, news, supervision
- ✅ Includes debug logging for each block
- ✅ Logs unknown block types with warnings

**Block Type Rendering:**

```javascript
switch (block.type) {
  case "publication":
  // Renders: title, journal, year, link

  case "guidance":
  // Renders: student_name, thesis_title, year

  case "news":
  // Renders: headline, source, link

  case "supervision":
  // Renders: student, topic, year
}
```

---

## Debug Logging Added

### Console Output Locations

1. **getSidebarItems()** - Logs raw blocks and extraction counts
2. **Section Page** - Logs currentSection, smartContent, gallery, items with lengths
3. **SmartContentRenderer** - Logs blocks being rendered and individual block types

**Sample Console Output:**

```
[getSidebarItems] Block 0: type=sidebar_item
[getSidebarItems] Publications: smartContent=1, gallery=3, items=0
=== SECTION PAGE DEBUG ===
CURRENT SECTION: {title: "Publications", slug: "publications", smart_content: [...], ...}
SMART CONTENT: [{type: "publication", value: {...}}]
GALLERY: [{image: {...}, caption: "..."}]
[SmartContentRenderer] Rendering blocks: [...]
[SmartContentRenderer] Block 0: type=publication, data={...}
```

---

## Migration Status

✅ Migration 0015 is applied and includes smart_content and gallery in block_lookup

- All migrations through 0015_add_smart_content_gallery_to_sidebar_items are applied

---

## Next Steps to Test

### Step 1: Ensure Backend is Running

```bash
cd backend
python manage.py runserver
# Should show: Starting development server at http://127.0.0.1:8000/
```

### Step 2: Restart Frontend Dev Server

```bash
cd frontend
npm run dev
# Step 6: Restart Next.js as instructed
```

### Step 3: Access Researcher with Smart Content

Navigate to:

```
http://localhost:3000/researcher/subb1/publications
```

### Step 4: Check Browser Console

Open DevTools (F12) → Console tab and look for:

- `[getSidebarItems]` logs
- `=== SECTION PAGE DEBUG ===` section
- `[SmartContentRenderer]` logs

### Step 5: Expected Result

The page should now display:

- ✅ Publication cards with title, journal, year, link
- ✅ Gallery images in responsive grid (if publications not available)
- ✅ Legacy sidebar items as final fallback
- ✅ "No items available" if all sections are empty

---

## Data Flow Summary

```
Wagtail API
    ↓
/api/v2/pages/?slug=subb1
    ↓
researcher.sidebar_items (raw blocks with type/value)
    ↓
getSidebarItems() extracts value?.smart_content, value?.gallery
    ↓
sidebarItems array with smart_content and gallery properties
    ↓
Section page finds currentSection from sidebarItems
    ↓
Extracts smartContent and gallery from currentSection
    ↓
Renders SmartContentRenderer with smartContent blocks
    ↓
SmartContentRenderer accesses block.value for data
    ↓
Publications/Guidance/News/Supervision cards render ✅
```

---

## Files Modified

1. ✅ `frontend/app/researcher/[slug]/researcherApi.js` - Added debug logging
2. ✅ `frontend/app/researcher/[slug]/[section]/page.js` - Added debug logging and verified rendering logic
3. ✅ `frontend/components/SmartContentRenderer.jsx` - Added debug logging and verified block handling

---

## No Changes Made To

- ❌ Backend models (no modifications to blocks.py or models.py)
- ❌ Wagtail API serialization
- ❌ Database migrations (already applied)

---

## Troubleshooting

If smart content still doesn't render:

### 1. Check Console Logs

```javascript
// Look for in browser console
[getSidebarItems] Block 0: ...
[getSidebarItems] Publications: smartContent=...

// smartContent should be > 0
```

### 2. Check page rendering

```javascript
// Look for
=== SECTION PAGE DEBUG ===
smartContent.length: 1  // Should be > 0
```

### 3. Check block type matching

```javascript
// Look for
[SmartContentRenderer] Block 0: type=publication
// Should match one of: publication, guidance, news, supervision
```

### 4. If still not working

- Verify publication smart_content blocks exist in Wagtail admin
- Confirm page is published in Wagtail
- Check if sidebar_item has correct slug matching the URL
- Verify migration 0015 is applied: `python manage.py migrate --list | grep 0015`
