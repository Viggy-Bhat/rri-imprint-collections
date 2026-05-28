from .base import *  # noqa: F401,F403
from .base import _csv_env
import os


# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DJANGO_DEBUG", "1") == "1"

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    "dev-only-change-me-before-shared-deployments",
)

# SECURITY WARNING: define the correct hosts in production!
ALLOWED_HOSTS = _csv_env(
    "DJANGO_ALLOWED_HOSTS",
    default=["127.0.0.1", "localhost", "testserver"],
)

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# CORS Configuration for development
CORS_ALLOWED_ORIGINS = _csv_env(
    "DJANGO_CORS_ALLOWED_ORIGINS",
    default=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
)

CSRF_TRUSTED_ORIGINS = _csv_env(
    "DJANGO_CSRF_TRUSTED_ORIGINS",
    default=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
)

try:
    from .local import *
except ImportError:
    pass
