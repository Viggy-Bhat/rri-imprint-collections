from .item_extractors import get_author, get_journal, get_year
from .mapping_utils import get_mapping_value
from .text_utils import to_plain_text


def sort_results(results, sort_option):
    """Sort by title_asc/desc, author_asc/desc, journal_asc, newest, oldest."""
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
