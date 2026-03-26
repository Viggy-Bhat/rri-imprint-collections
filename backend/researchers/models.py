
# Create your models here.
from django.db import models
from wagtail import blocks
from wagtail.models import Orderable, Page
from wagtail.fields import StreamField
from wagtail.admin.panels import FieldPanel
from wagtail.api import APIField
from wagtail.search import index
from wagtail.contrib.settings.models import BaseSiteSetting, register_setting
from wagtail.images.models import Image

from .blocks import (
    BiographySectionBlock,
    GuidanceBlock,
    NewsClippingBlock,
    PublicationBlock,
    SectionBlock,
    SidebarItemBlock,
    StudentSupervisionBlock,
)


class ResearcherPage(Page):
    template = "researchers/researcherpage.html"
    subpage_types = ["researchers.ResearcherSectionPage"]

    search_fields = Page.search_fields + [
        index.SearchField("title"),
    ]

    birth_date = models.DateField(null=True, blank=True)
    death_date = models.DateField(null=True, blank=True)

    field = models.CharField(max_length=255)

    profile_image = models.ForeignKey(
        Image,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+"
    )

    profile_items = StreamField(
        [
            (
                "profile_item",
                blocks.StructBlock(
                    [
                        ("label", blocks.CharBlock()),
                        ("value", blocks.CharBlock()),
                    ]
                ),
            ),
        ],
        use_json_field=True,
        blank=True,
        help_text="Add rows like Born, Field, Institution. You can add, reorder, or remove items.",
    )

    content = StreamField(
        [
            ("section", SectionBlock()),
        ],
        use_json_field=True,
        blank=True
    )

    sidebar_items = StreamField(
        [
            ("sidebar_item", SidebarItemBlock()),
        ],
        use_json_field=True,
        blank=True,
        help_text="Add and reorder sidebar navigation items and their content.",
    )

    bio_sections = StreamField(
        [
            ("bio_section", BiographySectionBlock()),
        ],
        use_json_field=True,
        blank=True,
        help_text="Add and reorder biography sections for center content.",
    )

    smart_content = StreamField(
        [
            ("publication", PublicationBlock()),
            ("guidance", GuidanceBlock()),
            ("news", NewsClippingBlock()),
            ("supervision", StudentSupervisionBlock()),
        ],
        use_json_field=True,
        blank=True,
    )

    content_panels = Page.content_panels + [
        FieldPanel("birth_date"),
        FieldPanel("death_date"),
        FieldPanel("field"),
        FieldPanel("profile_image"),
        FieldPanel("profile_items"),
        FieldPanel("content"),
        FieldPanel("sidebar_items"),
        FieldPanel("bio_sections"),
        FieldPanel("smart_content"),
    ]

    api_fields = [
        APIField("field"),
        APIField("birth_date"),
        APIField("death_date"),
        APIField("profile_image"),
        APIField("profile_items"),
        APIField("content"),
        APIField("sidebar_items"),
        APIField("bio_sections"),
        APIField("smart_content"),
    ]



class ResearcherSectionPage(Page):
    parent_page_types = ["researchers.ResearcherPage"]
    subpage_types = []

    subtitle = models.CharField(max_length=255, blank=True)

    smart_content = StreamField(
        [
            ("publication", PublicationBlock()),
            ("guidance", GuidanceBlock()),
            ("news", NewsClippingBlock()),
            ("supervision", StudentSupervisionBlock()),
        ],
        use_json_field=True,
        blank=True,
    )

    content_panels = Page.content_panels + [
        FieldPanel("subtitle"),
        FieldPanel("smart_content"),
    ]

    api_fields = [
        APIField("subtitle"),
        APIField("smart_content"),
    ]


@register_setting
class SiteSettings(BaseSiteSetting):
    institute_name = models.CharField(max_length=255)
    department = models.CharField(max_length=255)
    address = models.TextField()
    phone = models.CharField(max_length=50)
    email = models.EmailField()

    panels = [
        FieldPanel("institute_name"),
        FieldPanel("department"),
        FieldPanel("address"),
        FieldPanel("phone"),
        FieldPanel("email"),
    ]