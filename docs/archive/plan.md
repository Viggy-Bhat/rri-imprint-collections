# Architecture Hardening Plan

## Current State

The project has a STABLE working implementation with:
- Backend-side filtering, pagination, and type-specific endpoints
- Frontend pagination (10 items/page) with reduced payload sizes
- StreamField architecture preserved (no migrations, no schema changes)

**Problem**: `researchers/views.py` is 579 lines mixing request handling, filtering, pagination, block extraction, sorting, and response formatting.

---

## Key Decisions

| Question | Decision |
|----------|----------|
| Test runner | Django built-in (`python manage.py test researchers`) |
| Test structure | `tests/` directory with 5 files |
| Invalid query params | Return **400 Bad Request** with descriptive error |

---

## Phase 1 — Backend Modularization

### Target Structure

```
backend/researchers/
├── api/
│   ├── __init__.py
│   └── archive_views.py          # 4 paginated endpoints + count endpoint
├── services/
│   ├── __init__.py
│   └── archive_service.py        # extract_and_filter_by_type + pagination orchestration
├── utils/
│   ├── __init__.py
│   ├── text_utils.py             # to_plain_text, to_section_slug, extract_labeled_segment
│   ├── mapping_utils.py          # normalize_mapping, get_mapping_value
│   ├── item_extractors.py        # get_author, get_journal, get_year
│   ├── sorting.py                # sort_results
│   └── pagination.py             # paginate_items
├── views.py                      # thin: request parsing → service calls → JsonResponse
├── tests/                        # expanded test suite
│   ├── __init__.py
│   ├── test_pagination.py
│   ├── test_filtering.py
│   ├── test_archive_service.py
│   ├── test_archive_views.py
│   └── test_edge_cases.py
```

### Step 1A — `utils/text_utils.py`

Extract 3 pure text functions (no dependencies):

```python
def to_plain_text(value):
    """Strip HTML tags, collapse whitespace."""

def to_section_slug(value):
    """Normalize string to kebab-case slug."""

def extract_labeled_segment(source, labels):
    """Extract labeled segments via regex (e.g. 'Author: Smith')."""
```

### Step 1B — `utils/mapping_utils.py`

Extract 2 mapping helpers (no dependencies):

```python
def normalize_mapping(value):
    """Coerce value to dict safely."""

def get_mapping_value(value, key, default=""):
    """Dict/attr fallback getter."""
```

### Step 1C — `utils/item_extractors.py`

Extract 3 item field extractors (depends on `text_utils`, `mapping_utils`):

```python
def get_author(item):
    """Extract author from meta_text, description, or author field."""

def get_journal(item):
    """Extract journal from meta_text, description, or journal field."""

def get_year(item):
    """Extract year from direct field or regex scan of text fields."""
```

### Step 1D — `utils/sorting.py`

Extract sort function (depends on `item_extractors`, `text_utils`, `mapping_utils`):

```python
def sort_results(results, sort_option):
    """Sort by title_asc/desc, author_asc/desc, journal_asc, newest, oldest."""
```

Supported sort modes:
- `title_asc` (default) — alphabetical A→Z
- `title_desc` — alphabetical Z→A
- `author_asc` — by author name A→Z
- `author_desc` — by author name Z→A
- `journal_asc` — by journal name A→Z
- `newest` — by year descending
- `oldest` — by year ascending

### Step 1E — `utils/pagination.py`

Extract pagination utility (no dependencies):

```python
def paginate_items(items, limit=10, offset=0):
    """Split list into page. Returns {items, total, limit, offset, has_next, has_previous}."""
```

### Step 1F — `services/archive_service.py`

Extract 5 service functions (depends on all utils):

```python
def build_items_from_blocks(blocks):
    """Convert StreamField blocks (publication/guidance/news) to normalized dicts."""

def extract_and_filter_by_type(researcher_page, block_type, search="", sort_option="title_asc", year=""):
    """Scan sidebar_items + section pages for block type, build items, filter+sort."""

def build_section_items(researcher_page, section_slug):
    """Build section items from StreamField sidebar or ResearcherSectionPage.smart_content."""

def filter_items(items, search_term="", sort_option="title_asc", year=""):
    """Search by title/author/journal, filter by year, apply sort."""

def get_researcher_filtered_items(slug, section_slug, search_term="", sort_option="title_asc", year=""):
    """Resolve researcher page, build section items, filter+sort. Returns None if not found."""
```

Dependency graph:
```
filter_items → sort_results → get_author, get_journal, get_year
build_items_from_blocks → normalize_mapping, get_mapping_value
extract_and_filter_by_type → build_items_from_blocks, filter_items
build_section_items → build_items_from_blocks
get_researcher_filtered_items → build_section_items, filter_items
```

### Step 1G — `api/archive_views.py`

Move 4 view functions (depends on `services.archive_service`, `utils.pagination`):

```python
@require_GET
@cache_page(300)
def researcher_publications(request, slug):
    """GET /api/researchers/<slug>/publications/?search=&sort=&year=&limit=&offset="""

@require_GET
@cache_page(300)
def researcher_guidance(request, slug):
    """GET /api/researchers/<slug>/guidance/?search=&sort=&year=&limit=&offset="""

@require_GET
@cache_page(180)
def researcher_news(request, slug):
    """GET /api/researchers/<slug>/news/?search=&sort=&year=&limit=&offset="""

@require_GET
@cache_page(300)
def researcher_section_count(request, slug, section_slug):
    """GET /api/researchers/<slug>/sections/<section_slug>/count/ → {"total": N}"""
```

**Param validation** — return 400 for invalid inputs:

```python
try:
    limit = int(request.GET.get("limit", 10))
except (TypeError, ValueError):
    return JsonResponse({"error": "Invalid 'limit' parameter. Must be an integer."}, status=400)

if limit < 0 or limit > 50:
    return JsonResponse({"error": "'limit' must be between 0 and 50."}, status=400)

try:
    offset = int(request.GET.get("offset", 0))
except (TypeError, ValueError):
    return JsonResponse({"error": "Invalid 'offset' parameter. Must be an integer."}, status=400)

if offset < 0:
    return JsonResponse({"error": "'offset' must be non-negative."}, status=400)
```

### Step 1H — Rewrite `views.py`

Keep only 3 views (thin, delegates to services):

```python
@require_GET
@cache_page(300)
def researcher_section_filtered_items(request, slug, section_slug):
    """Existing filtered-items endpoint. Delegates to get_researcher_filtered_items()."""

@require_GET
@cache_page(300)
def image_detail(request, pk):
    """Image URL lookup endpoint."""

@require_GET
@cache_page(300)
def site_settings_detail(request):
    """Institute info endpoint."""
```

### Step 1I — Update `urls.py`

Change imports for archive endpoints:

```python
# Before
from researchers.views import (
    researcher_publications,
    researcher_guidance,
    researcher_news,
    researcher_section_count,
    ...
)

# After
from researchers.api.archive_views import (
    researcher_publications,
    researcher_guidance,
    researcher_news,
    researcher_section_count,
)
from researchers.views import (
    researcher_section_filtered_items,
    image_detail,
    site_settings_detail,
)
```

URL patterns remain **identical** — no route changes.

---

## Phase 2 — Testing + Hardening

### Test Runner
- Django built-in: `python manage.py test researchers`
- No pytest dependency
- `SimpleTestCase` for pure function tests (no DB)
- `TestCase` for DB-dependent tests

### `tests/test_pagination.py` (SimpleTestCase)

| Test | Input | Expected |
|------|-------|----------|
| `test_basic_pagination` | 25 items, limit=10, offset=0 | 10 items, has_next=True, has_previous=False |
| `test_second_page` | 25 items, limit=10, offset=10 | 10 items, has_next=True, has_previous=True |
| `test_last_page` | 25 items, limit=10, offset=20 | 5 items, has_next=False, has_previous=True |
| `test_offset_beyond_total` | 25 items, limit=10, offset=100 | 0 items, has_next=False |
| `test_empty_list` | 0 items, limit=10, offset=0 | 0 items, has_next=False, has_previous=False |
| `test_exact_page_boundary` | 20 items, limit=10, offset=10 | 10 items, has_next=False |

### `tests/test_filtering.py` (SimpleTestCase)

| Test | Description |
|------|-------------|
| `test_search_by_title` | search="quantum" matches title field |
| `test_search_by_author` | search="arora" matches author field |
| `test_search_by_journal` | search="radio" matches journal field |
| `test_year_filter` | year="1986" returns only 1986 items |
| `test_sort_title_asc` | alphabetical A→Z |
| `test_sort_title_desc` | alphabetical Z→A |
| `test_sort_newest` | by year descending |
| `test_sort_oldest` | by year ascending |
| `test_sort_author_asc` | by author name A→Z |
| `test_sort_author_desc` | by author name Z→A |
| `test_sort_journal_asc` | by journal name A→Z |
| `test_combined_search_year_sort` | all three params together |
| `test_empty_search_returns_all` | search="" returns all items |

### `tests/test_archive_service.py` (SimpleTestCase + mocks)

| Test | Description |
|------|-------------|
| `test_build_items_from_blocks_publication` | publication block → {title, link, tag, meta_text, journal, year} |
| `test_build_items_from_blocks_guidance` | guidance block → {title, link, tag, meta_text, description, author, year} |
| `test_build_items_from_blocks_news` | news block → {title, link, tag, meta_text, description} |
| `test_build_items_from_blocks_skips_empty_title` | block with no title → skipped |
| `test_extract_and_filter_by_type_sidebar` | blocks extracted from sidebar_items |
| `test_extract_and_filter_by_type_section_page` | blocks extracted from ResearcherSectionPage.smart_content |
| `test_filter_items_preserves_api_contract` | output has all required keys |

### `tests/test_archive_views.py` (SimpleTestCase + mocks)

| Test | Description |
|------|-------------|
| `test_publications_returns_paginated_response` | 200, {items, total, limit, offset, has_next, has_previous} |
| `test_guidance_returns_paginated_response` | 200, correct JSON shape |
| `test_news_returns_paginated_response` | 200, correct JSON shape |
| `test_section_count_returns_total` | `{"total": N}` |
| `test_404_for_unknown_researcher` | slug doesn't exist → 404 |
| `test_500_on_service_failure` | mock service raises → 500 with error message |

### `tests/test_edge_cases.py` (SimpleTestCase)

| Test | Description |
|------|-------------|
| `test_invalid_limit_returns_400` | limit="abc" → 400 |
| `test_invalid_offset_returns_400` | offset="xyz" → 400 |
| `test_limit_exceeds_50_returns_400` | limit=100 → 400 |
| `test_negative_limit_returns_400` | limit=-1 → 400 |
| `test_negative_offset_returns_400` | offset=-5 → 400 |
| `test_missing_params_uses_defaults` | no params → limit=10, offset=0, sort="title_asc" |
| `test_empty_sidebar_items` | researcher with no sidebar → empty results |
| `test_malformed_block_data` | blocks with missing keys → gracefully skipped |
| `test_api_response_contract_stability` | always returns {items, total, limit, offset, has_next, has_previous} |

---

## Phase 3 — Frontend Hardening

### Changes to `FilterableArchiveSection.jsx`

**3A. Skeleton loading state**

Replace plain text `"Loading filtered results..."` with skeleton cards:

```jsx
{isLoading && (
  <div className="space-y-3">
    {Array.from({ length: PAGE_SIZE }).map((_, i) => (
      <div key={i} className="animate-pulse rounded-xl border border-red-100 bg-white/95 px-5 py-4">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
      </div>
    ))}
  </div>
)}
```

**3B. Error state UI**

Add `[error, setError]` state. On fetch failure, show retry button:

```jsx
{error && (
  <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
    <p className="text-red-700 font-medium">Failed to load items</p>
    <button onClick={handleRetry} className="text-sm text-red-600 underline">
      Try again
    </button>
  </div>
)}
```

**3C. Pagination reset on filter change**

Ensure `setOffset(0)` is called before `fetchPage(0, ...)` in `handleApplyFilters` and `handleResetFilters`.

**3D. Empty state differentiation**

- `total === 0` on initial load → "No items available in this section."
- `total > 0` but `items.length === 0` after filtering → "No items match your filters. Try adjusting your search."

**3E. Key stability for list items**

Change from fragile `${item.title}-${item.meta_text || offset + index}` to stable `item-${offset}-${index}`.

---

## Phase 4 — Performance Improvements

### Cache Duration Tuning

| Endpoint | Current | New | Rationale |
|----------|---------|-----|-----------|
| Publications | `cache_page(120)` | `cache_page(300)` | Publications are stable content |
| Guidance | `cache_page(120)` | `cache_page(300)` | Guidance changes infrequently |
| News | `cache_page(120)` | `cache_page(180)` | News is more time-sensitive |
| Section count | `cache_page(300)` | `cache_page(300)` | Already optimal |
| Filtered items | `cache_page(300)` | `cache_page(300)` | Already optimal |

### Notes
- Django's `cache_page` already varies by full URL including query string — no additional `Vary` header needed
- These are public, unauthenticated endpoints — no `vary_on_cookie` needed
- Cache backend: Redis in production, LocMemCache in dev (configured in `settings/base.py`)

---

## Phase 5 — Documentation

### `docs/architecture/pagination-architecture.md`

Sections:

1. **Overview** — Scope and purpose
2. **Original Architecture** — Client-side filtering, all items fetched upfront
3. **Current Architecture** — Server-side filtering + pagination, type-specific endpoints
4. **Why StreamField Was Preserved** — Zero migrations, zero admin changes, backward compatible
5. **Backend Filtering Flow** — Request → Archive View → Archive Service → Block Extraction → Filter → Sort → Paginate → Response
6. **Pagination Design** — Offset-based, limit capped at 50, response contract
7. **API Endpoints** — Table of all endpoints with params and response shapes
8. **Caching Strategy** — Cache durations, cache key behavior
9. **Frontend Integration** — How FilterableArchiveSection fetches and renders
10. **Future Relational Migration Roadmap** — Extract blocks → proper models → new endpoints → deprecate old
11. **Testing Strategy** — What's tested, how to run tests

---

## Execution Order

```
Phase 1 (Modularization)
  ├── 1A-1E: Extract utils (no dependencies, parallel)
  ├── 1F: Extract services (depends on 1A-1E)
  ├── 1G: Extract archive views (depends on 1F)
  ├── 1H: Rewrite views.py (depends on 1F, 1G)
  └── 1I: Update urls.py (depends on 1G)

Phase 2 (Testing)
  ├── test_pagination.py (depends on 1E)
  ├── test_filtering.py (depends on 1A-1D, 1F)
  ├── test_archive_service.py (depends on 1F)
  ├── test_archive_views.py (depends on 1G)
  └── test_edge_cases.py (depends on 1G)

Phase 3 (Frontend) — Independent, can run in parallel with Phase 1

Phase 4 (Caching) — Minor tuning, run after Phase 1

Phase 5 (Docs) — Final step, depends on all phases complete
```

---

## Files to Create (16 new)

```
backend/researchers/api/__init__.py
backend/researchers/api/archive_views.py
backend/researchers/services/__init__.py
backend/researchers/services/archive_service.py
backend/researchers/utils/__init__.py
backend/researchers/utils/text_utils.py
backend/researchers/utils/mapping_utils.py
backend/researchers/utils/item_extractors.py
backend/researchers/utils/sorting.py
backend/researchers/utils/pagination.py
backend/researchers/tests/__init__.py
backend/researchers/tests/test_pagination.py
backend/researchers/tests/test_filtering.py
backend/researchers/tests/test_archive_service.py
backend/researchers/tests/test_archive_views.py
backend/researchers/tests/test_edge_cases.py
docs/architecture/pagination-architecture.md
```

## Files to Modify (5 existing)

```
backend/researchers/views.py          # thin down to 3 views + imports
backend/backend/urls.py               # update import source
backend/researchers/tests.py          # replace with tests/ directory (delete after migration)
frontend/app/components/FilterableArchiveSection.jsx  # harden UI
```

---

## Constraints (DO NOT violate)

- DO NOT regenerate migrations
- DO NOT modify StreamField schemas
- DO NOT rename Wagtail block types
- DO NOT create relational models yet
- DO NOT alter existing admin workflows
- DO NOT change current API response structures
- Preserve all runtime behavior

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Import circularity between utils/services | Strict dependency graph: utils → services → api → views |
| Tests require DB but use SimpleTestCase | Use `TestCase` for DB tests, `SimpleTestCase` for pure function tests |
| `urls.py` import breakage | Keep function names identical, only change import source |
| Frontend key instability | Use `offset-index` composite key since backend provides no IDs |
| Cache invalidation on content change | Accept stale cache for 3-5 min; editors can restart dev server if needed |
