from django.http import JsonResponse
from wagtail.images.models import Image
from wagtail.models import Site

from .models import SiteSettings

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
        return JsonResponse({"error": "Image not found"}, status=404)


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

    site_settings = SiteSettings.for_site(site)

    return JsonResponse(
        {
            "institute_name": site_settings.institute_name,
            "department": site_settings.department,
            "address": site_settings.address,
            "phone": site_settings.phone,
            "email": site_settings.email,
        }
    )

