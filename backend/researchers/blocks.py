from wagtail import blocks
from wagtail.images.blocks import ImageChooserBlock

# Rich text features for content editing
RICH_TEXT_FEATURES = [
    "bold",
    "italic",
    "underline",
    "link",
    "ol",
    "ul",
    "h2",
    "h3",
    "h4",
]


class RenditionImageChooserBlock(ImageChooserBlock):
    """Compatibility shim for historical migrations."""

    pass

class TextBlock(blocks.RichTextBlock):
    """Compatibility shim for historical migrations."""
    pass


class SectionItemBlock(blocks.StructBlock):
    title = blocks.CharBlock()
    description = blocks.RichTextBlock(
        features=RICH_TEXT_FEATURES,
        required=False,
        help_text="Rich text with formatting support"
    )

    class Meta:
        icon = "list-ul"

class SectionBlock(blocks.StructBlock):
    title = blocks.CharBlock(required=True)
    slug = blocks.CharBlock(required=True, help_text="Used for URL and sidebar")
    type = blocks.ChoiceBlock(
        choices=[
            ("text", "Text Section"),
            ("list", "List Section"),
        ],
        required=False,
        default="text",
    )
    content = blocks.RichTextBlock(
        features=RICH_TEXT_FEATURES,
        required=False,
        help_text="Rich text with bold, italic, underline, links, and lists"
    )
    items = blocks.ListBlock(SectionItemBlock(), required=False)

    class Meta:
        icon = "folder"


class SidebarContentItemBlock(blocks.StructBlock):
    title = blocks.CharBlock(required=True)
    link = blocks.URLBlock(required=False)
    tag = blocks.CharBlock(required=False, help_text="Author, source, or category")
    meta_text = blocks.CharBlock(required=False, help_text="Year, date, or additional info")
    description = blocks.RichTextBlock(
        features=RICH_TEXT_FEATURES,
        required=False,
        help_text="Brief description with formatting support"
    )

    class Meta:
        icon = "list-ul"


class BiographySectionBlock(blocks.StructBlock):
    title = blocks.CharBlock(required=True)
    content = blocks.RichTextBlock(
        features=RICH_TEXT_FEATURES,
        required=True,
        help_text="Rich text with bold, italic, underline, links, and lists"
    )

    class Meta:
        icon = "form"


class PublicationBlock(blocks.StructBlock):
    title = blocks.CharBlock(required=True)
    journal = blocks.CharBlock(required=False)
    year = blocks.IntegerBlock(required=False)
    link = blocks.URLBlock(required=False)

    class Meta:
        icon = "doc-full"
        label = "Publication"


class GuidanceBlock(blocks.StructBlock):
    student_name = blocks.CharBlock(required=True)
    thesis_title = blocks.CharBlock(required=True)
    year = blocks.IntegerBlock(required=False)
    link = blocks.URLBlock(required=False)

    class Meta:
        icon = "user"
        label = "Research Guidance"


class NewsClippingBlock(blocks.StructBlock):
    headline = blocks.CharBlock(required=True)
    source = blocks.CharBlock(required=False)
    date = blocks.DateBlock(required=False)
    link = blocks.URLBlock(required=False)

    class Meta:
        icon = "media"
        label = "News Clipping"


class StudentSupervisionBlock(blocks.StructBlock):
    student = blocks.CharBlock(required=True)
    topic = blocks.CharBlock(required=True)
    year = blocks.IntegerBlock(required=False)

    class Meta:
        icon = "group"
        label = "Student Supervision"


class GalleryImageItemBlock(blocks.StructBlock):
    image = ImageChooserBlock(required=True)
    caption = blocks.CharBlock(required=False, help_text="Optional caption for the image")
    about_image = blocks.RichTextBlock(
        required=False,
        features=["bold", "italic", "underline"],
        help_text="Optional rich text shown in the gallery modal as About this Image",
    )

    def to_python(self, value):
        # Backward compatibility: older entries were stored as image IDs/objects,
        # so convert them into the new struct format transparently.
        if isinstance(value, (int, str)):
            value = {
                "image": value,
                "caption": "",
                "about_image": "",
            }
        elif isinstance(value, dict) and "image" not in value:
            value = {
                "image": value,
                "caption": "",
                "about_image": "",
            }

        return super().to_python(value)

    def bulk_to_python(self, values):
        # Wagtail admin calls bulk_to_python for list items; normalize legacy
        # image-only entries first so old content can still be edited safely.
        normalized_values = []

        for value in values:
            if isinstance(value, (int, str)):
                normalized_values.append(
                    {
                        "image": value,
                        "caption": "",
                        "about_image": "",
                    }
                )
            elif isinstance(value, dict) and "image" not in value:
                normalized_values.append(
                    {
                        "image": value,
                        "caption": "",
                        "about_image": "",
                    }
                )
            else:
                normalized_values.append(value)

        return super().bulk_to_python(normalized_values)

    class Meta:
        icon = "image"
        label = "Gallery Image"


class GalleryBlock(blocks.StructBlock):
    title = blocks.CharBlock(required=False)
    images = blocks.ListBlock(
        GalleryImageItemBlock(),
        label="Gallery Images",
    )

    class Meta:
        icon = "image"
        label = "Gallery"


class SidebarItemBlock(blocks.StructBlock):
    title = blocks.CharBlock(required=True)
    subtitle = blocks.CharBlock(required=False)
    slug = blocks.CharBlock(required=True, help_text="Used for URL routing")
    items = blocks.ListBlock(SidebarContentItemBlock())
    smart_content = blocks.StreamBlock(
        [
            ("publication", PublicationBlock()),
            ("guidance", GuidanceBlock()),
            ("news", NewsClippingBlock()),
            ("supervision", StudentSupervisionBlock()),
            ("gallery", GalleryBlock()),
        ],
        required=False,
    )

    class Meta:
        icon = "list-ul"
        label = "Sidebar Item"
