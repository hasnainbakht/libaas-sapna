from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.db.models import Avg
from .models import Review, ReviewImage
from .serializers import ReviewSerializer
from products.models import Product


ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
MAX_IMAGES_PER_REVIEW = 3
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def add_review(request):
    """Add or update a review for a product, with optional image uploads (max 3)."""
    product_id = request.data.get('product_id')
    rating = request.data.get('rating')
    comment = request.data.get('comment', '')

    if not product_id or not rating:
        return Response(
            {'error': 'product_id and rating are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        rating = int(rating)
    except (ValueError, TypeError):
        return Response(
            {'error': 'Rating must be a number'},
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

    # Validate uploaded images
    images = request.FILES.getlist('images')
    if len(images) > MAX_IMAGES_PER_REVIEW:
        return Response(
            {'error': f'Maximum {MAX_IMAGES_PER_REVIEW} images allowed per review'},
            status=status.HTTP_400_BAD_REQUEST
        )

    for img in images:
        if img.content_type not in ALLOWED_IMAGE_TYPES:
            return Response(
                {'error': f'Invalid image type: {img.content_type}. Allowed: JPEG, PNG, WebP'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if img.size > MAX_IMAGE_SIZE:
            return Response(
                {'error': f'Image "{img.name}" exceeds 5MB limit'},
                status=status.HTTP_400_BAD_REQUEST
            )

    # Create or update the review
    review, created = Review.objects.get_or_create(
        customer=request.user,
        product=product,
        defaults={'rating': rating, 'comment': comment}
    )

    if not created:
        review.rating = rating
        review.comment = comment
        review.save()
        # If updating, remove old images before adding new ones (only if new images sent)
        if images:
            review.images.all().delete()

    # Save new images
    for img in images:
        ReviewImage.objects.create(review=review, image=img)

    serializer = ReviewSerializer(review, context={'request': request})
    return Response({
        'review_id': review.review_id,
        'message': 'Review added successfully' if created else 'Review updated successfully',
        'review': serializer.data
    }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


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

    reviews = Review.objects.filter(product=product).order_by('-review_date')
    avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0

    serializer = ReviewSerializer(reviews, many=True, context={'request': request})
    return Response({
        'total': reviews.count(),
        'average_rating': round(avg_rating, 2),
        'reviews': serializer.data
    })
