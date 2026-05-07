from django.db import models
from products.models import Product


class StockAlert(models.Model):
    ALERT_TYPE_CHOICES = [
        ('low', 'Low Stock'),
        ('out', 'Out of Stock'),
        ('low-high-demand', 'Low Stock - High Demand'),
    ]

    alert_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    size = models.CharField(max_length=20, blank=True, null=True)
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPE_CHOICES)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stock_alerts'
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['is_read']),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.alert_type}"


