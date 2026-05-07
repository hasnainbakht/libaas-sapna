from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('customer', 'product', 'rating', 'review_date')
    list_filter = ('rating', 'review_date')
    search_fields = ('customer__email', 'product__name', 'comment')


