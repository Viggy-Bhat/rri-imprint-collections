def paginate_items(items, limit=10, offset=0):
    """Split list into page. Returns {items, total, limit, offset, has_next, has_previous}."""
    total = len(items)
    page = items[offset:offset + limit]
    return {
        "items": page,
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_next": (offset + limit) < total,
        "has_previous": offset > 0,
    }
