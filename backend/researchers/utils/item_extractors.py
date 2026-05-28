import re

from .text_utils import to_plain_text, extract_labeled_segment
from .mapping_utils import get_mapping_value


def get_author(item):
    """Extract author from meta_text, description, or author field."""
    return (
        extract_labeled_segment(get_mapping_value(item, "meta_text"), ["author", "authors"])
        or extract_labeled_segment(get_mapping_value(item, "description"), ["author", "authors"])
        or to_plain_text(get_mapping_value(item, "author"))
    )


def get_journal(item):
    """Extract journal from meta_text, description, or journal field."""
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
    """Extract year from direct field or regex scan of text fields."""
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
