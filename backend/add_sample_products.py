import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from products.models import Product, ProductImage, ProductSize

# Sample products with real clothing images from Unsplash
sample_products = [
    {
        'sku': 'KURTA-001',
        'name': 'Embroidered White Kurta',
        'name_urdu': 'کڑھائی والا سفید کرتا',
        'description': 'Beautiful hand-embroidered white kurta with intricate designs. Perfect for special occasions.',
        'category': 'stitched',
        'subcategory': 'kurta',
        'gender': 'female',
        'fabric': 'Cotton',
        'color': 'White',
        'price': 3500.00,
        'discount': 10,
        'stock_qty': 25,
        'low_stock_threshold': 5,
        'images': [
            'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',
            'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800',
        ],
        'sizes': [
            {'size': 'S', 'stock_qty': 5},
            {'size': 'M', 'stock_qty': 10},
            {'size': 'L', 'stock_qty': 8},
            {'size': 'XL', 'stock_qty': 2},
        ]
    },
    {
        'sku': 'SHALWAR-001',
        'name': 'Traditional Shalwar Kameez Set',
        'name_urdu': 'روایتی شلوار قمیض سیٹ',
        'description': 'Elegant traditional shalwar kameez set in vibrant colors. Comfortable and stylish.',
        'category': 'stitched',
        'subcategory': 'shalwar_kameez',
        'gender': 'female',
        'fabric': 'Lawn',
        'color': 'Blue',
        'price': 4500.00,
        'discount': 15,
        'stock_qty': 30,
        'low_stock_threshold': 5,
        'images': [
            'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800',
            'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',
        ],
        'sizes': [
            {'size': 'S', 'stock_qty': 8},
            {'size': 'M', 'stock_qty': 12},
            {'size': 'L', 'stock_qty': 7},
            {'size': 'XL', 'stock_qty': 3},
        ]
    },
    {
        'sku': 'DUPATTA-001',
        'name': 'Silk Embroidered Dupatta',
        'name_urdu': 'ریشمی کڑھائی والا دوپٹہ',
        'description': 'Luxurious silk dupatta with beautiful embroidery work. Perfect accessory for any outfit.',
        'category': 'dupatta',
        'subcategory': 'silk_dupatta',
        'gender': 'female',
        'fabric': 'Silk',
        'color': 'Pink',
        'price': 2500.00,
        'discount': 5,
        'stock_qty': 40,
        'low_stock_threshold': 10,
        'images': [
            'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',
        ],
        'sizes': [
            {'size': 'One Size', 'stock_qty': 40},
        ]
    },
    {
        'sku': 'KURTA-002',
        'name': 'Casual Cotton Kurta',
        'name_urdu': 'عام کاٹن کرتا',
        'description': 'Comfortable everyday wear cotton kurta. Perfect for daily use.',
        'category': 'unstitched',
        'subcategory': 'kurta',
        'gender': 'male',
        'fabric': 'Cotton',
        'color': 'Beige',
        'price': 2000.00,
        'discount': 0,
        'stock_qty': 50,
        'low_stock_threshold': 10,
        'images': [
            'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800',
        ],
        'sizes': [
            {'size': 'S', 'stock_qty': 10},
            {'size': 'M', 'stock_qty': 15},
            {'size': 'L', 'stock_qty': 15},
            {'size': 'XL', 'stock_qty': 10},
        ]
    },
    {
        'sku': 'DRESS-001',
        'name': 'Elegant Party Dress',
        'name_urdu': 'خوبصورت پارٹی ڈریس',
        'description': 'Stunning party dress with sequin work. Make a statement at any event.',
        'category': 'stitched',
        'subcategory': 'dress',
        'gender': 'female',
        'fabric': 'Chiffon',
        'color': 'Maroon',
        'price': 5500.00,
        'discount': 20,
        'stock_qty': 15,
        'low_stock_threshold': 3,
        'images': [
            'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',
            'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800',
        ],
        'sizes': [
            {'size': 'S', 'stock_qty': 3},
            {'size': 'M', 'stock_qty': 5},
            {'size': 'L', 'stock_qty': 4},
            {'size': 'XL', 'stock_qty': 3},
        ]
    },
    {
        'sku': 'KURTA-003',
        'name': 'Designer Printed Kurta',
        'name_urdu': 'ڈیزائنر پرنٹڈ کرتا',
        'description': 'Trendy printed kurta with modern designs. Great for casual outings.',
        'category': 'stitched',
        'subcategory': 'kurta',
        'gender': 'unisex',
        'fabric': 'Viscose',
        'color': 'Green',
        'price': 2800.00,
        'discount': 12,
        'stock_qty': 35,
        'low_stock_threshold': 7,
        'images': [
            'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800',
        ],
        'sizes': [
            {'size': 'S', 'stock_qty': 8},
            {'size': 'M', 'stock_qty': 12},
            {'size': 'L', 'stock_qty': 10},
            {'size': 'XL', 'stock_qty': 5},
        ]
    },
    {
        'sku': 'ACCESSORY-001',
        'name': 'Traditional Handbag',
        'name_urdu': 'روایتی ہینڈ بیگ',
        'description': 'Beautiful traditional handbag with embroidery. Perfect accessory.',
        'category': 'accessories',
        'subcategory': 'handbag',
        'gender': 'female',
        'fabric': 'Leather',
        'color': 'Brown',
        'price': 1800.00,
        'discount': 8,
        'stock_qty': 20,
        'low_stock_threshold': 5,
        'images': [
            'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',
        ],
        'sizes': [
            {'size': 'One Size', 'stock_qty': 20},
        ]
    },
    {
        'sku': 'KURTA-004',
        'name': 'Luxury Silk Kurta',
        'name_urdu': 'لگژری ریشمی کرتا',
        'description': 'Premium silk kurta with gold thread work. Perfect for weddings.',
        'category': 'stitched',
        'subcategory': 'kurta',
        'gender': 'female',
        'fabric': 'Silk',
        'color': 'Gold',
        'price': 8500.00,
        'discount': 25,
        'stock_qty': 12,
        'low_stock_threshold': 3,
        'images': [
            'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',
            'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800',
        ],
        'sizes': [
            {'size': 'S', 'stock_qty': 2},
            {'size': 'M', 'stock_qty': 4},
            {'size': 'L', 'stock_qty': 4},
            {'size': 'XL', 'stock_qty': 2},
        ]
    },
    {
        'sku': 'SHALWAR-002',
        'name': 'Summer Lawn Shalwar',
        'name_urdu': 'سمر لان شلوار',
        'description': 'Light and comfortable lawn shalwar perfect for summer.',
        'category': 'unstitched',
        'subcategory': 'shalwar',
        'gender': 'female',
        'fabric': 'Lawn',
        'color': 'Yellow',
        'price': 2200.00,
        'discount': 10,
        'stock_qty': 45,
        'low_stock_threshold': 8,
        'images': [
            'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800',
        ],
        'sizes': [
            {'size': 'S', 'stock_qty': 10},
            {'size': 'M', 'stock_qty': 15},
            {'size': 'L', 'stock_qty': 12},
            {'size': 'XL', 'stock_qty': 8},
        ]
    },
    {
        'sku': 'KURTA-005',
        'name': 'Casual Linen Kurta',
        'name_urdu': 'عام لینن کرتا',
        'description': 'Comfortable linen kurta for everyday wear.',
        'category': 'stitched',
        'subcategory': 'kurta',
        'gender': 'male',
        'fabric': 'Linen',
        'color': 'Navy',
        'price': 3200.00,
        'discount': 15,
        'stock_qty': 28,
        'low_stock_threshold': 6,
        'images': [
            'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800',
        ],
        'sizes': [
            {'size': 'S', 'stock_qty': 5},
            {'size': 'M', 'stock_qty': 10},
            {'size': 'L', 'stock_qty': 8},
            {'size': 'XL', 'stock_qty': 5},
        ]
    },
]

def add_products():
    """Add sample products to database"""
    added = 0
    for product_data in sample_products:
        images_data = product_data.pop('images', [])
        sizes_data = product_data.pop('sizes', [])
        
        # Check if product already exists
        if Product.objects.filter(sku=product_data['sku']).exists():
            print(f"Product {product_data['sku']} already exists, skipping...")
            continue
        
        # Create product
        product = Product.objects.create(**product_data)
        
        # Add images
        for idx, image_url in enumerate(images_data):
            ProductImage.objects.create(
                product=product,
                image_url=image_url,
                is_primary=(idx == 0),
                display_order=idx
            )
        
        # Add sizes
        for size_data in sizes_data:
            ProductSize.objects.create(
                product=product,
                **size_data
            )
        
        added += 1
        print(f"Added product: {product.name} (SKU: {product.sku})")
    
    print(f"\nSuccessfully added {added} products!")

if __name__ == '__main__':
    add_products()


