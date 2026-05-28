from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase

from researchers.services.archive_service import (
    build_items_from_blocks,
    build_section_items,
    extract_and_filter_by_type,
    filter_items,
)


class BuildItemsFromBlocksTests(SimpleTestCase):
    def test_build_items_from_blocks_publication(self):
        blocks = [
            {
                "type": "publication",
                "value": {
                    "title": "Test Publication",
                    "journal": "Test Journal",
                    "year": "2023",
                    "link": "https://example.com",
                },
            }
        ]

        items = build_items_from_blocks(blocks)

        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "Test Publication")
        self.assertEqual(items[0]["journal"], "Test Journal")
        self.assertEqual(items[0]["year"], "2023")
        self.assertEqual(items[0]["link"], "https://example.com")
        self.assertEqual(items[0]["tag"], "Journal: Test Journal")
        self.assertEqual(items[0]["meta_text"], "Year: 2023")

    def test_build_items_from_blocks_guidance(self):
        blocks = [
            {
                "type": "guidance",
                "value": {
                    "thesis_title": "Test Thesis",
                    "student_name": "Jane Doe",
                    "year": "2022",
                    "link": "https://example.com",
                    "description": "A test description",
                },
            }
        ]

        items = build_items_from_blocks(blocks)

        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "Test Thesis")
        self.assertEqual(items[0]["author"], "Jane Doe")
        self.assertEqual(items[0]["year"], "2022")
        self.assertEqual(items[0]["description"], "A test description")
        self.assertEqual(items[0]["tag"], "Author: Jane Doe")

    def test_build_items_from_blocks_news(self):
        blocks = [
            {
                "type": "news",
                "value": {
                    "headline": "Breaking News",
                    "source": "Science Daily",
                    "date": "2024-01-15",
                    "link": "https://example.com",
                },
            }
        ]

        items = build_items_from_blocks(blocks)

        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "Breaking News")
        self.assertEqual(items[0]["tag"], "Source: Science Daily")
        self.assertEqual(items[0]["meta_text"], "Date: 2024-01-15")
        self.assertEqual(items[0]["description"], "")

    def test_build_items_from_blocks_skips_empty_title(self):
        blocks = [
            {
                "type": "publication",
                "value": {
                    "title": "",
                    "journal": "Test Journal",
                    "year": "2023",
                    "link": "https://example.com",
                },
            },
            {
                "type": "publication",
                "value": {
                    "title": "Valid Title",
                    "journal": "Test Journal",
                    "year": "2023",
                    "link": "https://example.com",
                },
            },
        ]

        items = build_items_from_blocks(blocks)

        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "Valid Title")


class ExtractAndFilterByTypeTests(SimpleTestCase):
    @patch("researchers.services.archive_service.ResearcherSectionPage")
    def test_extract_and_filter_by_type_sidebar(self, mock_section_page):
        mock_section_page.objects.live.return_value.public.return_value.descendant_of.return_value.specific.return_value = []

        mock_page = MagicMock()
        mock_page.sidebar_items = [
            {
                "value": {
                    "title": "Publications",
                    "smart_content": [
                        {
                            "type": "publication",
                            "value": {
                                "title": "Sidebar Publication",
                                "journal": "Test Journal",
                                "year": "2023",
                                "link": "",
                            },
                        }
                    ],
                }
            }
        ]

        items = extract_and_filter_by_type(mock_page, "publication")

        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "Sidebar Publication")

    @patch("researchers.services.archive_service.ResearcherSectionPage")
    def test_extract_and_filter_by_type_section_page(self, mock_section_page):
        mock_section = MagicMock()
        mock_section.smart_content = [
            {
                "type": "publication",
                "value": {
                    "title": "Section Page Publication",
                    "journal": "Test Journal",
                    "year": "2023",
                    "link": "",
                },
            }
        ]
        mock_section_page.objects.live.return_value.public.return_value.descendant_of.return_value.specific.return_value = [mock_section]

        mock_page = MagicMock()
        mock_page.sidebar_items = []

        items = extract_and_filter_by_type(mock_page, "publication")

        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "Section Page Publication")


class FilterItemsContractTests(SimpleTestCase):
    def test_filter_items_preserves_api_contract(self):
        items = [
            {
                "title": "Test Item",
                "link": "https://example.com",
                "tag": "Test Tag",
                "meta_text": "Test Meta",
                "journal": "Test Journal",
                "year": "2023",
                "author": "Test Author",
                "description": "Test Description",
            }
        ]

        results = filter_items(items, search_term="test", sort_option="title_asc", year="2023")

        self.assertEqual(len(results), 1)
        required_keys = {"title", "link", "tag", "meta_text", "journal", "year", "author", "description"}
        self.assertTrue(required_keys.issubset(set(results[0].keys())))
