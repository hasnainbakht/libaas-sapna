from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .services import generate_recommendations
from products.serializers import ProductListSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recommendations(request):
    """Get product recommendations for current user"""
    limit = int(request.query_params.get('limit', 10))
    recommendations = generate_recommendations(request.user, limit)
    serializer = ProductListSerializer(recommendations, many=True)
    return Response({'recommendations': serializer.data})


