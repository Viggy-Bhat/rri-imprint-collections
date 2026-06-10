import logging

from ..models import ResearcherPage, ResearcherSectionPage
from ..utils.text_utils import to_section_slug
from ..utils.mapping_utils import normalize_mapping, get_mapping_value
from ..utils.sorting import sort_results

logger = logging.getLogger(__name__)


def build_items_from_blocks(blocks):
    """Convert StreamField blocks (publication/guidance/news) to normalized dicts."""
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

        if block_type == "news":
            headline = str(block_value.get("headline", "")).strip()

            if not headline:
                continue

            source = str(block_value.get("source", "")).strip()
            date = str(block_value.get("date", "")).strip()
            link = str(block_value.get("link", "")).strip()

            items.append(
                {
                    "title": headline,
                    "link": link,
                    "tag": f"Source: {source}" if source else "",
                    "meta_text": f"Date: {date}" if date else "",
                    "description": "",
                }
            )

    return items


def extract_and_filter_by_type(researcher_page, block_type, search="", sort_option="", year=""):
    """Scan sidebar_items + section pages for block type, build items, filter+sort."""
    sidebar_sections = list(getattr(researcher_page, "sidebar_items", []) or [])

    all_blocks = []

    for section in sidebar_sections or []:
        section_value = normalize_mapping(get_mapping_value(section, "value", section))
        smart_content = list(get_mapping_value(section_value, "smart_content", []) or [])

        for block in smart_content:
            b_type = get_mapping_value(block, "type") or get_mapping_value(block, "block_type")

            if b_type == block_type:
                all_blocks.append(block)

    if not all_blocks:
        section_pages = (
            ResearcherSectionPage.objects.live()
            .public()
            .descendant_of(researcher_page)
            .specific()
        )

        for section_page in section_pages:
            smart_content = list(getattr(section_page, "smart_content", []) or [])

            for block in smart_content:
                b_type = get_mapping_value(block, "type") or get_mapping_value(block, "block_type")

                if b_type == block_type:
                    all_blocks.append(block)

    items = build_items_from_blocks(all_blocks)
    return filter_items(items, search_term=search, sort_option=sort_option, year=year)


def build_section_items(researcher_page, section_slug):
    """Build section items from StreamField sidebar or ResearcherSectionPage.smart_content."""
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


def filter_items(items, search_term="", sort_option="", year=""):
    """Search by title/author/journal, filter by year, apply sort."""
    from ..utils.item_extractors import get_author, get_journal, get_year
    from ..utils.mapping_utils import get_mapping_value
    from ..utils.text_utils import to_plain_text

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

    return sort_results(results, sort_option)


def get_researcher_filtered_items(slug, section_slug, search_term="", sort_option="", year=""):
    """Resolve researcher page, build section items, filter+sort. Returns None if not found."""
    researcher_page = (
        ResearcherPage.objects.live().public().filter(slug=slug).specific().first()
    )

    if researcher_page is None:
        return None

    items = build_section_items(researcher_page, section_slug)

    if items is None:
        return None

    return filter_items(items, search_term=search_term, sort_option=sort_option, year=year)
