from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from .models import StockAlert
from .serializers import StockAlertSerializer


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_alerts(request):
    """Get all stock alerts"""
    is_read = request.query_params.get('is_read')
    queryset = StockAlert.objects.all().order_by('-created_at')
    
    if is_read is not None:
        queryset = queryset.filter(is_read=is_read.lower() == 'true')
    
    serializer = StockAlertSerializer(queryset, many=True)
    return Response({'alerts': serializer.data})


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def mark_alert_read(request, alert_id):
    """Mark alert as read"""
    try:
        alert = StockAlert.objects.get(alert_id=alert_id)
    except StockAlert.DoesNotExist:
        return Response({'error': 'Alert not found'}, status=404)
    
    alert.is_read = True
    alert.save()
    
    return Response({'message': 'Alert marked as read'})


