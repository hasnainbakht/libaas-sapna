from django.contrib import admin
from .models import SalesAnalytics


@admin.register(SalesAnalytics)
class SalesAnalyticsAdmin(admin.ModelAdmin):
    list_display = ('product', 'order', 'quantity_sold', 'revenue', 'sale_date')
    list_filter = ('sale_date',)
    search_fields = ('product__name', 'order__order_id')


