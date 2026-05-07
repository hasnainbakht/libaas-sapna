from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from .services import get_sales_dashboard, predict_demand, get_trending_product_ids
from products.serializers import ProductListSerializer
from products.models import Product


@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard(request):
    """Get sales dashboard data"""
    period = request.query_params.get('period', 'weekly')
    data = get_sales_dashboard(period)
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trending(request):
    """Get trending products"""
    days = int(request.query_params.get('days', 7))
    trending_ids = get_trending_product_ids(days)
    products = Product.objects.filter(product_id__in=trending_ids, is_active=True)
    serializer = ProductListSerializer(products, many=True)
    return Response({'trending_products': serializer.data})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def predict_demand_view(request, product_id):
    """Predict demand for a product"""
    prediction = predict_demand(product_id)
    return Response(prediction)


