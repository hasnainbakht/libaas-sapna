from django.urls import path
from . import views

urlpatterns = [
    path('', views.create_order, name='create_order'),
    path('list', views.get_user_orders, name='get_user_orders'),
    path('export-sales-report', views.export_sales_report, name='export_sales_report'),
    path('<int:order_id>', views.get_order, name='get_order'),
    path('user/<int:user_id>', views.get_orders_by_user, name='get_orders_by_user'),
    path('<int:order_id>/status', views.update_order_status, name='update_order_status'),
]


