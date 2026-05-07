from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('order_item_id', 'subtotal')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'customer', 'total_amount', 'payment_status', 'order_status', 'order_date')
    list_filter = ('payment_status', 'order_status', 'payment_method', 'order_date')
    search_fields = ('order_id', 'customer__email', 'shipping_phone')
    inlines = [OrderItemInline]
    readonly_fields = ('order_id', 'order_date')


