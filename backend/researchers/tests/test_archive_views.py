import json
from unittest.mock import MagicMock, patch

from django.http import JsonResponse
from django.test import RequestFactory, SimpleTestCase

from researchers.api.archive_views import (
    researcher_guidance,
    researcher_news,
    researcher_publications,
    researcher_section_count,
)


class ArchiveViewsTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    @patch("researchers.api.archive_views._get_researcher_page")
    @patch("researchers.api.archive_views.extract_and_filter_by_type")
    def test_publications_returns_paginated_response(self, mock_extract, mock_get_page):
        mock_get_page.return_value = (MagicMock(), None)
        mock_extract.return_value = [{"title": f"Pub {i}"} for i in range(25)]

        request = self.factory.get(
            "/api/researchers/test/publications/",
            {"limit": "10", "offset": "0"},
        )

        response = researcher_publications(request, "test")

        self.assertEqual(response.status_code, 200)
        payload = json.loads(response.content)
        self.assertEqual(len(payload["items"]), 10)
        self.assertEqual(payload["total"], 25)
        self.assertEqual(payload["limit"], 10)
        self.assertEqual(payload["offset"], 0)
        self.assertTrue(payload["has_next"])
        self.assertFalse(payload["has_previous"])

    @patch("researchers.api.archive_views._get_researcher_page")
    @patch("researchers.api.archive_views.extract_and_filter_by_type")
    def test_guidance_returns_paginated_response(self, mock_extract, mock_get_page):
        mock_get_page.return_value = (MagicMock(), None)
        mock_extract.return_value = [{"title": f"Guidance {i}"} for i in range(15)]

        request = self.factory.get(
            "/api/researchers/test/guidance/",
            {"limit": "10", "offset": "0"},
        )

        response = researcher_guidance(request, "test")

        self.assertEqual(response.status_code, 200)
        payload = json.loads(response.content)
        self.assertEqual(len(payload["items"]), 10)
        self.assertEqual(payload["total"], 15)
        self.assertTrue(payload["has_next"])

    @patch("researchers.api.archive_views._get_researcher_page")
    @patch("researchers.api.archive_views.extract_and_filter_by_type")
    def test_news_returns_paginated_response(self, mock_extract, mock_get_page):
        mock_get_page.return_value = (MagicMock(), None)
        mock_extract.return_value = [{"title": f"News {i}"} for i in range(5)]

        request = self.factory.get(
            "/api/researchers/test/news/",
            {"limit": "10", "offset": "0"},
        )

        response = researcher_news(request, "test")

        self.assertEqual(response.status_code, 200)
        payload = json.loads(response.content)
        self.assertEqual(len(payload["items"]), 5)
        self.assertEqual(payload["total"], 5)
        self.assertFalse(payload["has_next"])

    def test_section_count_returns_total(self):
        three_items = [{"title": "Item 1"}, {"title": "Item 2"}, {"title": "Item 3"}]

        with patch("researchers.api.archive_views._get_researcher_page") as mock_get_page, \
             patch("researchers.api.archive_views.build_section_items", new=lambda *a, **k: three_items):
            mock_get_page.return_value = (MagicMock(), None)

            from researchers.api import archive_views
            request = self.factory.get("/api/researchers/test/sections/pubs/count/")
            response = archive_views.researcher_section_count(request, "test", "pubs")

            self.assertEqual(response.status_code, 200)
            payload = json.loads(response.content)
            self.assertEqual(payload["total"], 3)

    @patch("researchers.api.archive_views._get_researcher_page")
    def test_404_for_unknown_researcher(self, mock_get_page):
        mock_get_page.return_value = (None, JsonResponse({"error": "Researcher not found"}, status=404))

        request = self.factory.get("/api/researchers/nonexistent/publications/")

        response = researcher_publications(request, "nonexistent")

        self.assertEqual(response.status_code, 404)
        payload = json.loads(response.content)
        self.assertIn("error", payload)

    @patch("researchers.api.archive_views._get_researcher_page")
    @patch("researchers.api.archive_views.extract_and_filter_by_type")
    def test_500_on_service_failure(self, mock_extract, mock_get_page):
        mock_get_page.return_value = (MagicMock(), None)
        mock_extract.side_effect = Exception("Service error")

        request = self.factory.get("/api/researchers/test/publications/")

        response = researcher_publications(request, "test")

        self.assertEqual(response.status_code, 500)
        payload = json.loads(response.content)
        self.assertIn("error", payload)
