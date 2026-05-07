"""
LIBAAS SAPNA - Recommendation Serializers
DRF Serializers for recommendation module.
"""

from rest_framework import serializers
from django.apps import apps


class CategorySerializer(serializers.Serializer):
    """
    Minimal serializer for category (handles both FK and string cases).
    """
    id = serializers.IntegerField(read_only=True, required=False)
    name = serializers.CharField(read_only=True, required=False)


class ProductListSerializer(serializers.ModelSerializer):
    """
    Optimized serializer for product recommendation cards.
    Lightweight and designed for list views.
    """
    category = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    id = serializers.IntegerField(source='product_id', read_only=True)

    class Meta:
        # Dynamic model reference for flexibility
        model = apps.get_model("products", "Product")
        fields = [
            "id",
            "product_id",
            "name",
            "category",
            "fabric",
            "gender",
            "color",
            "price",
            "stock_qty",
            "is_active",
            "image",
        ]

    def get_category(self, obj) -> str:
        category = getattr(obj, "category", None)
        if category is None:
            return ""
        # FK instance — has a real 'name' attribute (not a str method)
        if hasattr(category, "pk"):
            return getattr(category, "name", None) or getattr(category, "title", None) or str(category.pk)
        # Plain string
        return str(category)

    def get_image(self, obj) -> str:
        """
        Return product primary image URL.
        Assumes model has an 'image' ImageField or related images.
        """
        request = self.context.get("request")

        # Direct image field
        if hasattr(obj, "image") and obj.image:
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url

        # Related images (common e-commerce pattern)
        if hasattr(obj, "images") and obj.images.exists():
            first_image = obj.images.first()
            # If the related image model has a smart 'url' property (like ProductImage does)
            if hasattr(first_image, "url") and first_image.url:
                url = first_image.url
                return request.build_absolute_uri(url) if request and not url.startswith('http') else url
            # Fallback to pure ImageField if 'url' property doesn't exist
            elif hasattr(first_image, "image") and first_image.image:
                return request.build_absolute_uri(first_image.image.url) if request else first_image.image.url

        # Fallback placeholder
        return ""


class RecommendationResponseSerializer(serializers.Serializer):
    """
    Wrapper serializer for consistent API response format.
    """
    count = serializers.IntegerField(read_only=True)
    results = ProductListSerializer(many=True, read_only=True)
