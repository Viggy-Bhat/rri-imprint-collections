import logging

from django.http import JsonResponse
from django.views.decorators.cache import cache_page
from django.views.decorators.http import require_GET

from ..models import ResearcherPage
from ..services.archive_service import extract_and_filter_by_type, build_section_items
from ..utils.pagination import paginate_items

logger = logging.getLogger(__name__)


def _parse_pagination_params(request):
    """Parse and validate limit/offset from request. Returns (limit, offset) or JsonResponse on error."""
    try:
        limit = int(request.GET.get("limit", 10))
    except (TypeError, ValueError):
        return None, JsonResponse({"error": "Invalid 'limit' parameter. Must be an integer."}, status=400)

    if limit < 0 or limit > 50:
        return None, JsonResponse({"error": "'limit' must be between 0 and 50."}, status=400)

    try:
        offset = int(request.GET.get("offset", 0))
    except (TypeError, ValueError):
        return None, JsonResponse({"error": "Invalid 'offset' parameter. Must be an integer."}, status=400)

    if offset < 0:
        return None, JsonResponse({"error": "'offset' must be non-negative."}, status=400)

    return (limit, offset), None


def _get_researcher_page(slug):
    """Look up researcher page. Returns (page, error_response)."""
    try:
        researcher_page = (
            ResearcherPage.objects.live().public().filter(slug=slug).specific().first()
        )
    except Exception:
        logger.exception("Failed to look up researcher", extra={"slug": slug})
        return None, JsonResponse({"error": "Unable to fetch data"}, status=500)

    if researcher_page is None:
        return None, JsonResponse({"error": "Researcher not found"}, status=404)

    return researcher_page, None


@require_GET
@cache_page(300)
def researcher_publications(request, slug):
    """GET /api/researchers/<slug>/publications/?search=&sort=&year=&limit=&offset="""
    search = request.GET.get("search", "")
    sort_option = request.GET.get("sort", "title_asc")
    year = request.GET.get("year", "")

    pagination, error = _parse_pagination_params(request)
    if error:
        return error
    limit, offset = pagination

    researcher_page, error = _get_researcher_page(slug)
    if error:
        return error

    try:
        items = extract_and_filter_by_type(researcher_page, "publication", search, sort_option, year)
    except Exception:
        logger.exception("Failed to extract publications", extra={"slug": slug})
        return JsonResponse({"error": "Unable to extract publications"}, status=500)

    result = paginate_items(items, limit, offset)
    return JsonResponse(result)


@require_GET
@cache_page(300)
def researcher_guidance(request, slug):
    """GET /api/researchers/<slug>/guidance/?search=&sort=&year=&limit=&offset="""
    search = request.GET.get("search", "")
    sort_option = request.GET.get("sort", "title_asc")
    year = request.GET.get("year", "")

    pagination, error = _parse_pagination_params(request)
    if error:
        return error
    limit, offset = pagination

    researcher_page, error = _get_researcher_page(slug)
    if error:
        return error

    try:
        items = extract_and_filter_by_type(researcher_page, "guidance", search, sort_option, year)
    except Exception:
        logger.exception("Failed to extract guidance", extra={"slug": slug})
        return JsonResponse({"error": "Unable to extract guidance"}, status=500)

    result = paginate_items(items, limit, offset)
    return JsonResponse(result)


@require_GET
@cache_page(180)
def researcher_news(request, slug):
    """GET /api/researchers/<slug>/news/?search=&sort=&year=&limit=&offset="""
    search = request.GET.get("search", "")
    sort_option = request.GET.get("sort", "title_asc")
    year = request.GET.get("year", "")

    pagination, error = _parse_pagination_params(request)
    if error:
        return error
    limit, offset = pagination

    researcher_page, error = _get_researcher_page(slug)
    if error:
        return error

    try:
        items = extract_and_filter_by_type(researcher_page, "news", search, sort_option, year)
    except Exception:
        logger.exception("Failed to extract news", extra={"slug": slug})
        return JsonResponse({"error": "Unable to extract news"}, status=500)

    result = paginate_items(items, limit, offset)
    return JsonResponse(result)


@require_GET
@cache_page(300)
def researcher_section_count(request, slug, section_slug):
    """GET /api/researchers/<slug>/sections/<section_slug>/count/ -> {"total": N}"""
    researcher_page, error = _get_researcher_page(slug)
    if error:
        return error

    try:
        items = build_section_items(researcher_page, section_slug)
    except Exception:
        logger.exception("Failed to build section items for count")
        return JsonResponse({"error": "Unable to build section items"}, status=500)

    if items is None:
        return JsonResponse({"error": "Section not found"}, status=404)

    return JsonResponse({"total": len(items)})
