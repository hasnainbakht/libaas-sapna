from django.db.models import Sum, Count, F, Avg
from django.utils import timezone
from datetime import timedelta
from typing import List, Dict
from products.models import Product
from .models import SalesAnalytics


def get_trending_product_ids(days: int = 7) -> List[int]:
    """Get IDs of trending products based on recent sales"""
    start_date = timezone.now().date() - timedelta(days=days)

    trending = SalesAnalytics.objects.filter(
        sale_date__gte=start_date
    ).values('product_id').annotate(
        total_sold=Sum('quantity_sold'),
        total_revenue=Sum('revenue')
    ).order_by('-total_sold')[:10]

    return [item['product_id'] for item in trending]


def get_sales_dashboard(period: str = 'weekly') -> Dict:
    """Generate sales dashboard data"""
    from orders.models import Order
    from django.db.models import Sum as DSum
    
    if period == 'daily':
        days = 1
    elif period == 'weekly':
        days = 7
    elif period == 'monthly':
        days = 30
    else:
        days = 7

    start_date = timezone.now().date() - timedelta(days=days)
    start_datetime = timezone.now() - timedelta(days=days)

    # Use Order model for accurate total sales and orders (same source as Orders page)
    order_stats = Order.objects.filter(
        order_date__gte=start_datetime
    ).exclude(
        order_status='cancelled'
    ).aggregate(
        total_revenue=DSum('total_amount'),
        total_orders=Count('order_id')
    )
    
    # Get total items sold from SalesAnalytics (or calculate from OrderItem)
    sales_data = SalesAnalytics.objects.filter(
        sale_date__gte=start_date
    ).aggregate(
        total_quantity=Sum('quantity_sold')
    )

    # Top selling products from SalesAnalytics
    top_products = SalesAnalytics.objects.filter(
        sale_date__gte=start_date
    ).values(
        'product_id',
        product_name=F('product__name')
    ).annotate(
        quantity_sold=Sum('quantity_sold'),
        revenue=Sum('revenue')
    ).order_by('-quantity_sold')[:5]

    # Low stock items - check both product stock and size stock
    low_stock = Product.objects.filter(
        stock_qty__lte=F('low_stock_threshold'),
        is_active=True
    ).values('product_id', 'name', 'stock_qty', 'low_stock_threshold')[:10]

    # Sales trend (daily breakdown)
    sales_trend = SalesAnalytics.objects.filter(
        sale_date__gte=start_date
    ).values('sale_date').annotate(
        sales=Sum('revenue'),
        orders=Count('order_id', distinct=True)
    ).order_by('sale_date')

    # Sales by category
    sales_by_category = SalesAnalytics.objects.filter(
        sale_date__gte=start_date
    ).values(
        category=F('product__category')
    ).annotate(
        revenue=Sum('revenue')
    ).order_by('-revenue')

    total_category_revenue = sum(cat['revenue'] or 0 for cat in sales_by_category)
    sales_by_category_with_percentage = []
    for cat in sales_by_category:
        percentage = round((cat['revenue'] or 0) / total_category_revenue * 100, 1) if total_category_revenue > 0 else 0
        sales_by_category_with_percentage.append({
            'category': cat['category'] or 'Other',
            'revenue': float(cat['revenue'] or 0),
            'percentage': percentage
        })

    # Recent orders (from Order model)
    recent_orders = Order.objects.select_related('customer').order_by('-order_date')[:5]
    recent_orders_data = [{
        'order_id': order.order_id,
        'customer_name': order.customer.name if order.customer else 'Guest',
        'total_amount': float(order.total_amount),
        'order_status': order.order_status,
        'created_at': order.order_date.isoformat() if order.order_date else None
    } for order in recent_orders]

    return {
        'total_sales': float(order_stats['total_revenue'] or 0),
        'total_orders': order_stats['total_orders'] or 0,
        'total_items_sold': sales_data['total_quantity'] or 0,
        'top_products': list(top_products),
        'low_stock_items': list(low_stock),
        'sales_trend': list(sales_trend),
        'sales_by_category': sales_by_category_with_percentage,
        'recent_orders': recent_orders_data
    }


def predict_demand(product_id: int) -> Dict:
    """Predict future demand for a product"""
    # Get historical sales data (last 90 days)
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=90)

    sales_history = SalesAnalytics.objects.filter(
        product_id=product_id,
        sale_date__gte=start_date
    ).values('sale_date').annotate(
        quantity=Sum('quantity_sold')
    ).order_by('sale_date')

    if not sales_history:
        return {
            'product_id': product_id,
            'predicted_demand_7days': 0,
            'predicted_demand_30days': 0,
            'suggested_restock_qty': 0,
            'message': 'Insufficient data for prediction'
        }

    # Convert to list of quantities
    quantities = [item['quantity'] for item in sales_history]

    # Predict using simple moving average
    avg_daily_sales = sum(quantities) / len(quantities) if quantities else 0
    predicted_7days = int(avg_daily_sales * 7)
    predicted_30days = int(avg_daily_sales * 30)

    # Get current stock
    try:
        product = Product.objects.get(product_id=product_id)
        current_stock = product.stock_qty
        suggested_restock = max(0, predicted_30days - current_stock + int(avg_daily_sales * 7))
    except Product.DoesNotExist:
        current_stock = 0
        suggested_restock = 0

    return {
        'product_id': product_id,
        'current_stock': current_stock,
        'average_daily_sales': round(avg_daily_sales, 2),
        'predicted_demand_7days': predicted_7days,
        'predicted_demand_30days': predicted_30days,
        'suggested_restock_qty': suggested_restock
    }


