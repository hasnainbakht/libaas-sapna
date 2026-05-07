from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, WishlistViewSet

router = DefaultRouter()
router.register(r'wishlist', WishlistViewSet, basename='wishlist')
router.register(r'', ProductViewSet, basename='product')

urlpatterns = [
    path('', include(router.urls)),
]

