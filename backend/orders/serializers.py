import re
from rest_framework import serializers
from .models import Order, OrderItem
from products.serializers import ProductListSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_id = serializers.IntegerField(source='product.product_id', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['order_item_id', 'product_id', 'product_name', 'quantity', 'price', 'size']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['order_id', 'order_date', 'total_amount', 'payment_method',
                 'payment_status', 'order_status', 'shipping_address',
                 'shipping_city', 'shipping_phone', 'transaction_id', 'items']
        read_only_fields = ['order_id', 'order_date']


class OrderCreateSerializer(serializers.Serializer):
    shipping_address = serializers.CharField(min_length=10, error_messages={
        'min_length': 'Address must be at least 10 characters long to ensure accurate delivery in Pakistan.'
    })
    shipping_city = serializers.CharField(min_length=3)
    shipping_phone = serializers.CharField()
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_METHOD_CHOICES + [('card', 'Credit/Debit Card')])
    transaction_id = serializers.CharField(required=False, allow_blank=True, default='')
    payment_status = serializers.CharField(required=False, default='pending')
    order_status = serializers.CharField(required=False, default='pending_payment')

    def validate_shipping_phone(self, value):
        # Pakistani mobile number regex (e.g. 03001234567, +923001234567)
        pattern = r'^((\+92)?(0092)?(92)?(0)?)(3[0-9]{2})[0-9]{7}$'
        if not re.match(pattern, value.replace(" ", "").replace("-", "")):
            raise serializers.ValidationError("Please enter a valid Pakistani mobile number (e.g., 03001234567 or +923001234567).")
        return value

    def validate_shipping_city(self, value):
        if not re.match(r'^[a-zA-Z\s\-]+$', value):
            raise serializers.ValidationError("City name can only contain letters, spaces, and hyphens.")
        return value


