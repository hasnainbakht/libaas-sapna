from django.db import models
from accounts.models import User
from products.models import Product


class Review(models.Model):
    review_id = models.AutoField(primary_key=True)
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField()
    comment = models.TextField(blank=True)
    review_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reviews'
        unique_together = ['customer', 'product']
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['customer']),
        ]

    def __str__(self):
        return f"{self.customer.email} - {self.product.name} - {self.rating} stars"


class ReviewImage(models.Model):
    id = models.AutoField(primary_key=True)
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='reviews/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'review_images'

    def __str__(self):
        return f"Image for review #{self.review.review_id}"
