from django.urls import path
from .views import RecommendationsAPIView

app_name = "recommendations"

urlpatterns = [
    path("", RecommendationsAPIView.as_view(), name="recommendations-list"),
]
