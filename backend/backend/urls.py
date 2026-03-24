from django.conf import settings
from django.urls import include, path
from django.contrib import admin

from wagtail.admin import urls as wagtailadmin_urls
from wagtail import urls as wagtail_urls
from wagtail.documents import urls as wagtaildocs_urls

from wagtail.api.v2.views import PagesAPIViewSet
from wagtail.api.v2.router import WagtailAPIRouter
from search import views as search_views
from researchers.views import image_detail, site_settings_detail

api_router = WagtailAPIRouter("wagtailapi")

api_router.register_endpoint("pages", PagesAPIViewSet)

urlpatterns = [
    path("api/v2/", api_router.urls),
    path("api/images/<int:pk>/", image_detail, name="image_detail"),
    path("api/site-settings/", site_settings_detail, name="site_settings_detail"),
    path("django-admin/", admin.site.urls),
    path("admin/", include(wagtailadmin_urls)),
    path("documents/", include(wagtaildocs_urls)),
    path("search/", search_views.search, name="search"),
    path("", include(wagtail_urls)),
]

if settings.DEBUG:
    from django.conf.urls.static import static
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns

    urlpatterns += staticfiles_urlpatterns()
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

