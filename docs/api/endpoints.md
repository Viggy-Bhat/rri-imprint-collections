# API Endpoint Reference

> **Purpose**: Complete reference for all backend API endpoints consumed by the Next.js frontend.
> **Audience**: Frontend developers integrating with the backend; API consumers.
> **Prerequisites**: [System architecture overview](../architecture/system-overview.md).
> **Related**: [Backend project structure](../backend/project-structure.md), [Data flow architecture](../architecture/data-flow.md).

## Overview

The backend exposes 1 Wagtail built-in endpoint and 7 custom endpoints, all public and read-only with no authentication required. Most custom endpoints are cached server-side via Django's cache framework with moderate TTLs (180s--300s). The frontend consumes these endpoints via Server Components, client-side `fetch()`, and Next.js ISR (`revalidate`) patterns.

## Endpoint Reference Table

| Endpoint | Method | Cache | Source File | Purpose |
|----------|--------|-------|-------------|---------|
| `/api/v2/pages/` | GET | No cache (frontend sets `no-store`) | Wagtail built-in | Page tree with StreamField JSON |
| `/api/images/<id>/` | GET | 300s | `researchers/views.py:46` | Image file URL lookup |
| `/api/site-settings/` | GET | 300s | `researchers/views.py:69` | Institute configuration |
| `/api/researchers/<slug>/publications/` | GET | 300s | `researchers/api/archive_views.py:53` | Paginated publications |
| `/api/researchers/<slug>/guidance/` | GET | 300s | `researchers/api/archive_views.py:80` | Paginated guidance items |
| `/api/researchers/<slug>/news/` | GET | 180s | `researchers/api/archive_views.py:107` | Paginated news items |
| `/api/researchers/<slug>/sections/<section>/count/` | GET | 300s | `researchers/api/archive_views.py:134` | Item count for section |
| `/api/researchers/<slug>/sections/<section>/filtered-items/` | GET | 300s | `researchers/views.py:17` | Search/filter/sort items |

---

## 1. Wagtail Pages API (Built-in)

```
GET /api/v2/pages/
GET /api/v2/pages/?type=researchers.ResearcherPage
GET /api/v2/pages/?type=researchers.ResearcherPage&slug=<researcher_slug>
GET /api/v2/pages/?type=researchers.ResearcherSectionPage&child_of=<page_id>
```

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `type` | string | Wagtail content type in `app_label.ModelName` format |
| `child_of` | int | Filter pages that are children of the given page ID |
| `slug` | string | Filter pages by slug |

**Response shape** — Wagtail v2 page tree with nested StreamField blocks as `{type, value, id}` objects:

```json
{
  "meta": { "total_count": 3 },
  "items": [
    {
      "id": 5,
      "meta": {
        "type": "researchers.ResearcherPage",
        "slug": "john-doe",
        "first_published_at": "2024-01-15T10:30:00Z"
      },
      "title": "Dr. John Doe",
      "profile_image": null,
      "bio_sections": [
        {
          "type": "bio_section",
          "value": {
            "heading": "Research Interests",
            "content": "<p>Quantum optics and nonlinear dynamics.</p>"
          },
          "id": "abc123-uuid"
        }
      ],
      "sidebar_items": [
        {
          "type": "sidebar_item",
          "value": {
            "title": "Publications",
            "smart_content": [],
            "gallery": []
          },
          "id": "def456-uuid"
        }
      ],
      "profile_items": []
    }
  ]
}
```

**Key StreamField block types** appearing in the response:

- `bio_sections` — Array of `{type: "bio_section", value: {heading, content}}`
- `sidebar_items` — Array of `{type: "sidebar_item", value: {title, smart_content, gallery}}`
- `profile_items` — Array of profile metadata blocks
- `smart_content` — Nested within sidebar items; references publications/guidance/news/supervision

**Frontend caching:** The frontend explicitly uses `{cache: "no-store"}` for this endpoint to ensure fresh data from the CMS. No server-side cache is applied.

---

## 2. Image Endpoint

```
GET /api/images/<id>/
```

**Source:** `backend/researchers/views.py:44-65`

**Response:**

```json
{
  "id": 1,
  "title": "researcher-photo",
  "file": "/media/images/photo.max-900x900.jpg"
}
```

**Error cases:**

| Status | Condition | Response |
|--------|-----------|----------|
| 404 | `Image.DoesNotExist` | `{"error": "Image not found"}` |
| 500 | Unexpected exception | `{"error": "Internal server error"}` |

**Why a custom endpoint:** Wagtail's built-in v2 image API requires additional configuration (`wagtail.api.v2.router:WagtailAPIRouter` registration with `ImagesAPIEndpoint`) to expose image URLs. Rather than configuring the full v2 image API, a lightweight custom endpoint was built for the single use case.

**Frontend usage:** `frontend/app/lib/wagtailApi.js` — `fetchImageDetails(id)` and `fetchImageDetailsBatch(ids)`.

---

## 3. Site Settings

```
GET /api/site-settings/
```

**Source:** `backend/researchers/views.py:68-98`

**Response:**

```json
{
  "institute_name": "Raman Research Institute",
  "department": "Light and Matter Physics",
  "address": "C.V. Raman Avenue, Sadashivanagar, Bengaluru 560080",
  "phone": "+91 80 2293 2000",
  "email": "imprint@rri.res.in"
}
```

**Site resolution:** Uses `Site.find_for_request(request)` to resolve the current site; falls back to `Site.objects.first()` if no request-matched site exists.

**Fields:** All five fields are strings. If no `SiteSettings` object is configured for the resolved site, all fields fall back to empty strings (`""`).

**Frontend usage:** `frontend/app/lib/siteSettingsApi.js` — `getSiteSettings()` with `{next: {revalidate: 300}}` (5-minute ISR). Called from the root layout to populate the site header/footer.

---

## 4. Publications (Paginated)

```
GET /api/researchers/<slug>/publications/?limit=10&offset=0&search=&sort=title_asc&year=
```

**Source:** `backend/researchers/api/archive_views.py:53`

**Response:**

```json
{
  "items": [
    {
      "title": "Quantum Interference in Coupled Cavities",
      "link": "https://doi.org/10.1103/PhysRevLett.132.023602",
      "tag": "Journal: Physical Review Letters",
      "meta_text": "Year: 2024",
      "journal": "Physical Review Letters",
      "year": "2024"
    }
  ],
  "total": 42,
  "limit": 10,
  "offset": 0,
  "has_next": true,
  "has_previous": false
}
```

Uses the shared [Pagination Contract](#9-pagination-contract). Query parameters follow the [Shared Parameter Table](#shared-query-parameters). Item shape is built by `build_items_from_blocks` in `archive_service.py:11-83`.

---

## 5. Guidance (Paginated)

```
GET /api/researchers/<slug>/guidance/?limit=10&offset=0&search=&sort=title_asc&year=
```

**Source:** `backend/researchers/api/archive_views.py:80`

**Response:**

```json
{
  "items": [
    {
      "title": "Nonlinear Dynamics in Optical Cavities",
      "link": null,
      "tag": "Author: Jane Smith",
      "meta_text": "Year: 2023",
      "description": "PhD thesis on nonlinear cavity dynamics with applications to quantum metrology.",
      "author": "Jane Smith",
      "year": "2023"
    }
  ],
  "total": 12,
  "limit": 10,
  "offset": 0,
  "has_next": true,
  "has_previous": false
}
```

**Field notes:**
- `title` derives from `thesis_title` if present, otherwise falls back to the direct `title` field.
- `description` is available (unlike news items where it is always `""`).
- `author` is extracted from the `student_name` field.
- `tag` format: `"Author: <student_name>"`.
- `meta_text` format: `"Year: <year>"`.

Uses the shared [Pagination Contract](#9-pagination-contract).

---

## 6. News (Paginated)

```
GET /api/researchers/<slug>/news/?limit=10&offset=0&search=&sort=title_asc&year=
```

**Source:** `backend/researchers/api/archive_views.py:107`

**Response:**

```json
{
  "items": [
    {
      "title": "RRI Researchers Demonstrate Novel Cooling Technique",
      "link": "https://example.com/news/article",
      "tag": "Source: The Hindu",
      "meta_text": "Date: 2024-03-15",
      "description": ""
    }
  ],
  "total": 8,
  "limit": 10,
  "offset": 0,
  "has_next": false,
  "has_previous": false
}
```

**Field notes:**
- `title` is the headline.
- `description` is always `""` (news items do not carry description text in the current schema).
- `tag` format: `"Source: <source_name>"`.
- `meta_text` format: `"Date: <date>"`.
- No `author` or `journal` fields (unlike publications/guidance).

Uses the shared [Pagination Contract](#9-pagination-contract). Cache TTL is 180s (shorter than other endpoints, reflecting news being more time-sensitive).

---

## 7. Section Count

```
GET /api/researchers/<slug>/sections/<section>/count/
```

**Source:** `backend/researchers/api/archive_views.py:132-149`

**Response:**

```json
{
  "total": 42
}
```

Returns the total number of items in a researcher's sidebar section. Used by the frontend to display item counts before loading section content (e.g., "Publications (42)").

---

## 8. Filtered Items (Unused)

```
GET /api/researchers/<slug>/sections/<section>/filtered-items/?search=&sort=title_asc&year=
```

**Source:** `backend/researchers/views.py:15-41`

**Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | `""` | Case-insensitive substring search across title/author/journal |
| `sort` | string | `"title_asc"` | Sort mode (see [sort modes table](#sort-modes)) |
| `year` | string | `""` | Filter by extracted year (exact integer match) |

**Response:**

```json
{
  "items": [ ... ],
  "count": 15
}
```

**Response shape differences** from the paginated endpoints:
- Uses `count` instead of `total`
- No `limit`, `offset`, `has_next`, or `has_previous` fields
- Returns all matching items (no pagination)

**Usage status:** This endpoint is defined in the backend but is **not consumed by any frontend code** as of 2026-05-29. A search of the entire `frontend/` directory returned zero matches for `filtered-items`. The frontend exclusively uses the paginated endpoints (publications, guidance, news) via `FilterableArchiveSection.jsx`. This endpoint delegates to `archive_service.get_researcher_filtered_items()` which calls `filter_items()`. It is a candidate for removal if no external consumers depend on it.

---

## 9. Pagination Contract

All paginated endpoints (publications, guidance, news) return the following unified response shape:

```json
{
  "items": [],
  "total": 0,
  "limit": 10,
  "offset": 0,
  "has_next": false,
  "has_previous": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `items` | array | Array of content items for the current page |
| `total` | int | Total number of items across all pages (post-filter) |
| `limit` | int | Requested page size (0--50) |
| `offset` | int | Current starting position in the result set |
| `has_next` | boolean | `true` if more items exist after this page |
| `has_previous` | boolean | `true` if items exist before this page |

### Validation

Parsed by `_parse_pagination_params` in `archive_views.py:14-32`:

- `limit`: must be an integer 0--50. Values outside this range return **400** with an error message.
- `offset`: must be a non-negative integer. Negative or non-integer values return **400**.

### Edge Cases

- `limit=0` returns empty `items` with `total` reflecting the full count.
- `offset` beyond `total` returns empty `items` with `has_next: false`.

---

## Shared Query Parameters

All paginated endpoints and the filtered-items endpoint support these parameters:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | int | 10 | Items per page (0--50) |
| `offset` | int | 0 | Starting position |
| `search` | string | `""` | Search by title, author, and journal |
| `sort` | string | `"title_asc"` | Sort mode (see table below) |
| `year` | string/int | `""` | Filter by publication year (exact match) |

### Sort Modes

From `backend/researchers/utils/sorting.py:6-28`:

| Mode | Behavior |
|------|----------|
| `title_asc` | Alphabetical A--Z on title (default) |
| `title_desc` | Alphabetical Z--A on title |
| `author_asc` | By author name A--Z |
| `author_desc` | By author name Z--A |
| `journal_asc` | By journal name A--Z |
| `newest` | By year descending (latest first) |
| `oldest` | By year ascending (earliest first) |

**Correction note:** The existing documentation previously listed `year_asc` and `year_desc` as sort modes. These are **incorrect**. The actual implementation uses `newest` and `oldest`. Unrecognized sort options silently fall back to `title_asc`.

---

## 10. Filtering and Search Behavior

All filtering logic resides in `filter_items` (`backend/researchers/api/archive_service.py:189-217`).

### Search

- **Case-insensitive** substring match.
- Searches across three extracted fields: **title**, **author**, and **journal**.
- If any of these three fields contains the search term, the item is included.

### Field Extraction Logic

Items from different block types (publications, guidance, news) have different source fields. The filtering layer performs extraction to normalize them:

| Normalized field | Extraction priority |
|------------------|---------------------|
| `title` | Direct `title` field (all types) |
| `author` | 1. Labeled segment in `meta_text`/`description` (e.g., "Author: ...") <br> 2. Direct `author` or `student_name` field |
| `journal` | 1. Labeled segment in `meta_text`/`description` (e.g., "Journal: ...") <br> 2. Direct `journal` field |
| `year` | 1. Direct `year` field <br> 2. Regex scan of `meta_text`/`description`/`tag` for 4-digit year |

### Year Filtering

- Accepts a string that is parsed as an integer.
- Performs exact integer comparison against the extracted year.
- Items without a parsable year are excluded when a year filter is active.

### Sort Order

- Sort is applied **after** filtering.
- Items are first filtered by search/year, then sorted.
- Unrecognized sort mode values silently fall back to `title_asc`.

---

## 11. Error Responses

### 400 — Bad Request

Returned when query parameters fail validation in `_parse_pagination_params` (`archive_views.py:14-32`).

```json
{
  "error": "Invalid 'limit' parameter. Must be an integer between 0 and 50."
}
```

```json
{
  "error": "Invalid 'offset' parameter. Must be a non-negative integer."
}
```

### 404 — Not Found

Returned when the requested resource does not exist.

```json
{
  "error": "Researcher not found"
}
```

```json
{
  "error": "Image not found"
}
```

```json
{
  "error": "Section not found"
}
```

### 500 — Internal Server Error

Returned for unexpected failures. Caught exceptions are logged via `logger.exception` on the server.

```json
{
  "error": "Internal server error"
}
```

---

## 12. Authentication

No authentication is required for any API endpoint. All endpoints are public and read-only.

- The Wagtail admin interface (`/admin/`) uses **separate** session-based authentication and has no bearing on the public API.
- Django's CSRF protection applies to POST/PUT/PATCH/DELETE requests only. Since the public API has no write endpoints, CSRF is never a concern for API consumers.

---

## 13. Wagtail API Integration

The Pages API (`/api/v2/pages/`) is Wagtail's built-in REST API, registered in `backend/backend/urls.py` via:

```python
from wagtail.api.v2.router import WagtailAPIRouter
api_router = WagtailAPIRouter("wagtailapi")
api_router.register_endpoint("pages", PagesAPIViewSet)
```

Key integration details:

- **StreamField serialization:** Block values arrive as `{type: "block_type", value: {...}, id: "uuid"}` objects. The frontend must traverse this nested structure to extract content.
- **Profile images:** Defined in `researchers/models.py:108-111` using `ImageRenditionField("max-900x900")` on the `profile_image` API field. Returns a Wagtail image reference object (not a direct URL).
- **Custom endpoints:** Supplement the Pages API by providing pagination, server-side filtering, sorted results, and site configuration — capabilities not available through Wagtail's default v2 API.
- **Image endpoint:** Wagtail's v2 image API endpoint (`/api/v2/images/`) is not registered because the lightweight custom endpoint at `/api/images/<id>/` covers the single needed use case.

---

## 14. Frontend API Consumption Patterns

| Endpoint Group | Caller | Location | Pattern |
|---------------|--------|----------|---------|
| Pages API | Server Components | `app/page.js`, `app/researcher/[slug]/researcherApi.js` | `fetch()` in async page functions with `{cache: "no-store"}` |
| Image API | Utility layer | `app/lib/wagtailApi.js` | `fetchImageDetails()` and `fetchImageDetailsBatch()` |
| Site Settings | Root layout | `app/lib/siteSettingsApi.js` | `getSiteSettings()` with `{next: {revalidate: 300}}` |
| Paginated endpoints | Client component | `components/archive/FilterableArchiveSection.jsx` | Client-side `fetch()` in `useEffect`, no caching |
| Section count | Server page | `app/researcher/[slug]/section/[sectionSlug]/page.js` | `fetch()` with `{next: {revalidate: 300}}` |
| Filtered items | Server component | Legacy — being phased out | Server-side fetch |

### Patterns in Detail

**Server Components (Pages API, section count):**
```javascript
// app/page.js — Next.js Server Component
const res = await fetch(`${WAGTAIL_BASE}/api/v2/pages/?type=researchers.ResearcherPage`, {
  cache: "no-store",
});
```

**ISR (Site Settings):**
```javascript
// app/lib/siteSettingsApi.js
const res = await fetch(`${WAGTAIL_BASE}/api/site-settings/`, {
  next: { revalidate: 300 },
});
```

**Client-side (FilterableArchiveSection):**
```javascript
// components/archive/FilterableArchiveSection.jsx — "use client"
useEffect(() => {
  fetch(`${WAGTAIL_BASE}/api/researchers/${slug}/publications/?${params}`)
    .then(res => res.json())
    .then(setData);
}, [slug, search, sort, year, page]);
```

**Image URL prefixing:** The Wagtail API returns relative URLs (e.g., `/media/images/photo.jpg`). The frontend prefixes these with `NEXT_PUBLIC_WAGTAIL_BASE_URL` (default `http://127.0.0.1:8000`) before rendering.

---

## 15. Verification Notes

The following items have been verified or require manual confirmation against the live API:

1. **Sort modes (corrected):** The existing documentation previously listed `year_asc` and `year_desc` as valid sort values. The actual implementation in `backend/researchers/utils/sorting.py:6-28` uses `newest` and `oldest`. The frontend (`FilterableArchiveSection.jsx`) does not send `year_asc`/`year_desc`.

2. **Filtered-items endpoint usage (verified):** A full search of the `frontend/` directory on 2026-05-29 returned zero matches for `filtered-items`. The endpoint is defined in the backend but not consumed by any frontend code. It is a candidate for removal.

3. **Cache TTLs:** The current TTL values (300s for most endpoints, 180s for news) were chosen for moderate-traffic use. Re-evaluate if traffic patterns or content freshness requirements change.

4. **Guidance title field:** Verify that `thesis_title` fallback behavior (try `thesis_title`, then `title`) matches the expected data shape in the Wagtail admin for guidance blocks.
