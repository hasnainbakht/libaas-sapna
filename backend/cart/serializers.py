from rest_framework import serializers
from .models import Cart
from products.serializers import ProductListSerializer


class CartSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source='product.product_id', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    price = serializers.DecimalField(source='product.final_price', max_digits=10, decimal_places=2, read_only=True)
    image = serializers.SerializerMethodField()
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ['cart_id', 'product_id', 'product_name', 'price', 'quantity', 'size', 'subtotal', 'image']
        read_only_fields = ['cart_id', 'subtotal']

    def get_image(self, obj):
        primary_image = obj.product.images.filter(is_primary=True).first()
        if not primary_image:
            primary_image = obj.product.images.first()
        
        if primary_image:
            # Use the .url property which handles both image field and image_url field
            url = primary_image.url
            if url and not url.startswith('http'):
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(url)
                # Fallback to absolute URL if request is not in context
                return f"http://localhost:8000{url}"
            return url
        return None


class CartAddSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)
    size = serializers.CharField(required=False, allow_blank=True, allow_null=True)

