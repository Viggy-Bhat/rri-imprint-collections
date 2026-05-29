# Caching Architecture

> **Purpose**: Server-side and client-side caching strategy for API responses.
> **Audience**: Backend developers, performance engineers.
> **Prerequisites**: [System overview](./system-overview.md), [API endpoints reference](../api/endpoints.md).
> **Related**: [Settings architecture](../backend/settings-architecture.md).

---

## 1. Backend Cache Configuration

Configuration from `backend/backend/settings/base.py:254-271`:

```python
REDIS_URL = os.getenv("REDIS_URL", "")

if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": REDIS_URL,
            "TIMEOUT": env_int("DJANGO_CACHE_TIMEOUT", 300),
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "rri-imprint-default-cache",
            "TIMEOUT": env_int("DJANGO_CACHE_TIMEOUT", 300),
        }
    }
```

| Environment | Backend | Location | Timeout | Shared? |
|------------|---------|----------|---------|---------|
| Production | `RedisCache` | `REDIS_URL` env var (e.g., `redis://redis:6379/1`) | `DJANGO_CACHE_TIMEOUT` (default 300s) | Yes — shared across all Gunicorn workers |
| Development | `LocMemCache` | `rri-imprint-default-cache` | `DJANGO_CACHE_TIMEOUT` (default 300s) | No — each Django process has its own cache |

### Redis in Production

When `REDIS_URL` is set, Django uses the `RedisCache` backend. This provides:
- Shared cache across all Gunicorn workers and processes.
- Automatic entry expiration based on timeout.
- Persistence across Django process restarts.

### LocMem in Development

When `REDIS_URL` is not set, Django falls back to `LocMemCache`:
- In-process memory cache only. Each `runserver` instance has an isolated cache.
- Cache is cleared when the dev server restarts.
- Running multiple workers locally means each has its own cache — responses may differ between workers.

---

## 2. Per-Endpoint Cache Strategy

Server-side caching uses Django's `@cache_page` decorator on view functions. Cache keys vary by the full URL including query string — different `?search=term` values produce different cache entries.

| Endpoint | Cache TTL | Decorator Location | Rationale |
|----------|-----------|-------------------|-----------|
| Publications | 300s (5 min) | `archive_views.py:52` | Stable academic content, rarely changes |
| Guidance | 300s (5 min) | `archive_views.py:79` | Changes infrequently |
| News | 180s (3 min) | `archive_views.py:106` | More time-sensitive than publications |
| Section count | 300s (5 min) | `archive_views.py:133` | Lightweight, stable |
| Filtered items | 300s (5 min) | `views.py:16` | Varies by query string |
| Image detail | 300s (5 min) | `views.py:45` | Static images |
| Site settings | 300s (5 min) | `views.py:69` | Rarely changes |

### Cache Key Behavior

Since all endpoints are `@require_GET` (read-only) and have no authentication, there is no `Vary: Cookie` or `Vary: Authorization` header. The cache key is derived from:
- The full URL path
- The complete query string

This means:
- `?search=quantum&sort=newest` and `?search=optics&sort=title_asc` produce different cache entries.
- `?limit=10&offset=0` and `?limit=10&offset=10` are cached separately (different pages).
- No additional `Vary` header configuration is needed.

---

## 3. Wagtail Pages API (Not Cached Server-Side)

The Wagtail built-in endpoint `/api/v2/pages/` has **no server-side cache**. This is intentional:

- The frontend explicitly uses `{cache: "no-store"}` in all fetch calls to this endpoint.
- StreamField content changes require immediate visibility — stale page data is worse than stale archive data.
- The Pages API is the authoritative source for page tree structure; caching it would delay content updates reaching readers.

Example from the frontend:

```javascript
const res = await fetch(`${WAGTAIL_BASE}/api/v2/pages/?type=researchers.ResearcherPage`, {
  cache: "no-store",
});
```

---

## 4. Frontend Caching

The Next.js frontend uses different caching strategies per endpoint:

| Endpoint | Frontend Pattern | Location | Effect |
|----------|-----------------|----------|--------|
| Pages API | `{cache: "no-store"}` | Server Components (`app/page.js`, `researcherApi.js`) | Every request fetches fresh data from the backend |
| Site settings | `{next: {revalidate: 300}}` | `app/lib/siteSettingsApi.js` | ISR — page regenerated every 5 minutes |
| Paginated endpoints | Client-side `fetch()` in `useEffect` | `FilterableArchiveSection.jsx` | No caching (dynamic parameters change per interaction) |
| Section count | `{next: {revalidate: 300}}` | `app/researcher/[slug]/section/[sectionSlug]/page.js` | ISR — 5 minutes |
| Image URLs | No caching | `app/lib/wagtailApi.js` | Fresh fetch per image resolution |

### ISR for Site Settings

Site settings use Next.js Incremental Static Regeneration with a 300s revalidation period. This means:
- The first request after the 5-minute window triggers a background regeneration.
- Stale data is served while the new version is generated.
- Institute info (name, department, address, phone, email) can be up to 5 minutes stale.

### Client-Side Paginated Endpoints

`FilterableArchiveSection.jsx` fetches paginated data (publications, guidance, news) client-side with no caching. Each user interaction (search, sort, filter, paginate) triggers a fresh fetch. This ensures:
- Users always see the latest items (subject to the backend's 180s--300s server-side cache).
- Different interactions produce different URLs (varying query strings), naturally bypassing any browser cache.

---

## 5. Cache Invalidation

### Current Approach: Time-Based Only

The system uses **purely time-based cache expiry**. There is no event-driven cache invalidation — no signal handler, webhook, or admin hook that clears cache entries when content is published or updated.

### Implications

| Scenario | Behavior |
|----------|----------|
| Editor publishes new publication | Visible after up to 5 minutes (300s cache TTL) |
| Editor updates site settings | Visible after up to 5 minutes |
| Editor adds news item | Visible after up to 3 minutes (180s cache TTL) |
| Developer changes block definition | Stale cache may serve old JSON shapes until TTL expires |

### Workarounds

- **Development**: Restart the Django dev server (`Ctrl+C` then `python manage.py runserver`) to clear the LocMem cache.
- **Production**: Redis cache entries expire automatically. No manual invalidation mechanism exists. To force immediate invalidation, restarting the Redis server or flushing database 1 are the only options.

---

## 6. Known Constraints

### No Cache Warming

There is no cache warming strategy. The first request after cache expiry is slow because it triggers full StreamField extraction, filtering, sorting, and pagination in Python. Subsequent requests within the TTL window are fast.

### No Cache Key Versioning

Changing block definitions in `blocks.py` does not invalidate cached responses. If a block field is renamed or restructured, cached responses will serve data with the old shape until the TTL expires.

### Single Redis Database

Redis database 1 is used (`redis://redis:6379/1`). All cached entries — publications, guidance, news, site settings, images — share the same Redis database with no isolation. Flushing the database clears all cached data indiscriminately.

### LocMem Isolation in Dev

The LocMem fallback means each Django process has its own cache. If you run multiple workers locally (e.g., `gunicorn` with `--workers 2`), cache entries in one worker are invisible to the other. This can cause confusing behavior where the same request returns different data from different workers.

### Stale Section Counts

The frontend uses ISR for section counts (`{next: {revalidate: 300}}`). After editors add or remove items from a section, the count displayed in the sidebar may be stale for up to 5 minutes.

### No Cache for FilterableArchiveSection Resets

When a user applies a new filter in `FilterableArchiveSection.jsx`, the component resets `offset` to 0 and fetches fresh data. If the backend cache still holds a stale entry for `offset=0` with the old filters, the user may briefly see stale data. In practice, different filter parameters produce different cache keys, so this is not a common issue.
