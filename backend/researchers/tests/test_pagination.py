from django.test import SimpleTestCase

from researchers.utils.pagination import paginate_items


class PaginateItemsTests(SimpleTestCase):
    def test_basic_pagination(self):
        items = list(range(25))
        result = paginate_items(items, limit=10, offset=0)

        self.assertEqual(len(result["items"]), 10)
        self.assertEqual(result["total"], 25)
        self.assertEqual(result["limit"], 10)
        self.assertEqual(result["offset"], 0)
        self.assertTrue(result["has_next"])
        self.assertFalse(result["has_previous"])

    def test_second_page(self):
        items = list(range(25))
        result = paginate_items(items, limit=10, offset=10)

        self.assertEqual(len(result["items"]), 10)
        self.assertEqual(result["total"], 25)
        self.assertEqual(result["offset"], 10)
        self.assertTrue(result["has_next"])
        self.assertTrue(result["has_previous"])

    def test_last_page(self):
        items = list(range(25))
        result = paginate_items(items, limit=10, offset=20)

        self.assertEqual(len(result["items"]), 5)
        self.assertEqual(result["total"], 25)
        self.assertFalse(result["has_next"])
        self.assertTrue(result["has_previous"])

    def test_offset_beyond_total(self):
        items = list(range(25))
        result = paginate_items(items, limit=10, offset=100)

        self.assertEqual(len(result["items"]), 0)
        self.assertEqual(result["total"], 25)
        self.assertFalse(result["has_next"])
        self.assertTrue(result["has_previous"])

    def test_empty_list(self):
        items = []
        result = paginate_items(items, limit=10, offset=0)

        self.assertEqual(len(result["items"]), 0)
        self.assertEqual(result["total"], 0)
        self.assertFalse(result["has_next"])
        self.assertFalse(result["has_previous"])

    def test_exact_page_boundary(self):
        items = list(range(20))
        result = paginate_items(items, limit=10, offset=10)

        self.assertEqual(len(result["items"]), 10)
        self.assertEqual(result["total"], 20)
        self.assertFalse(result["has_next"])
        self.assertTrue(result["has_previous"])
