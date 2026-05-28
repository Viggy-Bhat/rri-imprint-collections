def normalize_mapping(value):
    """Coerce value to dict safely."""
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
    """Dict/attr fallback getter."""
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
