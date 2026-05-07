from rest_framework import serializers
from .models import StockAlert


class StockAlertSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source='product.product_id', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = StockAlert
        fields = ['alert_id', 'product_id', 'product_name', 'alert_type', 'message', 'is_read', 'created_at']


