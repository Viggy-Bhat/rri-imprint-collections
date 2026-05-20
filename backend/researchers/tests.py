import json
from unittest.mock import patch

from django.test import RequestFactory, SimpleTestCase

from .views import filter_items, researcher_section_filtered_items


class ResearcherFilteredItemsTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_filter_items_uses_backend_sort_and_year(self):
        items = [
            {
                "title": "Solid-state local oscillator systems for multimetre-wave radio astronomy receivers.",
                "tag": "Journal: Journal of Radio Astronomy",
                "meta_text": "Year: 1984",
                "journal": "Journal of Radio Astronomy",
                "year": "1984",
            },
            {
                "title": "Quantum receiver notes",
                "tag": "Author: Arora, R.S.",
                "meta_text": "Year: 1986",
                "author": "Arora, R.S.",
                "year": "1986",
            },
        ]

        results = filter_items(items, search_term="arora", sort_option="newest", year="1986")

        self.assertEqual([item["title"] for item in results], ["Quantum receiver notes"])

    @patch("researchers.views.get_researcher_filtered_items")
    def test_endpoint_returns_filtered_items_payload(self, mock_get_items):
        mock_get_items.return_value = [
            {
                "title": "Quantum receiver notes",
                "tag": "Author: Arora, R.S.",
                "meta_text": "Year: 1986",
            }
        ]

        request = self.factory.get(
            "/api/researchers/rri/sections/publications/filtered-items/",
            {"search": "arora", "sort": "title_asc", "year": "1986"},
        )

        response = researcher_section_filtered_items(request, "rri", "publications")

        self.assertEqual(response.status_code, 200)

        payload = json.loads(response.content)
        self.assertEqual(payload["count"], 1)
        self.assertEqual(payload["items"][0]["title"], "Quantum receiver notes")
