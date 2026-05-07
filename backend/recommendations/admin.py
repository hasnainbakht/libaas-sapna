from django.contrib import admin
from .models import Recommendation


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ('customer', 'product', 'score', 'generated_at')
    list_filter = ('generated_at',)
    search_fields = ('customer__email', 'product__name')


