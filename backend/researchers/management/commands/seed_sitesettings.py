from django.core.management.base import BaseCommand
from wagtail.models import Site

from researchers.models import SiteSettings


class Command(BaseCommand):
    help = "Seed default SiteSettings"

    def handle(self, *args, **options):
        site = Site.objects.first()

        if site is None:
            self.stdout.write(self.style.WARNING("No Wagtail Site found. Create a site first."))
            return

        settings, created = SiteSettings.objects.get_or_create(site=site)

        if created:
            settings.institute_name = "RAMAN RESEARCH INSTITUTE"
            settings.department = "LIBRARY"
            settings.address = "C. V. Raman Avenue, Bangalore - 560080, India"
            settings.phone = "(080) 23610122"
            settings.email = "library@rri.res.in"
            settings.save()
            self.stdout.write(self.style.SUCCESS("SiteSettings seeded successfully"))
            return

        self.stdout.write(self.style.SUCCESS("SiteSettings already exist; no changes made"))
