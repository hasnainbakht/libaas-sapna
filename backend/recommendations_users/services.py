"""
LIBAAS SAPNA - Recommendation Service (Fixed v2 + Debug Logging)
"""

import logging
from typing import List, Dict, Any
from collections import Counter
from django.db.models import Q
from django.apps import apps
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()

CATEGORY_MATCH_POINTS = 3
FABRIC_MATCH_POINTS = 2
GENDER_MATCH_POINTS = 3
DEFAULT_RECOMMENDATION_LIMIT = 12


def _normalize(value) -> str:
    if value is None:
        return ""
    if hasattr(value, "pk"):
        for attr in ("name", "title", "slug"):
            v = getattr(value, attr, None)
            if v:
                return str(v).strip().lower()
        return str(value.pk)
    return str(value).strip().lower()


def get_user_purchase_profile(user) -> Dict[str, Any]:
    OrderItem = apps.get_model("orders", "OrderItem")

    order_items = (
        OrderItem.objects
        .filter(order__customer=user)
        .select_related("order", "product")
    )

    order_item_list = list(order_items)

    # ── DEBUG 1: Did we find any OrderItems for this user? ───────────────────
    logger.debug(f"get_user_purchase_profile called for user={user}")

    categories: Counter = Counter()
    fabrics: Counter = Counter()
    genders: Counter = Counter()
    purchased_product_ids: set = set()

    for item in order_item_list:
        product = item.product

        if not product:
            continue

        purchased_product_ids.add(product.product_id)
        qty = item.quantity or 1

        cat = _normalize(product.category)
        fab = _normalize(product.fabric)
        gen = _normalize(product.gender)



        if cat:
            categories[cat] += qty
        if fab:
            fabrics[fab] += qty
        if gen:
            genders[gen] += qty



    return {
        "top_categories": categories.most_common(),
        "top_fabrics": fabrics.most_common(),
        "top_genders": genders.most_common(),
        "purchased_product_ids": purchased_product_ids,
        "has_history": len(purchased_product_ids) > 0,
    }


def _score_product(product, preferred_categories: set,
                   preferred_fabrics: set, preferred_genders: set) -> tuple:
    score = 0
    reasons = []

    cat = _normalize(product.category)
    fab = _normalize(product.fabric)
    gen = _normalize(product.gender)

    if cat and cat in preferred_categories:
        score += CATEGORY_MATCH_POINTS
        reasons.append("category")
    if fab and fab in preferred_fabrics:
        score += FABRIC_MATCH_POINTS
        reasons.append("fabric")
    if gen and gen in preferred_genders:
        score += GENDER_MATCH_POINTS
        reasons.append("gender")

    return score, reasons


def get_user_recommendations(
    user,
    limit: int = DEFAULT_RECOMMENDATION_LIMIT,
    include_purchased: bool = False
) -> List[Dict[str, Any]]:
    from .serializers import ProductListSerializer

    Product = apps.get_model("products", "Product")

    # ── 1. Profile ────────────────────────────────────────────────────────────
    profile = get_user_purchase_profile(user)

    preferred_categories = {c for c, _ in profile["top_categories"]}
    preferred_fabrics    = {f for f, _ in profile["top_fabrics"]}
    preferred_genders    = {g for g, _ in profile["top_genders"]}



    # ── 2. No history → fallback immediately ─────────────────────────────────
    if not profile["has_history"]:
        return _get_fallback_recommendations(limit)

    # ── 3. Candidate queryset ─────────────────────────────────────────────────
    total_active = Product.objects.filter(is_active=True).count()
    total_in_stock = Product.objects.filter(
        is_active=True
    ).filter(
        Q(stock_qty__isnull=True) | Q(stock_qty__gt=0)
    ).count()



    candidates = Product.objects.filter(
        is_active=True
    ).filter(
        Q(stock_qty__isnull=True) | Q(stock_qty__gt=0)
    )

    if profile["purchased_product_ids"] and not include_purchased:
        candidates = candidates.exclude(
            product_id__in=profile["purchased_product_ids"]
        )

    candidate_list = list(candidates)

    # ── DEBUG 4: Are we excluding EVERYTHING? ────────────────────────────────
    if not candidate_list:
        candidate_list = list(
            Product.objects.filter(is_active=True)
            .filter(Q(stock_qty__isnull=True) | Q(stock_qty__gt=0))
        )

    # ── 4. Score ──────────────────────────────────────────────────────────────
    scored = []
    for p in candidate_list:
        score, reasons = _score_product(
            p, preferred_categories, preferred_fabrics, preferred_genders
        )
        scored.append({"product": p, "score": score, "reasons": reasons})

    scored.sort(key=lambda x: -x["score"])

    personalized = [x for x in scored if x["score"] > 0]



    if not personalized:
        return _get_fallback_recommendations(limit)

    return [
        {
            **ProductListSerializer(x["product"]).data,
            "recommendation_score": x["score"],
            "match_reasons": x["reasons"],
        }
        for x in personalized[:limit]
    ]


def _get_fallback_recommendations(
    limit: int = DEFAULT_RECOMMENDATION_LIMIT,
) -> List[Dict[str, Any]]:
    from .serializers import ProductListSerializer

    Product = apps.get_model("products", "Product")

    fallback_qs = list(
        Product.objects.filter(is_active=True)
        .filter(Q(stock_qty__isnull=True) | Q(stock_qty__gt=0))
        .order_by("-product_id")[:limit]
    )



    return [
        {
            **ProductListSerializer(p).data,
            "recommendation_score": 1,
            "match_reasons": ["new_arrival"],
        }
        for p in fallback_qs
    ]


def get_recommendations_for_guest(
    limit: int = DEFAULT_RECOMMENDATION_LIMIT,
) -> List[Dict[str, Any]]:
    """Recommendations for unauthenticated users."""
    return _get_fallback_recommendations(limit)