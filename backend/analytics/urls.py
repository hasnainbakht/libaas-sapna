from django.urls import path
from . import views

urlpatterns = [
    path('dashboard', views.dashboard, name='dashboard'),
    path('trending', views.trending, name='trending'),
    path('predict-demand/<int:product_id>', views.predict_demand_view, name='predict_demand'),
]


