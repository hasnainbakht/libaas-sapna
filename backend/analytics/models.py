from django.db import models
from products.models import Product
from orders.models import Order


class SalesAnalytics(models.Model):
    analytics_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    quantity_sold = models.IntegerField()
    revenue = models.DecimalField(max_digits=10, decimal_places=2)
    sale_date = models.DateField()
    sale_timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sales_analytics'
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['sale_date']),
            models.Index(fields=['sale_timestamp']),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.quantity_sold} sold on {self.sale_date}"


