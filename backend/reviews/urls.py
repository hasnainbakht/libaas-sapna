from django.urls import path
from . import views

urlpatterns = [
    path('', views.add_review, name='add_review'),
    path('product/<int:product_id>', views.get_product_reviews, name='get_product_reviews'),
]


