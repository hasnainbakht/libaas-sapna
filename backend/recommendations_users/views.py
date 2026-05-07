"""
LIBAAS SAPNA - Recommendation Views
DRF API endpoints for personalized product recommendations.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from django.contrib.auth import get_user_model

from .services import get_user_recommendations, get_recommendations_for_guest
from .serializers import RecommendationResponseSerializer

User = get_user_model()


class RecommendationRateThrottle(UserRateThrottle):
    """Custom throttle for authenticated recommendation requests."""
    rate = "60/minute"


class GuestRecommendationRateThrottle(AnonRateThrottle):
    """Custom throttle for guest recommendation requests."""
    rate = "30/minute"


class RecommendationsAPIView(APIView):
    """
    GET /api/recommendations/

    Returns personalized product recommendations for the authenticated user.
    For guests, returns trending/new arrivals.

    Query Parameters:
        - limit (int): Number of recommendations to return (default: 12, max: 24)
        - include_purchased (bool): Whether to include already bought items (default: false)

    Response:
        {
            "count": 12,
            "results": [
                {
                    "id": 1,
                    "name": "Silk Kurti",
                    "category": "Kurtis",
                    "fabric": "Silk",
                    "gender": "Women",
                    "color": "Red",
                    "price": "1299.00",
                    "stock_qty": 15,
                    "is_active": true,
                    "image": "https://...",
                    "recommendation_score": 8,
                    "match_reasons": ["category", "fabric", "gender"]
                }
            ]
        }
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    throttle_classes = [RecommendationRateThrottle, GuestRecommendationRateThrottle]

    def get(self, request, *args, **kwargs):
        limit = self._parse_limit(request.query_params.get("limit", "12"))
        include_purchased = self._parse_bool(
            request.query_params.get("include_purchased", "false")
        )
    
        user = request.user
    
        if user.is_authenticated:
            recommendations = get_user_recommendations(
                user=user,
                limit=limit,
                include_purchased=include_purchased,
            )
        else:
            recommendations = get_recommendations_for_guest(limit=limit)
    
        return Response(
            data={
                "count": len(recommendations),
                "results": recommendations,
            },
            status=status.HTTP_200_OK,
        )
    @staticmethod
    def _parse_limit(value: str) -> int:
        """Safely parse and clamp limit parameter."""
        try:
            limit = int(value)
        except (ValueError, TypeError):
            limit = 12
        return max(1, min(limit, 24))  # Clamp between 1 and 24

    @staticmethod
    def _parse_bool(value: str) -> bool:
        """Safely parse boolean query parameter."""
        return value.lower() in ("true", "1", "yes", "on")
