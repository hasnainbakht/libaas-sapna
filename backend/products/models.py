from django.db import models
from accounts.models import User


class Product(models.Model):
    CATEGORY_CHOICES = [
        ('stitched', 'Stitched'),
        ('unstitched', 'Unstitched'),
        ('dupatta', 'Dupatta'),
        ('accessories', 'Accessories'),
    ]

    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('unisex', 'Unisex'),
    ]

    product_id = models.AutoField(primary_key=True)
    sku = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    name_urdu = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    subcategory = models.CharField(max_length=50, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    fabric = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=50, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    stock_qty = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=10)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['gender']),
            models.Index(fields=['color']),
            models.Index(fields=['fabric']),
        ]

    def __str__(self):
        return self.name

    @property
    def is_low_stock(self):
        return self.stock_qty <= self.low_stock_threshold

    @property
    def final_price(self):
        if self.discount > 0:
            return self.price - (self.price * self.discount / 100)
        return self.price

    def update_total_stock(self):
        """Update product total stock based on the sum of all size stocks"""
        if self.sizes.exists():
            total_stock = self.sizes.aggregate(total=models.Sum('stock_qty'))['total'] or 0
            if self.stock_qty != total_stock:
                self.stock_qty = total_stock
                self.save(update_fields=['stock_qty'])
        return self.stock_qty


class ProductImage(models.Model):
    image_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(Product, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True)
    is_primary = models.BooleanField(default=False)
    display_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'product_images'
        ordering = ['display_order']

    def __str__(self):
        return f"{self.product.name} - Image {self.display_order}"

    @property
    def url(self):
        """Returns the image URL - either from uploaded file or external URL"""
        if self.image:
            return self.image.url
        return self.image_url



class ProductSize(models.Model):
    size_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(Product, related_name='sizes', on_delete=models.CASCADE)
    size = models.CharField(max_length=20)
    stock_qty = models.IntegerField(default=0)

    class Meta:
        db_table = 'product_sizes'
        unique_together = ['product', 'size']

    def __str__(self):
        return f"{self.product.name} - {self.size}"

    @property
    def is_low_stock(self):
        return 0 < self.stock_qty <= self.product.low_stock_threshold

    @property
    def is_out_of_stock(self):
        return self.stock_qty <= 0


class Wishlist(models.Model):
    """User's wishlist/favorites"""
    wishlist_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlists')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlisted_by')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'wishlists'
        unique_together = ['user', 'product']
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.user.email} - {self.product.name}"


# Signals to sync stock
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

@receiver(post_save, sender=ProductSize)
@receiver(post_delete, sender=ProductSize)
def sync_product_stock(sender, instance, **kwargs):
    """Sync total product stock when a size stock is updated or deleted"""
    instance.product.update_total_stock()


