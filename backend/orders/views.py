from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.db import transaction
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderCreateSerializer
from cart.models import Cart
from products.models import Product
from alerts.services import create_stock_alert

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    """Create order from cart"""
    serializer = OrderCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    from django.conf import settings
    admin_email = request.headers.get('X-Admin-Email', getattr(settings, 'DEFAULT_FROM_EMAIL', 'm.mesum1800@gmail.com'))
    admin_phone = request.headers.get('X-Admin-Phone', getattr(settings, 'ADMIN_WHATSAPP_NUMBER', ''))

    # Fix for placeholder email causing bounces
    if not admin_email or 'libaassapna.com' in admin_email:
        from django.conf import settings
        admin_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'm.mesum1800@gmail.com')

    cart_items = Cart.objects.filter(user=request.user)
    if not cart_items.exists():
        return Response(
            {'error': 'Cart is empty'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Calculate total
    total = sum(item.subtotal for item in cart_items)

    # Check stock availability
    for cart_item in cart_items:
        available_stock = cart_item.product.stock_qty
        if cart_item.size:
            from products.models import ProductSize
            try:
                ps = ProductSize.objects.get(product=cart_item.product, size=cart_item.size)
                available_stock = ps.stock_qty
            except ProductSize.DoesNotExist:
                pass

        if available_stock < cart_item.quantity:
            size_info = f" (Size: {cart_item.size})" if cart_item.size else ""
            return Response(
                {'error': f'Insufficient stock for {cart_item.product.name}{size_info}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    with transaction.atomic():
        # Create order
        order = Order.objects.create(
            customer=request.user,
            total_amount=total,
            payment_method=serializer.validated_data['payment_method'],
            payment_status=serializer.validated_data.get('payment_status', 'pending'),
            order_status=serializer.validated_data.get('order_status', 'pending_payment'),
            shipping_address=serializer.validated_data['shipping_address'],
            shipping_city=serializer.validated_data['shipping_city'],
            shipping_phone=serializer.validated_data['shipping_phone'],
            transaction_id=serializer.validated_data.get('transaction_id', ''),
        )

        # Create order items and update stock
        for cart_item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                quantity=cart_item.quantity,
                price=cart_item.product.final_price,
                size=cart_item.size
            )

            # # Update product stock
            # cart_item.product.stock_qty -= cart_item.quantity
            # cart_item.product.save()
            
            # # LOW STOCK CHECK
            # if cart_item.product.stock_qty <= cart_item.product.low_stock_threshold and cart_item.product.stock_qty > 0:
            #     create_stock_alert(cart_item.product, 'low')

            # # OUT OF STOCK CHECK
            # elif cart_item.product.stock_qty <= 0:
            #     create_stock_alert(cart_item.product, 'out')
            # Update stock
            product = cart_item.product
            size_str = cart_item.size
            
            if size_str:
                from products.models import ProductSize
                try:
                    product_size = ProductSize.objects.get(product=product, size=size_str)
                    product_size.stock_qty -= cart_item.quantity
                    if product_size.stock_qty < 0:
                        product_size.stock_qty = 0
                    product_size.save()
                    # Product.stock_qty is synced via signal
                except ProductSize.DoesNotExist:
                    product.stock_qty -= cart_item.quantity
                    if product.stock_qty < 0:
                        product.stock_qty = 0
                    product.save()
            else:
                product.stock_qty -= cart_item.quantity
                if product.stock_qty < 0:
                    product.stock_qty = 0
                product.save()

            # Reload fresh value (IMPORTANT FIX)
            product.refresh_from_db()
            # ALERT LOGIC (SINGLE SOURCE OF TRUTH)
            # 1. Total Product Alert
            if product.stock_qty <= 0:
                create_stock_alert(product, 'out', admin_email=admin_email, admin_phone=admin_phone)
            elif product.stock_qty <= product.low_stock_threshold:
                create_stock_alert(product, 'low', admin_email=admin_email, admin_phone=admin_phone)

            # 2. Specific Size Alert
            if size_str:
                try:
                    ps = ProductSize.objects.get(product=product, size=size_str)
                    if ps.stock_qty <= 0:
                        create_stock_alert(product, 'out', size=size_str, admin_email=admin_email, admin_phone=admin_phone)
                    elif ps.stock_qty <= product.low_stock_threshold:
                        create_stock_alert(product, 'low', size=size_str, admin_email=admin_email, admin_phone=admin_phone)
                except ProductSize.DoesNotExist:
                    pass
        # Clear cart
        cart_items.delete()

        # Record sales analytics
        try:
            from analytics.models import SalesAnalytics
            for item in order.items.all():
                SalesAnalytics.objects.create(
                    product=item.product,
                    order=order,
                    quantity_sold=item.quantity,
                    revenue=item.subtotal,
                    sale_date=order.order_date.date()
                )
        except:
            pass  # Analytics app might not be set up yet

    # Generate payment URL if needed
    payment_url = None
    if serializer.validated_data['payment_method'] in ['easypaisa', 'jazzcash']:
        try:
            from payments.services import get_payment_gateway
            gateway = get_payment_gateway(serializer.validated_data['payment_method'])
            payment_data = gateway.create_payment(order.order_id, total)
            payment_url = payment_data.get('payment_url')
        except:
            pass

    # Send notifications (email + WhatsApp) asynchronously
    import threading
    
    def send_notifications_bg(order_obj, admin_email_str, admin_phone_str):
        try:
            from .notifications import (
                send_order_notification_email,
                send_customer_order_confirmation_email,
                send_order_whatsapp,
            )
            # 1) Order placed notification
            send_order_notification_email(order_obj, admin_email_str)
            send_customer_order_confirmation_email(order_obj)
            send_order_whatsapp(order_obj, admin_phone_str)
        except Exception as e:
            print(f"[NOTIFY] Background notification error: {e}")

    # Start the background thread
    threading.Thread(target=send_notifications_bg, args=(order, admin_email, admin_phone)).start()

    return Response({
        'order_id': order.order_id,
        'total_amount': float(total),
        'payment_url': payment_url,
        'message': 'Order created successfully'
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_order(request, order_id):
    """Get order details"""
    try:
        order = Order.objects.get(order_id=order_id, customer=request.user)
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = OrderSerializer(order)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_orders(request):
    """Get all orders for current user, or all orders for admin"""
    # Admin users can see all orders
    if request.user.is_staff or request.user.is_superuser or getattr(request.user, 'role', None) == 'admin':
        orders = Order.objects.all().order_by('-order_date')
    else:
        orders = Order.objects.filter(customer=request.user).order_by('-order_date')
    
    serializer = OrderSerializer(orders, many=True)
    return Response({
        'total': orders.count(),
        'orders': serializer.data
    })


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def update_order_status(request, order_id):
    """Update order status (Admin only)"""
    try:
        order = Order.objects.get(order_id=order_id)
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    new_status = request.data.get('status')
    if not new_status:
        return Response(
            {'error': 'Status is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    valid_statuses = [choice[0] for choice in Order.ORDER_STATUS_CHOICES]
    if new_status not in valid_statuses:
        return Response(
            {'error': 'Invalid status'},
            status=status.HTTP_400_BAD_REQUEST
        )

    order.order_status = new_status
    if new_status == 'paid':
        order.payment_status = 'paid'
    order.save()

    # Notify customer about status update
    try:
        from .notifications import send_customer_status_update_notification
        send_customer_status_update_notification(order)
    except Exception as e:
        print(f"[NOTIFY] Status update notification failed: {e}")

    return Response({
        'message': 'Order status updated',
        'order_id': order.order_id,
        'status': order.order_status
    })

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_orders_by_user(request, user_id):
    """Get all orders for a specific user (Admin only)"""
    orders = Order.objects.filter(customer__user_id=user_id).order_by('-order_date')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)
