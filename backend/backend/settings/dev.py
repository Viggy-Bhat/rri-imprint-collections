from .base import *
import os


def _csv_env(name, default=None):
    raw_value = os.getenv(name, "")
    if not raw_value:
        return default or []
    return [entry.strip() for entry in raw_value.split(",") if entry.strip()]

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DJANGO_DEBUG", "1") == "1"

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    "django-insecure-1+m@9ye8w#fgv2)rhwd5gk*2+8f4#le#-q25%xf*4_$le3)^8d",
)

# SECURITY WARNING: define the correct hosts in production!
ALLOWED_HOSTS = _csv_env("DJANGO_ALLOWED_HOSTS", default=["*"])

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# CORS Configuration for development
CORS_ALLOWED_ORIGINS = _csv_env(
    "DJANGO_CORS_ALLOWED_ORIGINS",
    default=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
)

try:
    from .local import *
except ImportError:
    pass
