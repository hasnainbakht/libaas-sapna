import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from products.models import Product, ProductSize

# Find all Abayas and Hijabs (they use the ABY prefix)
abayas = Product.objects.filter(sku__startswith='ABY')
sizes_to_add = ['S', 'M', 'L']
count = 0

for abaya in abayas:
    # Clear existing sizes
    ProductSize.objects.filter(product=abaya).delete()
    
    total_stock = 0
    for size in sizes_to_add:
        ProductSize.objects.create(product=abaya, size=size, stock_qty=10)
        total_stock += 10
    
    # Update product totals
    abaya.stock_qty = total_stock
    # "3 threshhold for each" size -> total 9
    abaya.low_stock_threshold = len(sizes_to_add) * 3
    abaya.save()
    count += 1

print(f"Successfully updated {count} abayas/hijabs with sizes S, M, L.")
