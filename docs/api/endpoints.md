# API Endpoint Reference

## 1. Wagtail Pages API (Built-in)

```
GET /api/v2/pages/
GET /api/v2/pages/?type=researchers.ResearcherPage
GET /api/v2/pages/?type=researchers.ResearcherSectionPage&child_of=<page_id>
```

Returns the page tree with nested StreamField block values. This is Wagtail's built-in v2 API.

## 2. Image Endpoint

```
GET /api/images/<id>/
```

**Response:**

```json
{
  "id": 1,
  "title": "researcher-photo",
  "file": "/media/images/photo.max-900x900.jpg"
}
```

Custom endpoint because Wagtail's built-in v2 image API requires additional configuration.

## 3. Site Settings

```
GET /api/site-settings/
```

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

## 4. Publications (Paginated)

```
GET /api/researchers/<slug>/publications/?limit=10&offset=0
```

**Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | int | 10 | Items per page (max 50) |
| `offset` | int | 0 | Starting position |

**Response:**

```json
{
  "items": [
    {
      "title": "Paper Title",
      "journal": "Physical Review Letters",
      "year": "2024",
      "link": "https://doi.org/..."
    }
  ],
  "total": 42,
  "limit": 10,
  "offset": 0,
  "has_next": true,
  "has_previous": false
}
```

## 5. Guidance (Paginated)

```
GET /api/researchers/<slug>/guidance/?limit=10&offset=0
```

Same pagination contract as publications. Items contain `student_name`, `thesis_title`, `year`, `link`.

## 6. News (Paginated)

```
GET /api/researchers/<slug>/news/?limit=10&offset=0
```

Same pagination contract. Items contain `headline`, `source`, `date`, `link`.

## 7. Section Count

```
GET /api/researchers/<slug>/sections/<slug>/count/
```

**Response:**

```json
{
  "total": 42
}
```

Returns the total number of items in a section (used by frontend to show counts before loading content).

## 8. Filtered Items

```
GET /api/researchers/<slug>/sections/<slug>/filtered-items/?search=&sort=&year=
```

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Full-text search across item titles |
| `sort` | string | Sort order (`title_asc`, `title_desc`, `year_asc`, `year_desc`) |
| `year` | string | Filter by year |

**Response:**

```json
{
  "items": [...],
  "total": 15
}
```

## 9. Error Responses

### 400 — Bad Request

```json
{
  "error": "Invalid 'limit' parameter. Must be an integer."
}
```

### 404 — Not Found

```json
{
  "error": "Researcher not found"
}
```

### 500 — Server Error

```json
{
  "error": "Internal server error"
}
```

## 10. Pagination Contract

All paginated endpoints return this shape:

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
| `items` | array | Array of content items |
| `total` | int | Total number of items across all pages |
| `limit` | int | Current page size |
| `offset` | int | Current starting position |
| `has_next` | boolean | Whether more items exist after this page |
| `has_previous` | boolean | Whether items exist before this page |
