from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum
from .models import Cart
from .serializers import CartSerializer, CartAddSerializer
from products.models import Product, ProductSize


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cart(request):
    """Get user's cart"""
    cart_items = Cart.objects.filter(user=request.user)
    serializer = CartSerializer(cart_items, many=True, context={'request': request})
    
    total = sum(item.subtotal for item in cart_items)
    
    return Response({
        'cart_items': serializer.data,
        'total': total
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    """Add product to cart"""
    serializer = CartAddSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    product_id = serializer.validated_data['product_id']
    quantity = serializer.validated_data['quantity']
    size = serializer.validated_data.get('size', '')

    try:
        product = Product.objects.get(product_id=product_id, is_active=True)
    except Product.DoesNotExist:
        return Response(
            {'error': 'Product not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check stock availability - size-specific if size is provided
    if size:
        try:
            product_size = ProductSize.objects.get(product=product, size=size)
            available_stock = product_size.stock_qty
        except ProductSize.DoesNotExist:
            return Response(
                {'error': f'Size {size} not available for this product'},
                status=status.HTTP_400_BAD_REQUEST
            )
    else:
        available_stock = product.stock_qty

    # Check if already in cart and calculate total quantity
    existing_cart_item = Cart.objects.filter(
        user=request.user,
        product=product,
        size=size or None
    ).first()
    
    existing_qty = existing_cart_item.quantity if existing_cart_item else 0
    total_requested = existing_qty + quantity

    if total_requested > available_stock:
        return Response(
            {'error': f'Insufficient stock. Only {available_stock - existing_qty} more available.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Add or update cart item
    if existing_cart_item:
        existing_cart_item.quantity = total_requested
        existing_cart_item.save()
        cart_item = existing_cart_item
        created = False
    else:
        cart_item = Cart.objects.create(
            user=request.user,
            product=product,
            size=size or None,
            quantity=quantity
        )
        created = True

    serializer = CartSerializer(cart_item, context={'request': request})
    return Response({
        'message': 'Product added to cart',
        'cart_id': cart_item.cart_id,
        'item': serializer.data
    }, status=status.HTTP_201_CREATED)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_cart_item(request, cart_id):
    """Update cart item quantity"""
    try:
        cart_item = Cart.objects.get(cart_id=cart_id, user=request.user)
    except Cart.DoesNotExist:
        return Response(
            {'error': 'Cart item not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    quantity = request.data.get('quantity')
    if quantity is None or quantity < 1:
        return Response(
            {'error': 'Valid quantity is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check stock
    available_stock = cart_item.product.stock_qty
    if cart_item.size:
        try:
            ps = ProductSize.objects.get(product=cart_item.product, size=cart_item.size)
            available_stock = ps.stock_qty
        except ProductSize.DoesNotExist:
            pass

    if available_stock < quantity:
        return Response(
            {'error': f'Insufficient stock. Only {available_stock} available.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    cart_item.quantity = quantity
    cart_item.save()

    serializer = CartSerializer(cart_item, context={'request': request})
    return Response({
        'message': 'Cart updated',
        'item': serializer.data
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_cart(request, cart_id):
    """Remove item from cart"""
    try:
        cart_item = Cart.objects.get(cart_id=cart_id, user=request.user)
    except Cart.DoesNotExist:
        return Response(
            {'error': 'Cart item not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    cart_item.delete()
    return Response({'message': 'Item removed from cart'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_cart(request):
    """Clear entire cart"""
    Cart.objects.filter(user=request.user).delete()
    return Response({'message': 'Cart cleared'})


