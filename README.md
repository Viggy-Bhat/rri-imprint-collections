# RRI Imprint Collections - Consolidated Project README

This README replaces multiple top-level progress documents with one complete, up-to-date reference for what has been implemented so far.

## Project Overview

RRI Imprint Collections is a full-stack web platform for publishing researcher profile pages and structured scholarly content.

- Backend: Django + Wagtail CMS + SQLite
- Frontend: Next.js App Router + React
- Data model: StreamField-driven researcher content (profile, bio sections, sidebar sections, smart content, gallery)

## Completed Work So Far

### 1. Global Visual Theme and Layout

Implemented a global academic-style visual system:

- Repeating background pattern support at `frontend/public/assets/background/rri-pattern.png`
- Site-wide overlay container for readability (`.site-container`)
- Serif typography system with heading/body hierarchy
- Archive-style color palette and spacing system

Notes:

- If the background image file is missing, the fallback background color still renders.
- Previous pattern setup docs are now consolidated into this README.

### 2. Rich Text Formatting End-to-End

Enabled rich text formatting in Wagtail and frontend rendering:

- Bold, italic, underline, links
- Ordered and unordered lists
- Heading levels (h2, h3, h4)
- Styled blockquotes and consistent link appearance

Backend implementation:

- RichTextBlock feature sets declared in researcher block definitions

Frontend implementation:

- Rich text styling class and typography rules
- HTML rendering in researcher content components

### 3. Smart Content and Gallery Rendering (Critical Fix)

Root cause that was fixed:

- Sidebar block schema in migrations did not include `smart_content` and `gallery` even though blocks were defined in code.
- API therefore returned missing/empty values, so frontend showed fallback empty states.

Fix implemented:

- New migration chain added and applied to align schema with current block definitions.
- Frontend extraction and section rendering logic verified for nested `value.smart_content` and `value.gallery` structures.
- Smart content rendering component verified for supported block types.

Result:

- Publications, guidance, news, supervision, and gallery data now flow correctly from Wagtail to Next.js pages when content is populated and published.

### 4. Frontend Researcher Experience Improvements

Frontend changes across researcher and layout components include:

- Improved section page rendering/fallback behavior
- Breadcrumb/navigation enhancements
- Header/footer/layout updates
- Additional researcher-related components and gallery support

### 5. Migration and Data State

Backend migrations include newer researcher migration files and schema updates for sidebar content structures.

- Migration sequence includes post-0013 updates to correct schema mismatch
- Database currently reflects local development progress

## Architecture and Data Flow

1. Editors create structured content in Wagtail.
2. Content is stored in StreamField JSON structures in the backend database.
3. Wagtail API exposes researcher pages and nested block values.
4. Next.js fetches API data and normalizes sidebar/profile/content blocks.
5. React components render smart content, rich text, and galleries.

## Current Repository State

There are many in-progress code changes in both backend and frontend, including:

- Backend settings/models/blocks/migrations and media assets
- Frontend app components, routing pages, styles, and package metadata

This README reflects those cumulative implementation efforts as of April 22, 2026.

## Local Development

### Backend

```bash
cd backend
source ../.venv/Scripts/activate
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Validation Checklist

- Backend starts without system check errors
- Migrations apply successfully
- Frontend builds successfully
- Researcher section pages render smart content when provided
- Gallery blocks display images and captions
- Rich text formatting appears correctly in biography/content/sidebar text

## Known Operational Notes

- Ensure pages are published in Wagtail for API visibility.
- Ensure section slugs in content match frontend route expectations.
- For global pattern visuals, keep `rri-pattern.png` at:
  - `frontend/public/assets/background/rri-pattern.png`

## What This README Replaces

This consolidated README replaces these previous top-level files:

- `BACKGROUND_SETUP.md`
- `IMPLEMENTATION_SUMMARY.md`
- `INVESTIGATION_FINDINGS_DETAILED.md`
- `QUICK_REFERENCE.md`
- `SMART_CONTENT_DEBUG_ANALYSIS.md`
- `SMART_CONTENT_FIX_SUMMARY.md`

## Next Recommended Steps

1. Finalize which generated/runtime artifacts should be tracked (for example `.pyc`, SQLite, and media variations).
2. Add or refine `.gitignore` to avoid noisy commits.
3. Run one final backend + frontend smoke test before deployment.
4. Tag this commit as the baseline for the consolidated documentation state.
