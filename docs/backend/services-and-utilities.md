# Services and Utilities

> **Purpose**: Complete reference for the service layer (business logic) and utility modules (pure functions) in the researchers app.
> **Audience**: Backend developers debugging API responses, adding new block types, or modifying filtering/sorting behavior.
> **Prerequisites**: [Models](./models.md), [Wagtail content architecture](../architecture/wagtail-content-architecture.md).
> **Related**: [API endpoints reference](../api/endpoints.md), [Data flow](../architecture/data-flow.md).

---

## 1. Architecture Overview

The business logic is separated from HTTP handling:

```
HTTP Layer (views.py, api/archive_views.py)
    ↓ calls
Service Layer (services/archive_service.py)
    ↓ uses
Utility Layer (utils/*.py)
```

This separation enables pure-function unit testing of business logic without Django test client overhead. Import rules are enforced upward-only:

| Layer | Directory | Imports From |
|-------|-----------|-------------|
| **Utils** | `researchers/utils/` | Standard library only |
| **Services** | `researchers/services/` | Utils, Models |
| **API Views** | `researchers/api/` | Services, Utils |
| **Thin Views** | `researchers/views.py` | Services |

---

## 2. Service Functions

All from `backend/researchers/services/archive_service.py` (234 lines).

### `build_items_from_blocks(blocks)`

**Source**: lines 11-83

**Purpose**: Converts raw StreamField block objects into normalized dicts suitable for API responses.

**Input**: List of StreamField block objects with shape `{type: "block_type", value: {...}, id: "uuid"}`

**Processing**:

1. Iterates blocks, extracts `type` and `value` via `get_mapping_value()` (safe dict/attribute access)
2. Coerces value to dict via `normalize_mapping()` (handles both dict and StructBlock value objects)
3. For `publication` type: extracts title (skip if empty), journal, year, link → creates `{title, link, tag: "Journal: ...", meta_text: "Year: ...", journal, year}`
4. For `guidance` type: extracts thesis_title (fallback to title), student_name (as author), year, link, description → creates `{title, link, tag: "Author: ...", meta_text: "Year: ...", description, author, year}`
5. For `news` type: extracts headline (as title), source, date, link → creates `{title, link, tag: "Source: ...", meta_text: "Date: ...", description: ""}`
6. Skips blocks with empty titles (they can't be displayed)

**Output**: List of normalized item dicts

**Block types handled**: `publication`, `guidance`, `news` (3 of 5 smart_content types). Gallery and supervision blocks are not handled here — they have separate rendering paths in the frontend.

### `extract_and_filter_by_type(researcher_page, block_type, search, sort_option, year)`

**Source**: lines 87-121

**Purpose**: Extracts all blocks of a given type from a researcher page, then filters and sorts.

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `researcher_page` | ResearcherPage | The researcher page instance |
| `block_type` | str | One of `"publication"`, `"guidance"`, `"news"` |
| `search` | str | Search term (default `""`) |
| `sort_option` | str | Sort mode (default `"title_asc"`) |
| `year` | str | Year filter (default `""`) |

**Data source resolution** (dual-path):

1. FIRST checks `researcher_page.sidebar_items` for `smart_content` blocks of type `block_type` (lines 89-101)
2. IF no matching blocks found, falls back to `ResearcherSectionPage.objects.live().public().descendant_of(researcher_page)` — scans their `smart_content` for matching blocks (lines 103-118)
3. Calls `build_items_from_blocks()` to normalize (line 120)
4. Calls `filter_items()` to search/filter/sort (line 121)

This dual path means content can exist either inline in sidebar items or on dedicated section pages — the service transparently resolves from both sources.

### `build_section_items(researcher_page, section_slug)`

**Source**: lines 124-186

**Purpose**: Builds item list for a specific sidebar section identified by slug.

**Resolution strategy** (6 steps):

1. Normalizes `section_slug` via `to_section_slug()` (line 126)
2. Iterates `researcher_page.sidebar_items`, normalizes each section's slug (or title fallback), finds match (lines 128-139)
3. Also looks up `ResearcherSectionPage` by slug as fallback (lines 141-148)
4. If matched in sidebar: tries `items` list first (SidebarContentItemBlock list), returns if found (lines 155-176)
5. If no items: falls back to `smart_content` blocks (publication/guidance/news/gallery) from matched section (lines 180-181)
6. If not found in sidebar: tries `ResearcherSectionPage.smart_content` blocks directly (lines 183-184)
7. Returns `None` if section not found in either location (lines 150-151)

**Priority**: sidebar `items` > sidebar `smart_content` > section page `smart_content` > `None`

### `filter_items(items, search_term, sort_option, year)`

**Source**: lines 189-217

**Purpose**: Applies search, year filter, and sort to an item list.

**Algorithm**:

1. Normalizes `search_term` to lowercase and strips whitespace (line 195)
2. Parses `year` as integer; sets `year_number = None` and `has_year = False` if not a valid int (lines 197-202)
3. If `search_term` provided: filters items where the term appears (case-insensitive) in `title` (plain text), `author` (extracted via `get_author()`), OR `journal` (extracted via `get_journal()`) (lines 205-212)
4. If `year` provided: filters items where extracted year matches exactly via `get_year()` (lines 214-215)
5. Applies sort via `sort_results()` — 7 sort modes (line 217)

**Deferred imports** (lines 191-193): `get_author`, `get_journal`, `get_year`, `get_mapping_value`, `to_plain_text` are imported inside the function body. This avoids circular imports since these utilities are part of the same package.

### `get_researcher_filtered_items(slug, section_slug, search_term, sort_option, year)`

**Source**: lines 220-234

**Purpose**: Top-level orchestrator for the legacy filtered-items endpoint.

**Flow**: resolve researcher page by slug → `build_section_items` → `filter_items` → return sorted list

**Returns**: `None` if researcher or section not found

**Usage**: Called exclusively by `views.py:24-30` (`researcher_section_filtered_items`). This is the legacy endpoint — newer endpoints (`archive_views.py`) use `extract_and_filter_by_type` directly instead.

---

## 3. Utility Modules

All from `backend/researchers/utils/`.

### `text_utils.py` (32 lines)

| Function | Signature | Purpose |
|----------|-----------|---------|
| `to_plain_text(value)` | `(value) -> str` | Strips HTML tags via regex `r"<[^>]*>"`, collapses whitespace via `r"\s+"` |
| `to_section_slug(value)` | `(value) -> str` | Normalizes to kebab-case: lowercase, strip non-alphanumeric, replace spaces with hyphens, collapse multiple hyphens, strip leading/trailing hyphens |
| `extract_labeled_segment(source, labels)` | `(source, [labels]) -> str` | Extracts values from labeled segments like "Author: Smith" using regex `rf"{label}\s*[:\-]\s*([^|,;\n]+)"`; tries each label in order, returns first match |

**`to_plain_text`** (line 4-6): Single-line chain: `re.sub(r"\s+", " ", re.sub(r"<[^>]*>", " ", str(value or ""))).strip()`

**`to_section_slug`** (lines 9-15): Single-line chain with nested regex substitutions.

**`extract_labeled_segment`** (lines 18-32): Supports both colon (`:`) and dash (`-`) separators, captures everything up to `|`, `,`, `;`, or newline. Returns empty string if no match or empty source text.

### `mapping_utils.py` (32 lines)

| Function | Signature | Purpose |
|----------|-----------|---------|
| `normalize_mapping(value)` | `(value) -> dict` | Safely coerces any value to dict: tries dict identity, `.items()` method, `dict()` constructor; returns `{}` on failure |
| `get_mapping_value(value, key, default)` | `(value, key, default="") -> any` | Dict/attribute fallback getter: tries `.get(key)`, then `getattr(value, key)`; returns default on any failure |

**Design rationale**: StreamField blocks can be either dicts (from JSON deserialization) or StructBlock value objects (with attribute access). These utilities provide a safe unified access pattern that works with both.

**`normalize_mapping`** (lines 1-15): Three-stage coercion:
1. `isinstance(value, dict)` → return as-is
2. `hasattr(value, "items")` → try `dict(value.items())`
3. `dict(value)` constructor
4. Falls back to empty `{}` on any exception

**`get_mapping_value`** (lines 18-32): Three-stage access:
1. `isinstance(value, dict)` → `value.get(key, default)`
2. `hasattr(value, "get")` → `value.get(key, default)`
3. `getattr(value, key)`
4. Falls back to `default` on any exception

### `item_extractors.py` (55 lines)

| Function | Signature | Purpose |
|----------|-----------|---------|
| `get_author(item)` | `(item) -> str` | Extracts author: 1) labeled segment in meta_text, 2) labeled segment in description, 3) direct author field |
| `get_journal(item)` | `(item) -> str` | Extracts journal: 1) labeled segment in meta_text, 2) labeled segment in description, 3) direct journal field |
| `get_year(item)` | `(item) -> int or None` | Extracts year: 1) direct year field parsed as int, 2) regex `\b(19|20)\d{2}\b` scan of meta_text + description + tag |

**`get_author`** (lines 7-13): Tries labels `["author", "authors"]` in both `meta_text` and `description`. Falls back to plain-text `author` field via `to_plain_text`.

**`get_journal`** (lines 16-28): Tries labels `["journal", "published in", "publication", "conference"]` in both `meta_text` and `description`. Falls back to plain-text `journal` field.

**`get_year`** (lines 31-55): Uses `direct_year` first via int parsing (with `> 0` validation). If not found, scans combined string of `meta_text + description + tag` for 4-digit years starting with `19` or `20`. Returns `None` if no year found.

### `sorting.py` (28 lines)

| Function | Signature | Purpose |
|----------|-----------|---------|
| `sort_results(results, sort_option)` | `(results, sort_option) -> list` | Sorts item list by one of 7 modes |

**Sort modes**:

| Mode | Key | Direction | Notes |
|------|-----|-----------|-------|
| `title_asc` | `to_plain_text(title)` | Ascending | **Default fallback** for unrecognized options |
| `title_desc` | `to_plain_text(title)` | Descending | |
| `author_asc` | `get_author(item)` | Ascending | |
| `author_desc` | `get_author(item)` | Descending | |
| `journal_asc` | `get_journal(item)` | Ascending | |
| `newest` | `get_year(item) or 0` | Descending | None years treated as 0 (sort last) |
| `oldest` | `get_year(item) or 0` | Ascending | None years treated as 0 (sort first) |

Unrecognized `sort_option` silently falls back to `title_asc` via the default return at line 28. All sort operations create a new list — they do not mutate the input.

### `pagination.py` (12 lines)

| Function | Signature | Purpose |
|----------|-----------|---------|
| `paginate_items(items, limit, offset)` | `(items, limit=10, offset=0) -> dict` | Slices list into page; returns `{items, total, limit, offset, has_next, has_previous}` |

Returns a dict with:
- `items`: sliced page array
- `total`: full list length
- `limit`: page size
- `offset`: starting index
- `has_next`: `True` if more items exist after this page
- `has_previous`: `True` if offset > 0

Pagination params are validated upstream by `_parse_pagination_params()` in `archive_views.py:14-32` which enforces `0 <= limit <= 50` and `offset >= 0`.

---

## 4. Management Commands

### `seed_sitesettings`

**File**: `researchers/management/commands/seed_sitesettings.py` (29 lines)

**Usage**: `python manage.py seed_sitesettings`

**Behavior**:
1. Gets the first Wagtail `Site` object (`Site.objects.first()`) — line 11
2. Warns and exits if no Site exists — lines 13-15
3. Uses `SiteSettings.objects.get_or_create(site=site)` — line 17
4. If created, seeds with default RRI values — lines 19-26:
   - `institute_name = "RAMAN RESEARCH INSTITUTE"`
   - `department = "LIBRARY"`
   - `address = "C. V. Raman Avenue, Bangalore - 560080, India"`
   - `phone = "(080) 23610122"`
   - `email = "library@rri.res.in"`
5. If settings already exist, prints "already exists" message — line 29

**Idempotent**: Safe to run multiple times — does not overwrite existing settings.

---

## 5. API View Helpers

From `backend/researchers/api/archive_views.py`.

### `_parse_pagination_params(request)` (lines 14-32)

Parses `limit` (default 10) and `offset` (default 0) from request GET params. Validates:
- Both must be valid integers
- `limit` must be `0 <= limit <= 50`
- `offset` must be `>= 0`

Returns `(limit, offset), None` on success or `None, JsonResponse(error, status=400)` on failure.

### `_get_researcher_page(slug)` (lines 35-48)

Looks up a published ResearcherPage by slug. Returns `(page, None)` on success or `(None, JsonResponse(error, status=404/500))` on failure. Handles database exceptions with logging and a generic 500 response.

Both helpers are reused across 4 views: `researcher_publications`, `researcher_guidance`, `researcher_news`, `researcher_section_count`.

---

## 6. Data Flow Summary

For a typical API request (e.g., `GET /api/researchers/smith/publications/?search=quantum&sort=newest`):

```
1. archive_views.researcher_publications()       [HTTP layer]
     ↓ _parse_pagination_params(request)           params: limit=10, offset=0
     ↓ _get_researcher_page(slug)                  slug="smith"
  2. archive_service.extract_and_filter_by_type() [Service layer]
     ↓ scans sidebar_items for "publication" blocks
     ↓ [fallback] scans ResearcherSectionPage children
     ↓ build_items_from_blocks(blocks)             normalizes to dicts
     ↓ filter_items(items, "quantum", "newest")    search + sort
      3. item_extractors.get_author()             [Utility layer]
      3. item_extractors.get_journal()             [Utility layer]
      3. item_extractors.get_year()                [Utility layer]
      3. sorting.sort_results()                    [Utility layer]
  4. pagination.paginate_items(items, 10, 0)      [Utility layer]
5. JsonResponse(result)                            [HTTP response]
```

The entire chain is stateless — no database writes, no side effects. All service functions accept data-in and return data-out.

---

## 7. Future Refactoring Opportunities

1. **Extract shared view helpers**: `_parse_pagination_params()` and `_get_researcher_page()` in `archive_views.py` are reused across 4 views — extract to a shared `views_helpers.py` module.
2. **Separate extractors by block type**: `build_items_from_blocks()` has if/elif chains for each block type. Consider strategy pattern or dict dispatch for adding new block types.
3. **Add docstrings**: No utility function has docstrings beyond the source code's existing inline summaries. Add complete docstrings with parameter and return type descriptions.
4. **Remove dead code**: `get_researcher_filtered_items()` (line 220) is only called by the unused filtered-items endpoint (`views.py:15-41`). Remove when endpoint is cleaned up.
5. **Add type annotations**: All utility functions have clean signatures but no type hints. Adding them would improve IDE support and enable static analysis.
6. **Consider caching in service layer**: Currently caching happens at the view level only (`@cache_page(300)`). Service functions could benefit from lower-level caching for frequently accessed researcher data.
