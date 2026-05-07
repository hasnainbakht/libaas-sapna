from django.contrib import admin
from .models import Product, ProductImage, ProductSize


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class ProductSizeInline(admin.TabularInline):
    model = ProductSize
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'category', 'gender', 'price', 'stock_qty', 'is_active', 'created_at')
    list_filter = ('category', 'gender', 'is_active', 'created_at')
    search_fields = ('name', 'sku', 'description')
    inlines = [ProductImageInline, ProductSizeInline]
    readonly_fields = ('created_at', 'updated_at')

