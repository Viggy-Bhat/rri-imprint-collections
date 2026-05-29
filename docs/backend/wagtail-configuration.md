# Wagtail Configuration

> **Purpose**: Complete reference for Wagtail CMS configuration — API router, Draftail extensions, page type constraints, admin customization, preview templates, and site settings integration.
> **Audience**: Backend developers customizing the Wagtail admin or adding new content types.
> **Prerequisites**: [Models](./models.md), [Wagtail content architecture](../architecture/wagtail-content-architecture.md).
> **Related**: [Services and utilities](./services-and-utilities.md), [Security](./security.md).

---

## 1. Wagtail API Integration

From `backend/backend/urls.py:9-27`:

```python
from wagtail.api.v2.views import PagesAPIViewSet
from wagtail.api.v2.router import WagtailAPIRouter

api_router = WagtailAPIRouter("wagtailapi")
api_router.register_endpoint("pages", PagesAPIViewSet)
```

This exposes the Wagtail Pages v2 API at `/api/v2/pages/`. Only the Pages endpoint is registered — no Images or Documents API endpoints. The `wagtail.api.v2` app is present in `INSTALLED_APPS` (`base.py:80`).

The router is mounted at `path("api/v2/", api_router.urls)` (`urls.py:29`).

### Why no Images API?

The separate custom endpoint `GET /api/images/<pk>/` (`urls.py:55`, `views.py:44-65`) provides image file URLs directly, which is simpler for the frontend than Wagtail's v2 Images API. This endpoint is cached for 300 seconds.

---

## 2. Wagtail Hooks

From `backend/researchers/wagtail_hooks.py` (33 lines).

### `register_underline_feature`

**Hook**: `register_rich_text_features` (decorated at line 6)

Registers a custom **underline** feature for the Draftail rich text editor, which is not included in Wagtail's default feature set.

**Implementation** (lines 7-33):

```python
@hooks.register("register_rich_text_features")
def register_underline_feature(features):
    feature_name = "underline"
    type_ = "UNDERLINE"

    control = {
        "type": type_,
        "label": "U",
        "description": "Underline",
    }

    features.register_editor_plugin(
        "draftail",
        feature_name,
        InlineStyleFeature(control),
    )

    features.register_converter_rule(
        "contentstate",
        feature_name,
        {
            "from_database_format": {"u": InlineStyleElementHandler(type_)},
            "to_database_format": {"style_map": {type_: "u"}},
        },
    )

    if feature_name not in features.default_features:
        features.default_features.append(feature_name)
```

**Components**:

| Component | Value | Purpose |
|-----------|-------|---------|
| Feature name | `"underline"` | Identifier used in `RICH_TEXT_FEATURES` |
| Draftail type | `"UNDERLINE"` | Internal Draftail content state type |
| Control label | `"U"` | Short label shown in toolbar |
| HTML tag | `<u>` | Maps to/from HTML underline element |
| Editor plugin | `InlineStyleFeature` | Provides the toolbar button in Draftail |
| Converter rule | `from_database_format` / `to_database_format` | Bidirectional `<u>` ↔ `UNDERLINE` mapping |

The final check (`features.default_features.append`) makes underline available **by default** in ALL rich text fields across the entire Wagtail instance — editors don't need to manually enable it per field.

### Rich Text Features

From `blocks.py:5-15`:

```python
RICH_TEXT_FEATURES = [
    "bold",
    "italic",
    "underline",
    "link",
    "ol",
    "ul",
    "h2",
    "h3",
    "h4",
]
```

This feature set is applied to all `RichTextBlock` and `RichTextField` instances in block definitions:
- `SectionItemBlock.description` (`blocks.py:30-33`)
- `SectionBlock.content` (`blocks.py:50-54`)
- `SidebarContentItemBlock.description` (`blocks.py:66-70`)
- `BiographySectionBlock.content` (`blocks.py:78-82`)
- `GalleryImageItemBlock.about_image` (`blocks.py:134-138` — uses subset `["bold", "italic", "underline"]` only)

**Note**: Headings are limited to `h2` through `h4`. `h1` is excluded to avoid conflicts with page-level headings. `h5` and `h6` are excluded by design choice.

---

## 3. Page Type Constraints

Defined in models via `subpage_types` and `parent_page_types`:

| Page Type | Can Be Child Of | Can Have Children |
|-----------|----------------|-------------------|
| HomePage | Root only | ResearcherPage (via default Page behavior) |
| ResearcherPage | HomePage (or any allowed parent) | `["researchers.ResearcherSectionPage"]` only |
| ResearcherSectionPage | `["researchers.ResearcherPage"]` only | `[]` (leaf node) |

These constraints prevent editors from creating invalid page hierarchies in the Wagtail admin. The "Add child page" menu only shows allowed page types.

**HomePage** (`home/models.py:6-7`) uses `pass` body — inherits default `Page` behavior which allows any page type as children unless explicitly restricted via `subpage_types`.

---

## 4. Wagtail Admin

- **URL**: `/admin/` (via `wagtailadmin_urls`, mounted at `urls.py:58`)
- **Django Admin**: `/django-admin/` (separate Django admin at `urls.py:57`)
- **Authentication**: Django session-based auth (`django.contrib.auth`)
- **Editor access**: Superusers and users with Wagtail admin permissions
- **Content must be published** to appear in API (`.live().public()`)
- **Site settings**: Wagtail Settings → Site Settings (`/admin/settings/researchers/sitesettings/`)
- **Documents**: `/documents/` (via `wagtaildocs_urls`, mounted at `urls.py:59`)
- **Site name**: `"backend"` (`base.py:223`, `WAGTAIL_SITE_NAME`)

### Admin Base URL

From `base.py:234-235`:
```python
WAGTAILADMIN_BASE_URL = os.getenv("WAGTAILADMIN_BASE_URL", "http://example.com")
```

Used for generating full URLs in notification emails. Defaults to `http://example.com` — should be overridden in production via environment variable.

---

## 5. Preview Template

From `backend/researchers/templates/researchers/researcherpage.html` (82 lines).

The `ResearcherPage.template` attribute (`models.py:29`) points to this template. Wagtail uses it for:
- **Admin page preview**: Click "Preview" button in the page editor
- **Temporary rendering**: Shows how the page would look

The template renders:
- Page title and field of study (`{{ page.title }}`, `{{ page.field }}`) — lines 27-28
- Profile image with `max-400x400` rendition (if set) — lines 30-33
- Profile items as a `<dl>` list — lines 35-42
- Bio sections with rich text content — lines 46-53
- Sidebar items with title, subtitle, and linked items — lines 55-74
- Publication footer — lines 78-79

**Important**: This is ONLY for admin preview. The public-facing rendering is done entirely by Next.js. The template includes inline CSS for standalone viewing — it does not use the frontend's Tailwind or theme styling.

---

## 6. Wagtail Search

From `base.py:227-231`:

```python
WAGTAILSEARCH_BACKENDS = {
    "default": {
        "BACKEND": "wagtail.search.backends.database",
    }
}
```

Uses the **database search backend** (not Elasticsearch). This performs SQL `LIKE` queries — sufficient for small datasets but not production-grade for large content.

**Search configuration**:
- `ResearcherPage.search_fields` (`models.py:32-34`): `Page.search_fields + [SearchField("title")]`
- Only the `title` field is indexed for search
- The `search/` app provides a basic search view at `/search/` (`urls.py:60`) — not used by the Next.js frontend
- The frontend uses custom filtered API endpoints instead

### Search App

The `search/` directory contains:
- `views.py`: `search()` view — query-based search with pagination
- `templates/search/search.html`: Search form + paginated results

This is a Wagtail starter template leftover — not integrated with the Next.js frontend.

---

## 7. Document Upload Restrictions

From `base.py:241-252`:

```python
WAGTAILDOCS_EXTENSIONS = [
    "csv",
    "docx",
    "key",
    "odt",
    "pdf",
    "pptx",
    "rtf",
    "txt",
    "xlsx",
    "zip",
]
```

10 allowed extensions. Prevents upload of executable files, scripts, images (images use Wagtail's image upload system), or other potentially dangerous file types. Documents are available at `/documents/` via `wagtaildocs_urls`.

---

## 8. Content Editing Workflow

### Creating a Researcher Page

1. Navigate to `/admin/pages/`
2. Click "Add child page" under HomePage
3. Select "Researcher Page" type
4. Fill in: `title` (researcher name), `field` (research discipline), optional `birth_date`/`death_date`
5. Upload `profile_image`
6. Add `profile_items` (label/value rows — e.g., Born, Institution, Field)
7. Add `bio_sections` (titled rich text blocks with formatting)
8. Add `sidebar_items` (title, slug, optional items, smart_content)
9. Within `smart_content`, add publication, guidance, news, supervision, or gallery blocks
10. **Publish** (content only appears in API after publishing)

### Creating a Standalone Section Page

1. Navigate to the ResearcherPage
2. Click "Add child page"
3. Select "Researcher Section Page" type
4. Fill in `title` and optional `subtitle`
5. Add `smart_content` blocks (publication, guidance, news, supervision, gallery)
6. **Publish**

### Field-Level Help Text

Available editor guidance in the admin:
- `profile_items`: "Add rows like Born, Field, Institution. You can add, reorder, or remove items."
- `sidebar_items`: "Add and reorder sidebar navigation items and their content."
- `bio_sections`: "Add and reorder biography sections for center content."
- `SidebarItemBlock.slug`: "Used for URL routing" (`blocks.py:205`)
- `SidebarContentItemBlock.tag`: "Author, source, or category" (`blocks.py:64`)
- `SidebarContentItemBlock.meta_text`: "Year, date, or additional info" (`blocks.py:65`)
- `SidebarContentItemBlock.description`: "Brief description with formatting support" (`blocks.py:69`)
- `GalleryImageItemBlock.caption`: "Optional caption for the image" (`blocks.py:133`)
- `GalleryImageItemBlock.about_image`: "Optional rich text shown in the gallery modal as About this Image" (`blocks.py:137`)

---

## 9. Wagtail Dependencies

Key Wagtail dependencies specified in `INSTALLED_APPS` (`base.py:54-81`):

### Core Wagtail Apps

| App | Install Name | Purpose |
|-----|-------------|---------|
| Wagtail Core | `wagtail` | CMS framework, Page model, StreamField |
| Admin | `wagtail.admin` | Draftail editor, page management UI |
| Images | `wagtail.images` | Image upload, renditions, focal point |
| Documents | `wagtail.documents` | Document library, versioning |
| Search | `wagtail.search` | Search backend framework |
| Sites | `wagtail.sites` | Multi-site support |
| Users | `wagtail.users` | Admin user management |
| Snippets | `wagtail.snippets` | Reusable content snippets |
| Embeds | `wagtail.embeds` | OEmbed content embedding |
| API v2 | `wagtail.api.v2` | REST API framework |

### Contributed Apps

| App | Install Name | Purpose |
|-----|-------------|---------|
| Settings | `wagtail.contrib.settings` | `@register_setting` / `BaseSiteSetting` |
| Forms | `wagtail.contrib.forms` | Form builder (not currently used) |
| Redirects | `wagtail.contrib.redirects` | Automatic redirect creation |

### Supporting Python Packages

| Package | Purpose |
|---------|---------|
| `modelcluster` | Parent-child page relationships |
| `django-taggit` | Tagging framework (Wagtail dependency) |
| `django-treebeard` | Materialized Path page tree |
| `draftjs_exporter` | Draftail content export to HTML |
| `telepath` | Widget rendering (JS widget binding) |
| `laces` | Component rendering |
| `Willow` | Image processing library |
| `django-permissionedforms` | Form field permissions |

---

## 10. Wagtail Settings Summary

From `base.py:220-271`:

| Setting | Value | Line | Purpose |
|---------|-------|------|---------|
| `WAGTAIL_SITE_NAME` | `"backend"` | 223 | Admin site display name |
| `WAGTAILSEARCH_BACKENDS` | Database backend | 227-231 | Search configuration |
| `WAGTAILADMIN_BASE_URL` | `os.getenv(...)` default `"http://example.com"` | 235 | Full URL base for notifications |
| `WAGTAILDOCS_EXTENSIONS` | 10 extensions | 241-252 | Allowed document file types |

---

## 11. Installed Wagtail Middleware

From `base.py:83-93`:

```python
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",    # Must be first per django-cors-headers docs
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "wagtail.contrib.redirects.middleware.RedirectMiddleware",
]
```

`RedirectMiddleware` is last in the chain — it intercepts 404 responses and checks Wagtail's redirect table before returning the error. `CorsMiddleware` must be first (above `CommonMiddleware`).

---

## 12. Future Refactoring Opportunities

1. **Register additional Wagtail API endpoints**: Only Pages API is registered at `/api/v2/pages/`. Consider adding Images API (`/api/v2/images/`) which would eliminate the need for the custom image endpoint at `/api/images/<pk>/` (`views.py:44-65`).
2. **Add more Draftail features**: Strikethrough, superscript, subscript, and code blocks are available in Draftail but not registered. Add as new hooks following the pattern in `wagtail_hooks.py`.
3. **Use Wagtail's preview for frontend**: The preview template currently renders a standalone HTML page. Could be configured to load the Next.js frontend in an iframe for "true WYSIWYG" preview.
4. **Add editor guide**: No Wagtail admin documentation exists for editors. Consider adding `HelpPanel` or `MultiFieldPanel` with editing instructions on ResearcherPage.
5. **Configure Wagtail's built-in redirects**: `wagtail.contrib.redirects` is installed (`base.py:60`) and its middleware is active. Consider enabling automatic redirect creation when slugs change to prevent broken frontend links.
6. **Remove unused contrib apps**: `wagtail.contrib.forms` (`base.py:58`) is installed but has no form page types defined. Remove if not planned for use.
