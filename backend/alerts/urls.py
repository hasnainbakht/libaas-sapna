from django.urls import path
from . import views

urlpatterns = [
    path('', views.get_alerts, name='get_alerts'),
    path('<int:alert_id>/read', views.mark_alert_read, name='mark_alert_read'),
]


