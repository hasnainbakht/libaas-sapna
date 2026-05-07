from django.db import models
from accounts.models import User
from products.models import Product


class Recommendation(models.Model):
    recommendation_id = models.AutoField(primary_key=True)
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recommendations')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'recommendations'
        indexes = [
            models.Index(fields=['customer']),
            models.Index(fields=['score']),
        ]

    def __str__(self):
        return f"{self.customer.email} - {self.product.name} ({self.score})"


