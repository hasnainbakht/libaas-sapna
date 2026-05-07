from django.contrib import admin
from .models import Cart


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'quantity', 'size', 'added_at')
    list_filter = ('added_at',)
    search_fields = ('user__email', 'product__name')


