import logging

from django.http import JsonResponse
from django.views.decorators.cache import cache_page
from django.views.decorators.http import require_GET
from wagtail.images.models import Image
from wagtail.models import Site

from .models import SiteSettings
from .services.archive_service import get_researcher_filtered_items

logger = logging.getLogger(__name__)


@require_GET
@cache_page(300)
def researcher_section_filtered_items(request, slug, section_slug):
    """GET /api/researchers/<slug>/sections/<section_slug>/filtered-items/?search=&sort=&year="""
    search_term = request.GET.get("search", "")
    sort_option = request.GET.get("sort", "title_asc")
    year = request.GET.get("year", "")

    try:
        filtered_items = get_researcher_filtered_items(
            slug,
            section_slug,
            search_term=search_term,
            sort_option=sort_option,
            year=year,
        )
    except Exception:
        logger.exception(
            "Failed to build researcher filtered items",
            extra={"slug": slug, "section_slug": section_slug},
        )
        return JsonResponse({"error": "Unable to fetch filtered items"}, status=500)

    if filtered_items is None:
        return JsonResponse({"error": "Researcher section not found"}, status=404)

    return JsonResponse({"items": filtered_items, "count": len(filtered_items)})


@require_GET
@cache_page(300)
def image_detail(request, pk):
    """Simple API endpoint to fetch image details including file URL."""
    try:
        image = Image.objects.get(pk=pk)
        return JsonResponse({
            "id": image.id,
            "title": image.title,
            "file": {
                "url": image.file.url,
            },
            "meta": {
                "type": "wagtailimages.Image"
            }
        })
    except Image.DoesNotExist:
        logger.info("Image lookup failed", extra={"image_id": pk})
        return JsonResponse({"error": "Image not found"}, status=404)
    except Exception:
        logger.exception("Unexpected image API failure", extra={"image_id": pk})
        return JsonResponse({"error": "Unable to fetch image"}, status=500)


@require_GET
@cache_page(300)
def site_settings_detail(request):
    """Institute info endpoint."""
    site = Site.find_for_request(request) or Site.objects.first()

    if site is None:
        return JsonResponse(
            {
                "institute_name": "",
                "department": "",
                "address": "",
                "phone": "",
                "email": "",
            }
        )

    try:
        site_settings = SiteSettings.for_site(site)
    except Exception:
        logger.exception("Failed to fetch site settings")
        return JsonResponse({"error": "Unable to load site settings"}, status=500)

    return JsonResponse(
        {
            "institute_name": site_settings.institute_name,
            "department": site_settings.department,
            "address": site_settings.address,
            "phone": site_settings.phone,
            "email": site_settings.email,
        }
    )
