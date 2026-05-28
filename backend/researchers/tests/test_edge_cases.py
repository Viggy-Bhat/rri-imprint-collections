import json
from unittest.mock import MagicMock, patch

from django.test import RequestFactory, SimpleTestCase

from researchers.api.archive_views import (
    researcher_publications,
    researcher_section_count,
)
from researchers.utils.pagination import paginate_items
from researchers.services.archive_service import build_items_from_blocks, filter_items


class EdgeCasesTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    @patch("researchers.api.archive_views._get_researcher_page")
    @patch("researchers.api.archive_views.extract_and_filter_by_type")
    def test_invalid_limit_returns_400(self, mock_extract, mock_get_page):
        mock_get_page.return_value = (MagicMock(), None)

        request = self.factory.get(
            "/api/researchers/test/publications/",
            {"limit": "abc"},
        )

        response = researcher_publications(request, "test")

        self.assertEqual(response.status_code, 400)
        payload = json.loads(response.content)
        self.assertIn("error", payload)

    @patch("researchers.api.archive_views._get_researcher_page")
    @patch("researchers.api.archive_views.extract_and_filter_by_type")
    def test_invalid_offset_returns_400(self, mock_extract, mock_get_page):
        mock_get_page.return_value = (MagicMock(), None)

        request = self.factory.get(
            "/api/researchers/test/publications/",
            {"offset": "xyz"},
        )

        response = researcher_publications(request, "test")

        self.assertEqual(response.status_code, 400)
        payload = json.loads(response.content)
        self.assertIn("error", payload)

    @patch("researchers.api.archive_views._get_researcher_page")
    @patch("researchers.api.archive_views.extract_and_filter_by_type")
    def test_limit_exceeds_50_returns_400(self, mock_extract, mock_get_page):
        mock_get_page.return_value = (MagicMock(), None)

        request = self.factory.get(
            "/api/researchers/test/publications/",
            {"limit": "100"},
        )

        response = researcher_publications(request, "test")

        self.assertEqual(response.status_code, 400)
        payload = json.loads(response.content)
        self.assertIn("error", payload)

    @patch("researchers.api.archive_views._get_researcher_page")
    @patch("researchers.api.archive_views.extract_and_filter_by_type")
    def test_negative_limit_returns_400(self, mock_extract, mock_get_page):
        mock_get_page.return_value = (MagicMock(), None)

        request = self.factory.get(
            "/api/researchers/test/publications/",
            {"limit": "-1"},
        )

        response = researcher_publications(request, "test")

        self.assertEqual(response.status_code, 400)
        payload = json.loads(response.content)
        self.assertIn("error", payload)

    @patch("researchers.api.archive_views._get_researcher_page")
    @patch("researchers.api.archive_views.extract_and_filter_by_type")
    def test_negative_offset_returns_400(self, mock_extract, mock_get_page):
        mock_get_page.return_value = (MagicMock(), None)

        request = self.factory.get(
            "/api/researchers/test/publications/",
            {"offset": "-5"},
        )

        response = researcher_publications(request, "test")

        self.assertEqual(response.status_code, 400)
        payload = json.loads(response.content)
        self.assertIn("error", payload)

    @patch("researchers.api.archive_views._get_researcher_page")
    @patch("researchers.api.archive_views.extract_and_filter_by_type")
    def test_missing_params_uses_defaults(self, mock_extract, mock_get_page):
        mock_get_page.return_value = (MagicMock(), None)
        mock_extract.return_value = []

        request = self.factory.get("/api/researchers/test/publications/")

        response = researcher_publications(request, "test")

        self.assertEqual(response.status_code, 200)
        payload = json.loads(response.content)
        self.assertEqual(payload["limit"], 10)
        self.assertEqual(payload["offset"], 0)

    def test_empty_sidebar_items(self):
        items = []
        result = paginate_items(items, limit=10, offset=0)

        self.assertEqual(result["total"], 0)
        self.assertEqual(result["items"], [])
        self.assertFalse(result["has_next"])
        self.assertFalse(result["has_previous"])

    def test_malformed_block_data(self):
        blocks = [
            {"type": "publication", "value": {}},
            {"type": "publication", "value": {"title": "Valid"}},
            {"value": {"title": "No Type"}},
            None,
        ]

        items = build_items_from_blocks(blocks)

        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "Valid")

    def test_api_response_contract_stability(self):
        items = list(range(15))
        result = paginate_items(items, limit=10, offset=0)

        required_keys = {"items", "total", "limit", "offset", "has_next", "has_previous"}
        self.assertTrue(required_keys.issubset(set(result.keys())))

    def test_filter_items_empty_input(self):
        results = filter_items([], search_term="test")

        self.assertEqual(results, [])

    def test_filter_items_none_input(self):
        results = filter_items(None, search_term="test")

        self.assertEqual(results, [])
