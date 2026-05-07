from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny, BasePermission
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, F
from .models import Product, ProductImage, Wishlist
from .serializers import (
    ProductListSerializer,
    ProductDetailSerializer,
    ProductCreateUpdateSerializer,
    ProductImageUploadSerializer,
    WishlistSerializer
)


class IsAdminRole(BasePermission):
    """
    Custom permission that allows access to users with role='admin' OR is_staff=True.
    This fixes the issue where Django's built-in IsAdminUser only checks is_staff,
    missing users created with role='admin' but is_staff=False.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_staff or getattr(request.user, 'role', None) == 'admin')
        )


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'gender', 'color', 'fabric']
    search_fields = ['name', 'description', 'name_urdu', 'subcategory']
    ordering_fields = ['price', 'created_at', 'name']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProductCreateUpdateSerializer
        return ProductDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'update_stock', 'low_stock', 'upload_image']:
            return [IsAdminRole()]
        elif self.action == 'list' or self.action == 'retrieve':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Price range filter
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')

        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        return queryset

    def destroy(self, request, *args, **kwargs):
        """Delete product - soft-delete if it has orders, hard-delete otherwise"""
        product = self.get_object()
        try:
            product.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            # ProtectedError: product has orders referencing it
            # Soft-delete by marking as inactive instead
            product.is_active = False
            product.save()
            return Response(
                {'detail': 'Product has existing orders and was deactivated instead of deleted.'},
                status=status.HTTP_200_OK
            )

    @action(detail=True, methods=['patch'], permission_classes=[IsAdminRole])
    def update_stock(self, request, pk=None):
        """Update product stock quantity"""
        product = self.get_object()
        stock_qty = request.data.get('stock_qty')

        if stock_qty is None:
            return Response(
                {'error': 'stock_qty is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        product.stock_qty = stock_qty
        product.save()

        # Check if low stock alert needed
        if product.is_low_stock:
            try:
                from alerts.services import create_stock_alert
                create_stock_alert(product, 'low')
            except:
                pass  # Alerts app might not be set up yet

        return Response({
            'product_id': product.product_id,
            'stock_qty': product.stock_qty,
            'message': 'Stock updated successfully'
        })

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def low_stock(self, request):
        """Get all low stock products"""
        low_stock_products = Product.objects.filter(
            stock_qty__lte=F('low_stock_threshold'),
            is_active=True
        )
        serializer = ProductListSerializer(low_stock_products, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def related(self, request, pk=None):
        """Get related products"""
        product = self.get_object()
        related = Product.objects.filter(
            category=product.category,
            gender=product.gender,
            is_active=True
        ).exclude(product_id=product.product_id)[:4]
        serializer = ProductListSerializer(related, many=True)
        return Response({'related_products': serializer.data})

    @action(detail=False, methods=['post'], permission_classes=[IsAdminRole],
            parser_classes=[MultiPartParser, FormParser])
    def upload_image(self, request):
        """Upload a product image file (temp upload, associated to product on save)"""
        image = request.FILES.get('image')
        is_primary = request.data.get('is_primary', 'false').lower() == 'true'
        product_id = request.data.get('product_id')

        if not image:
            return Response(
                {'error': 'No image file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # If product_id provided, associate directly; otherwise store as orphan
        if product_id:
            try:
                product = Product.objects.get(product_id=product_id)
                product_image = ProductImage.objects.create(
                    product=product,
                    image=image,
                    is_primary=is_primary
                )
            except Product.DoesNotExist:
                return Response(
                    {'error': f'Product with id {product_id} not found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Temporarily save the file by creating with a placeholder product
            # Use the first available product or return URL without DB record
            import tempfile, os
            from django.core.files.storage import default_storage
            from django.core.files.base import ContentFile

            # Save file to media/products/ and return URL without DB record
            ext = os.path.splitext(image.name)[1]
            filename = f'products/temp_{os.urandom(8).hex()}{ext}'
            saved_path = default_storage.save(filename, ContentFile(image.read()))
            url = request.build_absolute_uri(f'/media/{saved_path}')
            return Response({
                'image_id': None,
                'url': url,
                'is_primary': is_primary
            }, status=status.HTTP_201_CREATED)

        return Response({
            'image_id': product_image.image_id,
            'url': request.build_absolute_uri(product_image.image.url),
            'is_primary': product_image.is_primary
        }, status=status.HTTP_201_CREATED)


class WishlistViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user wishlist/favorites"""
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """Add product to wishlist"""
        product_id = request.data.get('product_id')
        if not product_id:
            return Response(
                {'error': 'product_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            product = Product.objects.get(product_id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        wishlist_item, created = Wishlist.objects.get_or_create(
            user=request.user,
            product=product
        )
        
        serializer = self.get_serializer(wishlist_item)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """Toggle product in wishlist (add if not present, remove if present)"""
        product_id = request.data.get('product_id')
        if not product_id:
            return Response(
                {'error': 'product_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            product = Product.objects.get(product_id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        wishlist_item = Wishlist.objects.filter(user=request.user, product=product).first()
        
        if wishlist_item:
            wishlist_item.delete()
            return Response({'is_favorite': False, 'message': 'Removed from favorites'})
        else:
            Wishlist.objects.create(user=request.user, product=product)
            return Response({'is_favorite': True, 'message': 'Added to favorites'})

    @action(detail=False, methods=['get'])
    def check(self, request):
        """Check if a product is in the user's wishlist"""
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response(
                {'error': 'product_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        is_favorite = Wishlist.objects.filter(
            user=request.user,
            product_id=product_id
        ).exists()
        
        return Response({'is_favorite': is_favorite})
