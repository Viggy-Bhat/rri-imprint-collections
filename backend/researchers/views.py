import logging
import re

from django.http import JsonResponse
from django.views.decorators.cache import cache_page
from django.views.decorators.http import require_GET
from wagtail.images.models import Image
from wagtail.models import Site

from .models import ResearcherPage, ResearcherSectionPage
from .models import SiteSettings

logger = logging.getLogger(__name__)


def to_plain_text(value):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]*>", " ", str(value or ""))).strip()


def to_section_slug(value):
    return re.sub(
        r"-+",
        "-",
        re.sub(r"[^a-z0-9\s-]", "", str(value or "").lower().strip()).replace(" ", "-"),
    ).strip("-")


def extract_labeled_segment(source, labels):
    text = to_plain_text(source)

    if not text:
        return ""

    for label in labels:
        expression = re.compile(rf"{label}\s*[:\-]\s*([^|,;\n]+)", re.IGNORECASE)
        match = expression.search(text)

        if match and match.group(1):
            return str(match.group(1)).strip()

    return ""


def normalize_mapping(value):
    if isinstance(value, dict):
        return value

    if hasattr(value, "items"):
        try:
            return dict(value.items())
        except Exception:
            pass

    try:
        return dict(value)
    except Exception:
        return {}


def get_mapping_value(value, key, default=""):
    if isinstance(value, dict):
        return value.get(key, default)

    if hasattr(value, "get"):
        try:
            return value.get(key, default)
        except Exception:
            pass

    try:
        return getattr(value, key)
    except Exception:
        return default


def get_author(item):
    return (
        extract_labeled_segment(get_mapping_value(item, "meta_text"), ["author", "authors"])
        or extract_labeled_segment(get_mapping_value(item, "description"), ["author", "authors"])
        or to_plain_text(get_mapping_value(item, "author"))
    )


def get_journal(item):
    return (
        extract_labeled_segment(
            get_mapping_value(item, "meta_text"),
            ["journal", "published in", "publication", "conference"],
        )
        or extract_labeled_segment(
            get_mapping_value(item, "description"),
            ["journal", "published in", "publication", "conference"],
        )
        or to_plain_text(get_mapping_value(item, "journal"))
    )


def get_year(item):
    direct_year = get_mapping_value(item, "year")

    try:
        numeric_year = int(str(direct_year).strip())
    except (TypeError, ValueError):
        numeric_year = None

    if numeric_year and numeric_year > 0:
        return numeric_year

    text = " ".join(
        filter(
            None,
            [
                to_plain_text(get_mapping_value(item, "meta_text")),
                to_plain_text(get_mapping_value(item, "description")),
                to_plain_text(get_mapping_value(item, "tag")),
            ],
        )
    )

    year_match = re.search(r"\b(19|20)\d{2}\b", text)
    return int(year_match.group(0)) if year_match else None


def sort_results(results, sort_option):
    sorted_results = list(results)

    if sort_option == "title_desc":
        return sorted(sorted_results, key=lambda item: to_plain_text(get_mapping_value(item, "title")), reverse=True)

    if sort_option == "author_asc":
        return sorted(sorted_results, key=get_author)

    if sort_option == "author_desc":
        return sorted(sorted_results, key=get_author, reverse=True)

    if sort_option == "journal_asc":
        return sorted(sorted_results, key=get_journal)

    if sort_option == "newest":
        return sorted(sorted_results, key=lambda item: get_year(item) or 0, reverse=True)

    if sort_option == "oldest":
        return sorted(sorted_results, key=lambda item: get_year(item) or 0)

    return sorted(sorted_results, key=lambda item: to_plain_text(get_mapping_value(item, "title")))


def build_items_from_blocks(blocks):
    items = []

    for block in blocks or []:
        block_type = get_mapping_value(block, "type") or get_mapping_value(block, "block_type")
        block_value = normalize_mapping(get_mapping_value(block, "value", {}))

        if block_type == "publication":
            title = str(block_value.get("title", "")).strip()

            if not title:
                continue

            journal = str(block_value.get("journal", "")).strip()
            year = str(block_value.get("year", "")).strip()
            link = str(block_value.get("link", "")).strip()

            items.append(
                {
                    "title": title,
                    "link": link,
                    "tag": f"Journal: {journal}" if journal else "",
                    "meta_text": f"Year: {year}" if year else "",
                    "journal": journal,
                    "year": year,
                }
            )
            continue

        if block_type == "guidance":
            title = str(block_value.get("thesis_title", block_value.get("title", ""))).strip()

            if not title:
                continue

            author = str(block_value.get("student_name", "")).strip()
            year = str(block_value.get("year", "")).strip()
            link = str(block_value.get("link", "")).strip()
            description = str(block_value.get("description", "")).strip()

            items.append(
                {
                    "title": title,
                    "link": link,
                    "tag": f"Author: {author}" if author else "",
                    "meta_text": f"Year: {year}" if year else "",
                    "description": description,
                    "author": author,
                    "year": year,
                }
            )

    return items


def build_section_items(researcher_page, section_slug):
    normalized_section_slug = to_section_slug(section_slug)

    sidebar_sections = list(getattr(researcher_page, "sidebar_items", []) or [])
    matched_section = None

    for section in sidebar_sections:
        section_value = normalize_mapping(get_mapping_value(section, "value", section))
        section_slug_value = to_section_slug(
            get_mapping_value(section_value, "slug") or get_mapping_value(section_value, "title")
        )

        if section_slug_value == normalized_section_slug:
            matched_section = section_value
            break

    section_page = (
        ResearcherSectionPage.objects.live()
        .public()
        .descendant_of(researcher_page)
        .filter(slug=normalized_section_slug)
        .specific()
        .first()
    )

    if matched_section is None and section_page is None:
        return None

    section_items = []

    if matched_section is not None:
        raw_items = list(get_mapping_value(matched_section, "items", []) or [])

        for item in raw_items:
            item_value = normalize_mapping(get_mapping_value(item, "value", item))
            title = str(item_value.get("title", "")).strip()

            if not title:
                continue

            section_items.append(
                {
                    "title": title,
                    "link": str(item_value.get("link", "")).strip(),
                    "tag": str(item_value.get("tag", "")).strip(),
                    "meta_text": str(item_value.get("meta_text", "")).strip(),
                    "description": str(item_value.get("description", "")).strip(),
                }
            )

    if section_items:
        return section_items

    section_blocks = []

    if matched_section is not None:
        section_blocks = list(get_mapping_value(matched_section, "smart_content", []) or [])

    if not section_blocks and section_page is not None:
        section_blocks = list(getattr(section_page, "smart_content", []) or [])

    return build_items_from_blocks(section_blocks)


def filter_items(items, search_term="", sort_option="title_asc", year=""):
    normalized_search = str(search_term or "").lower().strip()

    try:
        year_number = int(str(year or "").strip())
    except (TypeError, ValueError):
        year_number = None

    has_year = year_number is not None and str(year or "").strip() != ""
    results = list(items or [])

    if normalized_search:
        results = [
            item
            for item in results
            if normalized_search in to_plain_text(get_mapping_value(item, "title")).lower()
            or normalized_search in get_author(item).lower()
            or normalized_search in get_journal(item).lower()
        ]

    if has_year:
        results = [item for item in results if get_year(item) == year_number]

    return sort_results(results, sort_option or "title_asc")


def get_researcher_filtered_items(slug, section_slug, search_term="", sort_option="title_asc", year=""):
    researcher_page = (
        ResearcherPage.objects.live().public().filter(slug=slug).specific().first()
    )

    if researcher_page is None:
        return None

    items = build_section_items(researcher_page, section_slug)

    if items is None:
        return None

    return filter_items(items, search_term=search_term, sort_option=sort_option, year=year)


@require_GET
@cache_page(300)
def researcher_section_filtered_items(request, slug, section_slug):
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
    """
    Simple API endpoint to fetch image details including file URL
    """
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

