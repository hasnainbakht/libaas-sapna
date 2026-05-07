from rest_framework import serializers
from .models import Product, ProductImage, ProductSize, Wishlist


class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.ReadOnlyField()
    image_url = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    class Meta:
        model = ProductImage
        fields = ['image_id', 'image', 'image_url', 'url', 'is_primary', 'display_order']
        extra_kwargs = {
            'image': {'required': False}
        }


class ProductImageUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading images to a product"""
    class Meta:
        model = ProductImage
        fields = ['image_id', 'image', 'is_primary', 'display_order']
        read_only_fields = ['image_id']


class ProductSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSize
        fields = ['size_id', 'size', 'stock_qty', 'is_low_stock', 'is_out_of_stock']



class ProductListSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    sizes = ProductSizeSerializer(many=True, read_only=True)
    final_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    rating = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['product_id', 'name', 'name_urdu', 'category', 'gender', 'price',
                 'discount', 'final_price', 'stock_qty', 'low_stock_threshold', 'images', 'sizes', 'rating', 'color', 'fabric']

    def get_rating(self, obj):
        # Calculate average rating from reviews
        from reviews.models import Review
        from django.db.models import Avg
        reviews = Review.objects.filter(product=obj)
        if reviews.exists():
            avg_rating = reviews.aggregate(Avg('rating'))['rating__avg']
            return round(avg_rating, 2)
        return 0.0


class ProductDetailSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    sizes = ProductSizeSerializer(many=True, read_only=True)
    final_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    rating = serializers.SerializerMethodField()
    related_products = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'

    def get_rating(self, obj):
        from reviews.models import Review
        from django.db.models import Avg
        reviews = Review.objects.filter(product=obj)
        if reviews.exists():
            avg_rating = reviews.aggregate(Avg('rating'))['rating__avg']
            return round(avg_rating, 2)
        return 0.0

    def get_related_products(self, obj):
        # Get products from same category and gender
        related = Product.objects.filter(
            category=obj.category,
            gender=obj.gender,
            is_active=True
        ).exclude(product_id=obj.product_id)[:4]
        return ProductListSerializer(related, many=True).data


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, required=False)
    sizes = ProductSizeSerializer(many=True, required=False)

    class Meta:
        model = Product
        exclude = ['created_at', 'updated_at']

    def create(self, validated_data):
        images_data = validated_data.pop('images', [])
        sizes_data = validated_data.pop('sizes', [])

        product = Product.objects.create(**validated_data)

        for image_data in images_data:
            ProductImage.objects.create(product=product, **image_data)

        for size_data in sizes_data:
            ProductSize.objects.create(product=product, **size_data)

        return product

    def update(self, instance, validated_data):
        images_data = validated_data.pop('images', None)
        sizes_data = validated_data.pop('sizes', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if images_data is not None:
            instance.images.all().delete()
            for image_data in images_data:
                ProductImage.objects.create(product=instance, **image_data)

        if sizes_data is not None:
            instance.sizes.all().delete()
            for size_data in sizes_data:
                ProductSize.objects.create(product=instance, **size_data)

        return instance


class WishlistSerializer(serializers.ModelSerializer):
    """Serializer for wishlist items"""
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Wishlist
        fields = ['wishlist_id', 'product', 'product_id', 'added_at']
        read_only_fields = ['wishlist_id', 'added_at']

    def create(self, validated_data):
        user = self.context['request'].user
        product_id = validated_data.get('product_id')
        product = Product.objects.get(product_id=product_id)
        
        wishlist_item, created = Wishlist.objects.get_or_create(
            user=user,
            product=product
        )
        return wishlist_item

