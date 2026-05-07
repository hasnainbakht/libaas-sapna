from typing import List
from accounts.models import User
from products.models import Product
from .models import Recommendation
from cart.models import Cart
from orders.models import Order, OrderItem
from reviews.models import Review


def generate_recommendations(user: User, limit: int = 10) -> List[Product]:
    """Generate product recommendations for a user"""
    recommendations = []

    # Get user's order history
    user_orders = Order.objects.filter(customer=user)
    ordered_products = OrderItem.objects.filter(order__in=user_orders).values_list('product_id', flat=True)

    # Get user's cart items
    cart_items = Cart.objects.filter(user=user)
    cart_product_ids = cart_items.values_list('product_id', flat=True)

    # Get user's reviewed products
    reviewed_products = Review.objects.filter(customer=user).values_list('product_id', flat=True)

    # Strategy 1: Based on category and gender of purchased items
    if ordered_products:
        purchased_products = Product.objects.filter(product_id__in=ordered_products)
        if purchased_products.exists():
            # Get most common category and gender
            from django.db.models import Count
            category_counts = purchased_products.values('category').annotate(count=Count('category')).order_by('-count')
            gender_counts = purchased_products.values('gender').annotate(count=Count('gender')).order_by('-count')

            if category_counts and gender_counts:
                top_category = category_counts[0]['category']
                top_gender = gender_counts[0]['gender']

                # Recommend similar products
                similar = Product.objects.filter(
                    category=top_category,
                    gender=top_gender,
                    is_active=True
                ).exclude(product_id__in=ordered_products).exclude(product_id__in=cart_product_ids)[:limit]

                recommendations.extend(list(similar))

    # Strategy 2: Trending products
    try:
        from analytics.services import get_trending_product_ids
        trending_ids = get_trending_product_ids(days=7)
        trending = Product.objects.filter(
            product_id__in=trending_ids,
            is_active=True
        ).exclude(product_id__in=ordered_products).exclude(product_id__in=cart_product_ids)[:limit//2]

        recommendations.extend(list(trending))
    except:
        pass

    # Strategy 3: High-rated products
    high_rated = Product.objects.filter(
        is_active=True,
        reviews__rating__gte=4
    ).exclude(product_id__in=ordered_products).exclude(product_id__in=cart_product_ids).distinct()[:limit//2]

    recommendations.extend(list(high_rated))

    # Remove duplicates and limit
    seen = set()
    unique_recommendations = []
    for product in recommendations:
        if product.product_id not in seen:
            seen.add(product.product_id)
            unique_recommendations.append(product)
            if len(unique_recommendations) >= limit:
                break

    # Save recommendations
    for idx, product in enumerate(unique_recommendations):
        score = 1.0 - (idx * 0.1)  # Decreasing score
        Recommendation.objects.update_or_create(
            customer=user,
            product=product,
            defaults={'score': score}
        )

    return unique_recommendations


