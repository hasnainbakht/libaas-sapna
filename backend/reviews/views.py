from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db.models import Avg
from .models import Review
from .serializers import ReviewSerializer
from products.models import Product


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_review(request):
    """Add a review for a product"""
    product_id = request.data.get('product_id')
    rating = request.data.get('rating')
    comment = request.data.get('comment', '')

    if not product_id or not rating:
        return Response(
            {'error': 'product_id and rating are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if rating < 1 or rating > 5:
        return Response(
            {'error': 'Rating must be between 1 and 5'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        product = Product.objects.get(product_id=product_id)
    except Product.DoesNotExist:
        return Response(
            {'error': 'Product not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    review, created = Review.objects.get_or_create(
        customer=request.user,
        product=product,
        defaults={'rating': rating, 'comment': comment}
    )

    if not created:
        review.rating = rating
        review.comment = comment
        review.save()

    serializer = ReviewSerializer(review)
    return Response({
        'review_id': review.review_id,
        'message': 'Review added successfully',
        'review': serializer.data
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_product_reviews(request, product_id):
    """Get all reviews for a product"""
    try:
        product = Product.objects.get(product_id=product_id)
    except Product.DoesNotExist:
        return Response(
            {'error': 'Product not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    reviews = Review.objects.filter(product=product)
    avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0

    serializer = ReviewSerializer(reviews, many=True)
    return Response({
        'total': reviews.count(),
        'average_rating': round(avg_rating, 2),
        'reviews': serializer.data
    })

