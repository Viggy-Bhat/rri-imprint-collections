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
            ("gallery", "Gallery Section"),
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
    images = blocks.ListBlock(ImageChooserBlock(), required=False)
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


class GalleryImageBlock(blocks.StructBlock):
    image = ImageChooserBlock(required=True)
    caption = blocks.CharBlock(required=False, help_text="Optional caption for the image")

    class Meta:
        icon = "image"
        label = "Gallery Image"


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
        ],
        required=False,
    )
    gallery = blocks.ListBlock(
        GalleryImageBlock(),
        required=False,
        help_text="Add images to create a gallery for this section",
    )

    class Meta:
        icon = "list-ul"
        label = "Sidebar Item"