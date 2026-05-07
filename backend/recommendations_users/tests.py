"""
LIBAAS SAPNA - Recommendation Tests
Unit tests for recommendation service and API.
"""

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.apps import apps
from unittest.mock import patch, MagicMock

from .services import (
    get_user_recommendations,
    get_user_purchase_profile,
    get_recommendations_for_guest,
    _resolve_field_value,
    CATEGORY_MATCH_POINTS,
    FABRIC_MATCH_POINTS,
    GENDER_MATCH_POINTS,
)

User = get_user_model()


class MockProduct:
    """Mock product for testing without full model setup."""
    def __init__(self, id, name, category, fabric, gender, color="Red", price=1000, stock_qty=10, is_active=True, image=None):
        self.id = id
        self.name = name
        self.category = category
        self.fabric = fabric
        self.gender = gender
        self.color = color
        self.price = price
        self.stock_qty = stock_qty
        self.is_active = is_active
        self.image = image


class MockCategory:
    """Mock category FK object."""
    def __init__(self, id, name):
        self.id = id
        self.name = name
        self.pk = id


class TestFieldResolution(TestCase):
    """Tests for _resolve_field_value utility."""

    def test_string_field(self):
        product = MockProduct(1, "Test", "Kurtis", "Cotton", "Women")
        self.assertEqual(_resolve_field_value(product, "category"), "Kurtis")

    def test_fk_field_with_name(self):
        cat = MockCategory(1, "Kurtis")
        product = MockProduct(1, "Test", cat, "Cotton", "Women")
        self.assertEqual(_resolve_field_value(product, "category"), "Kurtis")

    def test_none_field(self):
        product = MockProduct(1, "Test", None, "Cotton", "Women")
        self.assertIsNone(_resolve_field_value(product, "category"))

    def test_empty_string_field(self):
        product = MockProduct(1, "Test", "", "Cotton", "Women")
        self.assertIsNone(_resolve_field_value(product, "category"))


class TestPurchaseProfile(TestCase):
    """Tests for get_user_purchase_profile."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@libaas.com",
            username="testuser",
            password="testpass123"
        )

    @patch("recommendations.services.apps.get_model")
    def test_empty_history(self, mock_get_model):
        """Profile for user with no purchases should be empty."""
        # Mock OrderItem.objects to return empty queryset
        mock_order_item = MagicMock()
        mock_order_item.objects.filter.return_value.select_related.return_value.only.return_value = []
        mock_get_model.side_effect = lambda app, model: {
            ("orders", "OrderItem"): mock_order_item,
            ("products", "Product"): MockProduct,
        }.get((app, model))

        profile = get_user_purchase_profile(self.user)
        self.assertEqual(profile["top_categories"], [])
        self.assertEqual(profile["top_fabrics"], [])
        self.assertEqual(profile["top_genders"], [])
        self.assertEqual(profile["purchased_product_ids"], set())


class TestRecommendationScoring(TestCase):
    """Tests for recommendation scoring logic."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="scorer@libaas.com",
            username="scorer",
            password="testpass123"
        )

    @patch("recommendations.services.apps.get_model")
    @patch("recommendations.services.get_user_purchase_profile")
    def test_scoring_all_matches(self, mock_profile, mock_get_model):
        """Product matching all criteria should have max score."""
        mock_profile.return_value = {
            "top_categories": [("Kurtis", 5)],
            "top_fabrics": [("Silk", 3)],
            "top_genders": [("Women", 5)],
            "purchased_product_ids": {999},
        }

        # Mock Product.objects
        mock_product = MockProduct(
            id=1, name="Silk Kurti", category="Kurtis", fabric="Silk", gender="Women"
        )
        mock_qs = MagicMock()
        mock_qs.filter.return_value.select_related.return_value.prefetch_related.return_value.exclude.return_value = [mock_product]
        mock_qs.filter.return_value.select_related.return_value.prefetch_related.return_value = [mock_product]

        mock_product_model = MagicMock()
        mock_product_model.objects = mock_qs
        mock_get_model.side_effect = lambda app, model: {
            ("products", "Product"): mock_product_model,
        }.get((app, model))

        results = get_user_recommendations(self.user, limit=12)
        self.assertEqual(len(results), 1)
        expected_score = CATEGORY_MATCH_POINTS + FABRIC_MATCH_POINTS + GENDER_MATCH_POINTS
        self.assertEqual(results[0]["recommendation_score"], expected_score)
        self.assertIn("category", results[0]["match_reasons"])
        self.assertIn("fabric", results[0]["match_reasons"])
        self.assertIn("gender", results[0]["match_reasons"])

    @patch("recommendations.services.apps.get_model")
    @patch("recommendations.services.get_user_purchase_profile")
    def test_exclude_purchased(self, mock_profile, mock_get_model):
        """Already purchased products should be excluded by default."""
        mock_profile.return_value = {
            "top_categories": [("Kurtis", 5)],
            "top_fabrics": [],
            "top_genders": [],
            "purchased_product_ids": {1, 2, 3},
        }

        mock_product = MockProduct(
            id=1, name="Bought Kurti", category="Kurtis", fabric="Cotton", gender="Women"
        )

        mock_qs = MagicMock()
        # After exclude() should return empty
        mock_qs.filter.return_value.select_related.return_value.prefetch_related.return_value.exclude.return_value = []

        mock_product_model = MagicMock()
        mock_product_model.objects = mock_qs
        mock_get_model.side_effect = lambda app, model: {
            ("products", "Product"): mock_product_model,
        }.get((app, model))

        results = get_user_recommendations(self.user, limit=12)
        self.assertEqual(len(results), 0)

    @patch("recommendations.services.apps.get_model")
    def test_fallback_for_new_user(self, mock_get_model):
        """New users with no history should get fallback recommendations."""
        mock_product = MockProduct(
            id=10, name="New Arrival", category="Sarees", fabric="Silk", gender="Women"
        )

        mock_qs = MagicMock()
        mock_qs.filter.return_value.select_related.return_value.order_by.return_value = [mock_product]

        mock_product_model = MagicMock()
        mock_product_model.objects = mock_qs
        mock_get_model.side_effect = lambda app, model: {
            ("products", "Product"): mock_product_model,
        }.get((app, model))

        results = get_recommendations_for_guest(limit=12)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["recommendation_score"], 0)
        self.assertEqual(results[0]["match_reasons"], ["new_arrival"])


class TestRecommendationLimit(TestCase):
    """Tests for recommendation result limits."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="limit@libaas.com",
            username="limiter",
            password="testpass123"
        )

    @patch("recommendations.services.apps.get_model")
    @patch("recommendations.services.get_user_purchase_profile")
    def test_respects_limit(self, mock_profile, mock_get_model):
        """Should not return more than requested limit."""
        mock_profile.return_value = {
            "top_categories": [("Kurtis", 5)],
            "top_fabrics": [],
            "top_genders": [],
            "purchased_product_ids": set(),
        }

        products = [
            MockProduct(i, f"Product {i}", "Kurtis", "Cotton", "Women")
            for i in range(1, 25)
        ]

        mock_qs = MagicMock()
        mock_qs.filter.return_value.select_related.return_value.prefetch_related.return_value.exclude.return_value = products

        mock_product_model = MagicMock()
        mock_product_model.objects = mock_qs
        mock_get_model.side_effect = lambda app, model: {
            ("products", "Product"): mock_product_model,
        }.get((app, model))

        results = get_user_recommendations(self.user, limit=5)
        self.assertEqual(len(results), 5)

        results = get_user_recommendations(self.user, limit=12)
        self.assertLessEqual(len(results), 12)
