# Pagination & Archive Architecture

## 1. Overview

This document describes the server-side filtering, pagination, and type-specific endpoint architecture for the RRI Imprint Collections project. The system provides efficient archive browsing for researcher publications, guidance, and news items without modifying the underlying Wagtail StreamField schema.

**Scope**: Backend API endpoints, service layer, utilities, frontend integration, and testing strategy.

---

## 2. Original Architecture

The initial implementation had all filtering, sorting, and pagination logic in a single `researchers/views.py` file (~579 lines). The frontend `FilterableArchiveSection.jsx` fetched all items upfront and performed client-side filtering, which became inefficient as data grew.

**Problems**:
- Single monolithic view file mixing request handling, filtering, pagination, block extraction, sorting, and response formatting
- No input validation for query parameters
- Plain text loading state with no error handling
- Fragile React list keys based on content values
- No differentiation between "no items" and "no matching items"

---

## 3. Current Architecture

The system now uses a layered architecture with clear separation of concerns:

```
backend/researchers/
├── api/
│   └── archive_views.py          # 4 paginated endpoints + count endpoint
├── services/
│   └── archive_service.py        # extract_and_filter_by_type + pagination orchestration
├── utils/
│   ├── text_utils.py             # to_plain_text, to_section_slug, extract_labeled_segment
│   ├── mapping_utils.py          # normalize_mapping, get_mapping_value
│   ├── item_extractors.py        # get_author, get_journal, get_year
│   ├── sorting.py                # sort_results
│   └── pagination.py             # paginate_items
├── views.py                      # thin: request parsing → service calls → JsonResponse
└── tests/                        # 5 test files, 43 tests
```

**Dependency graph** (strict, no circular imports):
```
utils → services → api → views
```

---

## 4. Why StreamField Was Preserved

The Wagtail StreamField architecture was preserved for several critical reasons:

1. **Zero migrations**: No database schema changes required
2. **Zero admin changes**: Wagtail admin workflows remain untouched
3. **Backward compatible**: Existing content and editor workflows unaffected
4. **Flexible content modeling**: StreamField allows editors to mix block types freely within sections

The tradeoff is that block extraction requires scanning nested StreamField data at request time, which is mitigated by caching (see Section 8).

---

## 5. Backend Filtering Flow

```
Request → Archive View → Archive Service → Block Extraction → Filter → Sort → Paginate → Response
```

1. **Archive View** (`api/archive_views.py`): Parses request, validates parameters, delegates to service
2. **Archive Service** (`services/archive_service.py`): Extracts blocks from sidebar_items or ResearcherSectionPage
3. **Block Extraction** (`build_items_from_blocks`): Converts StreamField blocks to normalized dicts
4. **Filter** (`filter_items`): Searches by title/author/journal, filters by year
5. **Sort** (`sort_results`): Applies sort mode (7 options)
6. **Paginate** (`paginate_items`): Splits into offset-based page
7. **Response**: JSON with `{items, total, limit, offset, has_next, has_previous}`

---

## 6. Pagination Design

**Strategy**: Offset-based pagination with server-side enforcement.

**Limits**:
- Default: `limit=10`, `offset=0`
- Maximum: `limit=50`
- Validation: Returns `400 Bad Request` for invalid parameters

**Response contract**:
```json
{
  "items": [...],
  "total": 25,
  "limit": 10,
  "offset": 0,
  "has_next": true,
  "has_previous": false
}
```

**Sort modes**:
| Mode | Description |
|------|-------------|
| `title_asc` | Alphabetical A→Z (default) |
| `title_desc` | Alphabetical Z→A |
| `author_asc` | By author name A→Z |
| `author_desc` | By author name Z→A |
| `journal_asc` | By journal name A→Z |
| `newest` | By year descending |
| `oldest` | By year ascending |

---

## 7. API Endpoints

| Endpoint | Method | Cache | Description |
|----------|--------|-------|-------------|
| `/api/researchers/<slug>/publications/` | GET | 300s | Paginated publications with search/sort/year |
| `/api/researchers/<slug>/guidance/` | GET | 300s | Paginated guidance items |
| `/api/researchers/<slug>/news/` | GET | 180s | Paginated news items |
| `/api/researchers/<slug>/sections/<section_slug>/count/` | GET | 300s | Total item count for a section |
| `/api/researchers/<slug>/sections/<section_slug>/filtered-items/` | GET | 300s | Legacy filtered items (returns `{items, count}`) |
| `/api/images/<id>/` | GET | 300s | Image URL lookup |
| `/api/site-settings/` | GET | 300s | Institute info |

**Query parameters** (for paginated endpoints):
- `search` — search by title, author, or journal
- `sort` — sort mode (see Section 6)
- `year` — filter by publication year
- `limit` — items per page (0-50, default 10)
- `offset` — page offset (default 0)

**Error responses**:
- `400` — Invalid parameters (descriptive error message)
- `404` — Researcher or section not found
- `500` — Internal service failure

---

## 8. Caching Strategy

| Endpoint | Duration | Rationale |
|----------|----------|-----------|
| Publications | 300s (5 min) | Stable content, rarely changes |
| Guidance | 300s (5 min) | Changes infrequently |
| News | 180s (3 min) | More time-sensitive |
| Section count | 300s (5 min) | Lightweight, stable |
| Filtered items | 300s (5 min) | Varies by query string |

**Notes**:
- Django's `cache_page` varies by full URL including query string — no additional `Vary` header needed
- Public, unauthenticated endpoints — no `vary_on_cookie` needed
- Cache backend: Redis in production, LocMemCache in dev
- Accept stale cache for 3-5 min; editors can restart dev server if needed

---

## 9. Frontend Integration

The `FilterableArchiveSection.jsx` component handles:

1. **Skeleton loading** — Animated placeholder cards during fetch
2. **Error state** — Retry button on fetch failure
3. **Pagination reset** — Resets offset to 0 on filter change
4. **Empty state differentiation**:
   - `total === 0` on initial load → "No items available in this section."
   - `total > 0` but `items.length === 0` after filtering → "No items match your filters."
5. **Key stability** — Uses `item-${offset}-${index}` instead of content-based keys

The component fetches from type-specific endpoints (`/publications/`, `/guidance/`, `/news/`) with a fixed `PAGE_SIZE=10`.

---

## 10. Future Relational Migration Roadmap

If the project outgrows StreamField extraction performance, the migration path is:

1. **Extract blocks** → Create Django models for Publication, Guidance, News
2. **Data migration** → Populate models from existing StreamField data
3. **New endpoints** → Create ORM-based API endpoints
4. **Dual-write** → Write to both StreamField and models during transition
5. **Deprecate old** → Switch frontend to new endpoints, remove StreamField extraction
6. **Clean up** → Remove StreamField blocks, delete old endpoints

This would require migrations but would improve query performance and enable proper relational filtering.

---

## 11. Testing Strategy

**Test runner**: Django built-in (`python manage.py test researchers`)

**Test files**:
| File | Tests | Description |
|------|-------|-------------|
| `test_pagination.py` | 6 | Pure pagination logic (SimpleTestCase) |
| `test_filtering.py` | 13 | Search, year filter, sort modes (SimpleTestCase) |
| `test_archive_service.py` | 7 | Block extraction, service orchestration (SimpleTestCase + mocks) |
| `test_archive_views.py` | 6 | View responses, error handling (SimpleTestCase + mocks) |
| `test_edge_cases.py` | 11 | Invalid params, malformed data, contract stability (SimpleTestCase) |

**Total**: 43 tests

**Run tests**:
```bash
cd backend
source ../.venv/bin/activate
python manage.py test researchers.tests
```

**Test isolation**:
- `SimpleTestCase` for pure function tests (no DB)
- Mocks for service-dependent view tests
- `patch` with `new` parameter for function replacement to prevent state leakage
