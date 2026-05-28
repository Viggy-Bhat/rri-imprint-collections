from django.test import SimpleTestCase

from researchers.services.archive_service import filter_items


class FilteringTests(SimpleTestCase):
    def _make_items(self):
        return [
            {
                "title": "Quantum mechanics in radio astronomy",
                "tag": "Journal: Radio Science",
                "meta_text": "Year: 1986",
                "journal": "Radio Science",
                "year": "1986",
                "author": "",
            },
            {
                "title": "Solid-state local oscillator systems",
                "tag": "Author: Arora, R.S.",
                "meta_text": "Year: 1984",
                "journal": "Journal of Radio Astronomy",
                "year": "1984",
                "author": "Arora, R.S.",
            },
            {
                "title": "Advanced signal processing",
                "tag": "Author: Bose, A.",
                "meta_text": "Year: 1990",
                "journal": "IEEE Transactions",
                "year": "1990",
                "author": "Bose, A.",
            },
            {
                "title": "Zeta function applications",
                "tag": "Journal: Math Review",
                "meta_text": "Year: 1986",
                "journal": "Math Review",
                "year": "1986",
                "author": "",
            },
        ]

    def test_search_by_title(self):
        items = self._make_items()
        results = filter_items(items, search_term="quantum")

        self.assertEqual(len(results), 1)
        self.assertIn("Quantum", results[0]["title"])

    def test_search_by_author(self):
        items = self._make_items()
        results = filter_items(items, search_term="arora")

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["author"], "Arora, R.S.")

    def test_search_by_journal(self):
        items = self._make_items()
        results = filter_items(items, search_term="radio")

        titles = [r["title"] for r in results]
        self.assertIn("Quantum mechanics in radio astronomy", titles)
        self.assertIn("Solid-state local oscillator systems", titles)

    def test_year_filter(self):
        items = self._make_items()
        results = filter_items(items, year="1986")

        self.assertEqual(len(results), 2)
        for r in results:
            self.assertEqual(r["year"], "1986")

    def test_sort_title_asc(self):
        items = self._make_items()
        results = filter_items(items, sort_option="title_asc")

        titles = [r["title"] for r in results]
        self.assertEqual(titles, sorted(titles))

    def test_sort_title_desc(self):
        items = self._make_items()
        results = filter_items(items, sort_option="title_desc")

        titles = [r["title"] for r in results]
        self.assertEqual(titles, sorted(titles, reverse=True))

    def test_sort_newest(self):
        items = self._make_items()
        results = filter_items(items, sort_option="newest")

        years = [int(r["year"]) for r in results if r.get("year")]
        self.assertEqual(years, sorted(years, reverse=True))

    def test_sort_oldest(self):
        items = self._make_items()
        results = filter_items(items, sort_option="oldest")

        years = [int(r["year"]) for r in results if r.get("year")]
        self.assertEqual(years, sorted(years))

    def test_sort_author_asc(self):
        items = self._make_items()
        results = filter_items(items, sort_option="author_asc")

        authors = [r.get("author", "") for r in results]
        non_empty = [a for a in authors if a]
        self.assertEqual(non_empty, sorted(non_empty))

    def test_sort_author_desc(self):
        items = self._make_items()
        results = filter_items(items, sort_option="author_desc")

        authors = [r.get("author", "") for r in results]
        non_empty = [a for a in authors if a]
        self.assertEqual(non_empty, sorted(non_empty, reverse=True))

    def test_sort_journal_asc(self):
        items = self._make_items()
        results = filter_items(items, sort_option="journal_asc")

        journals = [r.get("journal", "") for r in results]
        non_empty = [j for j in journals if j]
        self.assertEqual(non_empty, sorted(non_empty))

    def test_combined_search_year_sort(self):
        items = self._make_items()
        results = filter_items(items, search_term="radio", year="1986", sort_option="title_asc")

        self.assertEqual(len(results), 1)
        self.assertIn("Quantum", results[0]["title"])

    def test_empty_search_returns_all(self):
        items = self._make_items()
        results = filter_items(items, search_term="")

        self.assertEqual(len(results), 4)
