from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import PaymentTransaction
from .services import get_payment_gateway
from orders.models import Order
import stripe
from django.conf import settings
import os
from django.views.decorators.csrf import csrf_exempt


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_payment(request):
    """Process payment for an order"""
    order_id = request.data.get('order_id')
    payment_method = request.data.get('payment_method')
    transaction_details = request.data.get('transaction_details', {})

    if not order_id or not payment_method:
        return Response(
            {'error': 'order_id and payment_method are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        order = Order.objects.get(order_id=order_id, customer=request.user)
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Create payment transaction
    payment = PaymentTransaction.objects.create(
        order=order,
        amount=order.total_amount,
        payment_method=payment_method,
        transaction_id=transaction_details.get('transaction_id'),
        status='pending'
    )

    # Process payment through gateway
    try:
        gateway = get_payment_gateway(payment_method)
        result = gateway.create_payment(order.order_id, order.total_amount)
        
        if 'error' in result:
            payment.status = 'failed'
            payment.save()
            return Response(
                {'error': result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment.transaction_id = result.get('transaction_id')
        payment.status = 'success'
        payment.save()

        # Update order status
        order.payment_status = 'paid'
        order.order_status = 'paid'
        order.save()

        return Response({
            'payment_id': payment.payment_id,
            'status': payment.status,
            'transaction_id': payment.transaction_id
        })
    except Exception as e:
        payment.status = 'failed'
        payment.save()
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_payment(request, payment_id):
    """Verify payment status"""
    try:
        payment = PaymentTransaction.objects.get(payment_id=payment_id, order__customer=request.user)
    except PaymentTransaction.DoesNotExist:
        return Response(
            {'error': 'Payment not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    return Response({
        'payment_id': payment.payment_id,
        'order_id': payment.order.order_id,
        'status': payment.status,
        'verified': payment.status == 'success'
    })


@api_view(['POST'])
def payment_webhook(request):
    """Handle payment gateway webhook"""
    return Response({'status': 'received'})


stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', os.getenv('STRIPE_SECRET_KEY', 'sk_test_simulated'))

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_stripe_checkout_session(request):
    """Create a Stripe checkout session for an order"""
    order_id = request.data.get('order_id')
    
    if not order_id:
        return Response({'error': 'order_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        order = Order.objects.get(order_id=order_id, customer=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    # In simulation mode (no real key), just return a dummy URL
    if stripe.api_key == 'sk_test_simulated' or not stripe.api_key:
        print("[STRIPE SIMULATION] Creating simulated checkout session")
        return Response({
            'url': f'http://localhost:3000/orders?simulated_success={order.order_id}'
        })

    try:
        # Build line items
        line_items = []
        for item in order.items.all():
            line_items.append({
                'price_data': {
                    'currency': 'pkr',
                    'product_data': {
                        'name': item.product.name,
                    },
                    'unit_amount': int(item.price * 100), # Stripe expects amount in cents/paisa
                },
                'quantity': item.quantity,
            })

        frontend_url = 'http://localhost:3000'
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            success_url=f'{frontend_url}/orders?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{frontend_url}/checkout?canceled=true',
            client_reference_id=str(order.order_id),
            customer_email=request.user.email,
        )
        
        return Response({'id': checkout_session.id, 'url': checkout_session.url})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@api_view(['POST'])
@permission_classes([])
def stripe_webhook(request):
    """Webhook to receive Stripe events"""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    endpoint_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', os.getenv('STRIPE_WEBHOOK_SECRET', ''))

    event = None
    
    if endpoint_secret:
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        except ValueError as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)
    else:
        # If no endpoint secret, just parse JSON (simulated/testing)
        import json
        try:
            event = json.loads(payload)
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)

    # Handle the checkout.session.completed event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        order_id = session.get('client_reference_id')
        
        if order_id:
            try:
                order = Order.objects.get(order_id=order_id)
                order.payment_status = 'paid'
                order.order_status = 'paid'
                order.transaction_id = session.get('payment_intent', '')
                order.save()
                
                # Create a payment transaction record
                PaymentTransaction.objects.create(
                    order=order,
                    amount=order.total_amount,
                    payment_method='card',
                    transaction_id=order.transaction_id,
                    status='success'
                )
                print(f"[STRIPE WEBHOOK] Order {order_id} marked as PAID")
            except Order.DoesNotExist:
                print(f"[STRIPE WEBHOOK] Order {order_id} not found")

    return Response({'status': 'success'})


