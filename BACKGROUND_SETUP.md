# Background Pattern Setup Instructions

## Overview

The website has been configured to use a repeating architectural sketch pattern as the global background. All code changes are complete, but the pattern image needs to be added manually.

## Status

✅ **Code Changes Complete:**

- `frontend/app/globals.css` - Background CSS configured
- `frontend/app/layout.js` - Site container wrapper added
- `frontend/public/assets/background/` - Directory created
- All components updated to render rich text with proper styling

⏳ **Pending:** Add the pattern image file

## Step-by-Step Setup

### 1. Locate the Pattern Image

You have the architectural sketch pattern image. It should be a PNG file showing light gray building sketches with a repeating, tileable pattern.

### 2. Save the Image

Save the pattern image as:

```
frontend/public/assets/background/rri-pattern.png
```

**File Requirements:**

- **Filename:** `rri-pattern.png` (must match exactly)
- **Format:** PNG (recommended) or JPG
- **Size:** Recommend 600px × 600px (to match `background-size: 600px` in CSS)
- **Quality:** Light gray tones for subtle background effect

### 3. Verify Installation

Once the image is placed, the background will automatically appear on all pages:

- The pattern repeats seamlessly
- It's fixed in place (doesn't scroll)
- A semi-transparent white overlay keeps text readable
- Academic archive style is maintained

## CSS Configuration

The background is controlled by these CSS rules in `globals.css`:

```css
body {
  background-color: #f8f6f2;
  background-image: url("/assets/background/rri-pattern.png");
  background-repeat: repeat;
  background-size: 600px;
  background-attachment: fixed;
}
```

If you want to adjust the pattern appearance:

- **Opacity/darkness:** Adjust `.site-container` background opacity in globals.css
- **Pattern scale:** Change `background-size: 600px` to a different value
- **Pattern position:** Add `background-position` property

## Testing the Background

After placing the image:

1. **Start the development server:**

   ```bash
   cd frontend
   npm run dev
   ```

2. **Open http://localhost:3000 in your browser**

3. **Verify:**
   - Background pattern visible on all pages
   - Pattern repeats seamlessly
   - Gray architectural sketches are visible
   - White semi-transparent overlay keeps text readable
   - Works on home page, researcher pages, and all routes

## Troubleshooting

**Background not visible?**

1. Check file is at exact path: `frontend/public/assets/background/rri-pattern.png`
2. Verify filename matches exactly (case-sensitive on some systems)
3. Clear browser cache (Ctrl+Shift+Delete)
4. Restart dev server: `npm run dev`

**Pattern looks wrong/distorted?**

1. Check image size (recommend 600px×600px)
2. Ensure image is a proper PNG/JPG file
3. Verify image has no transparency borders
4. Try adjusting `background-size` value in globals.css

**Text hard to read?**

1. Adjust `.site-container` background opacity in globals.css
2. Change from `rgba(255, 255, 255, 0.85)` to higher opacity (0.90+)

## What's Included

### Backend Updates (Complete)

✅ `backend/researchers/blocks.py`

- All RichTextBlock fields configured with full formatting options:
  - Bold, italic, underline, links, lists, headings
- `RICH_TEXT_FEATURES` constant defines supported formatting

### Frontend Updates (Complete)

✅ `frontend/app/globals.css`

- Background pattern CSS
- Typography system (Playfair Display + Libre Baskerville)
- Rich text styling (.rich-text-content class)
- Section headings and dividers
- Serif font import from Google Fonts

✅ `frontend/app/layout.js`

- Site container wrapper for overlay effect
- Updated metadata

✅ Component Updates

- `BiographySections.jsx` - Added rich-text-content class
- `StreamFieldRenderer.jsx` - Added rich-text-content class
- `BioBlock.jsx` - Added rich-text-content class

### Database Migrations (Applied)

✅ Migration 0012 applied - Updated block definitions with full RichText features

## Rich Text Formatting Support

Editors can now use these formatting options in Wagtail:

- **Bold** - strong text
- **Italic** - emphasized text
- **Underline** - underlined text
- **Links** - clickable URLs
- **Unordered lists** - bullet points
- **Ordered lists** - numbered lists
- **Headings** - h2, h3, h4 styles

All formatting renders correctly on the frontend with academic archive styling.

## Academic Archive Styling

The typography system uses:

- **Headings:** Playfair Display serif font
- **Body text:** Libre Baskerville serif font
- **Accent color:** Red (#8b1f1f)
- **Background:** Beige (#f8f6f2)
- **Overlay:** Semi-transparent white (0.85 opacity)

This creates a professional university archive aesthetic throughout the site.

---

**Note:** The background image directory is ready at `frontend/public/assets/background/`. Just add the PNG file and the background will activate on all pages!
