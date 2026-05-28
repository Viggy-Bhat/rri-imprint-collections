import re


def to_plain_text(value):
    """Strip HTML tags, collapse whitespace."""
    return re.sub(r"\s+", " ", re.sub(r"<[^>]*>", " ", str(value or ""))).strip()


def to_section_slug(value):
    """Normalize string to kebab-case slug."""
    return re.sub(
        r"-+",
        "-",
        re.sub(r"[^a-z0-9\s-]", "", str(value or "").lower().strip()).replace(" ", "-"),
    ).strip("-")


def extract_labeled_segment(source, labels):
    """Extract labeled segments via regex (e.g. 'Author: Smith')."""
    text = to_plain_text(source)

    if not text:
        return ""

    for label in labels:
        expression = re.compile(rf"{label}\s*[:\-]\s*([^|,;\n]+)", re.IGNORECASE)
        match = expression.search(text)

        if match and match.group(1):
            return str(match.group(1)).strip()

    return ""
