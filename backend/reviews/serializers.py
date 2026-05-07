from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = Review
        fields = ['review_id', 'customer_id', 'customer_name', 'product_id', 'rating', 'comment', 'review_date']
        read_only_fields = ['review_id', 'review_date']


