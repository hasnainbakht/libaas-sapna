import os
import sys
import shutil
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Use hardcoded absolute path instead of __file__
BASE_DIR = r'C:\Users\Muneeb\Desktop\LIBAASSAPNA\backend'
INVENTORY_DIR = os.path.join(BASE_DIR, 'temp_inventory', 'fyp website dummy pic')
MEDIA_DIR = os.path.join(BASE_DIR, 'media', 'products')

os.makedirs(MEDIA_DIR, exist_ok=True)

from products.models import Product, ProductImage, ProductSize
from orders.models import Order, OrderItem

def copy_image(src_path, dest_name):
    dest_path = os.path.join(MEDIA_DIR, dest_name)
    shutil.copy2(src_path, dest_path)
    return f'products/{dest_name}'

def get_image_files(folder_path):
    extensions = ('.png', '.jpg', '.jpeg', '.webp')
    files = []
    if os.path.exists(folder_path):
        for f in sorted(os.listdir(folder_path)):
            if f.lower().endswith(extensions):
                files.append(os.path.join(folder_path, f))
    return files

def create_product(name, category, gender, fabric, color, price, description,
                   images_folder, sku_prefix, index, subcategory='', stock_qty=25,
                   sizes=None):
    sku = f'{sku_prefix}-{index:03d}'
    product = Product.objects.create(
        sku=sku, name=name, description=description,
        category=category, subcategory=subcategory, gender=gender,
        fabric=fabric, color=color, price=price, discount=0,
        stock_qty=stock_qty, low_stock_threshold=5, is_active=True,
    )
    image_files = get_image_files(images_folder)
    for i, img_path in enumerate(image_files):
        ext = os.path.splitext(img_path)[1]
        dest_name = f'{sku_prefix}_{index}_{i+1}{ext}'
        relative_path = copy_image(img_path, dest_name)
        ProductImage.objects.create(
            product=product, image=relative_path,
            is_primary=(i == 0), display_order=i,
        )
    if sizes:
        for size in sizes:
            ProductSize.objects.create(
                product=product, size=size,
                stock_qty=stock_qty // len(sizes),
            )
    print(f'  Created: {name} (PKR {price}) - {len(image_files)} images')
    return product

# ============================================================
# Step 1: Delete ALL existing data that references products
# ============================================================
print('\n=== Deleting old data ===')
oi_count = OrderItem.objects.count()
OrderItem.objects.all().delete()
print(f'  Deleted {oi_count} order items')

o_count = Order.objects.count()
Order.objects.all().delete()
print(f'  Deleted {o_count} orders')

old_count = Product.objects.count()
Product.objects.all().delete()
print(f'  Deleted {old_count} old products')

# ============================================================
# Step 2: DUPATTAS (800 - 1600)
# ============================================================
print('\n=== Adding Dupatta Products ===')
dupattas_dir = os.path.join(INVENTORY_DIR, 'dupattas')
dupatta_products = [
    {'folder': '1', 'name': 'Teal Chiffon Dupatta', 'color': 'Teal', 'fabric': 'Chiffon', 'price': 950,
     'desc': 'Elegant teal chiffon dupatta with a soft drape and lightweight feel. Perfect for pairing with both casual and formal outfits.'},
    {'folder': '2', 'name': 'Spectra Yellow Silk Dupatta', 'color': 'Spectra Yellow', 'fabric': 'Silk', 'price': 1200,
     'desc': 'Vibrant spectra yellow silk dupatta that adds a pop of color to any ensemble. Luxuriously soft with a subtle sheen.'},
    {'folder': '3', 'name': 'Burnt Orange Cotton Dupatta', 'color': 'Burnt Orange', 'fabric': 'Cotton', 'price': 850,
     'desc': 'Rich burnt orange cotton dupatta ideal for everyday wear. Breathable and comfortable with a beautiful color tone.'},
    {'folder': '4', 'name': 'Mauve Pink Chiffon Dupatta', 'color': 'Mauve Pink', 'fabric': 'Chiffon', 'price': 1100,
     'desc': 'Delicate mauve pink chiffon dupatta with a graceful flow. Perfect for adding a feminine touch to your outfit.'},
    {'folder': '5', 'name': 'Black Organza Dupatta', 'color': 'Black', 'fabric': 'Organza', 'price': 1450,
     'desc': 'Classic black organza dupatta with a sophisticated look. Versatile enough for both formal and semi-formal occasions.'},
    {'folder': '6', 'name': 'Asmani Blue Embroidered Dupatta', 'color': 'Asmani Blue', 'fabric': 'Chiffon', 'price': 1600,
     'desc': 'Stunning asmani blue embroidered chiffon dupatta featuring intricate needlework. A statement accessory for special occasions.'},
]
for i, d in enumerate(dupatta_products, 1):
    folder_path = os.path.join(dupattas_dir, d['folder'])
    create_product(name=d['name'], category='dupatta', gender='female',
        fabric=d['fabric'], color=d['color'], price=d['price'],
        description=d['desc'], images_folder=folder_path, sku_prefix='DUP', index=i)

# ============================================================
# Step 3: READY TO WEAR / STITCHED FEMALE (3000 - 5000)
# ============================================================
print('\n=== Adding Ready to Wear (Stitched Female) Products ===')
rtw_dir = os.path.join(INVENTORY_DIR, 'ready to wear')
rtw_products = [
    {'folder': '1', 'name': 'Solid Crosshatch Shirt - Yellow', 'color': 'Yellow', 'fabric': 'Cross Hatch', 'price': 3200, 'sub': 'Straight Shirt',
     'desc': 'Solid crosshatch straight shirt in vibrant yellow. A versatile wardrobe essential with a modern fit.'},
    {'folder': '2', 'name': 'Solid Crosshatch Shirt - Maroon', 'color': 'Maroon', 'fabric': 'Cross Hatch', 'price': 3400, 'sub': 'Straight Shirt',
     'desc': 'Solid crosshatch straight shirt in deep maroon. Perfect for both casual and semi-formal styling.'},
    {'folder': '3', 'name': 'Solid Crosshatch Drop Shoulder - Pink', 'color': 'Pink', 'fabric': 'Cross Hatch', 'price': 3500, 'sub': 'Drop Shoulder',
     'desc': 'Solid crosshatch drop shoulder shirt in soft pink. A contemporary silhouette with relaxed elegance.'},
    {'folder': '4', 'name': 'Solid Crosshatch Drop Shoulder - Dark Blue', 'color': 'Dark Blue', 'fabric': 'Cross Hatch', 'price': 3600, 'sub': 'Drop Shoulder',
     'desc': 'Solid crosshatch drop shoulder shirt in rich dark blue. Effortlessly chic with a relaxed fit.'},
    {'folder': '5', 'name': 'Printed Cotton Satin Shirt - Brown', 'color': 'Brown', 'fabric': 'Cotton Satin', 'price': 4200, 'sub': 'Straight Shirt',
     'desc': 'Printed cotton satin straight shirt in warm brown. Features a luxurious satin finish with elegant print detailing.'},
    {'folder': '6', 'name': 'Printed Lawn Shirt - Coral', 'color': 'Coral', 'fabric': 'Lawn', 'price': 3800, 'sub': 'Straight Shirt',
     'desc': 'Printed lawn straight shirt in coral. Lightweight and breathable with beautiful print patterns.'},
    {'folder': '7', 'name': 'Printed Lawn Shirt - Pink', 'color': 'Pink', 'fabric': 'Lawn', 'price': 3900, 'sub': 'Straight Shirt',
     'desc': 'Printed lawn straight shirt in pink. Fresh and vibrant with charming print details.'},
    {'folder': '8', 'name': 'Solid Crosshatch Shirt - Purple', 'color': 'Purple', 'fabric': 'Cross Hatch', 'price': 3300, 'sub': 'Straight Shirt',
     'desc': 'Solid crosshatch straight shirt in regal purple. A bold color choice for the fashion-forward.'},
    {'folder': '9', 'name': 'Solid Crosshatch Shirt - Navy Blue', 'color': 'Dark Blue', 'fabric': 'Cross Hatch', 'price': 3200, 'sub': 'Straight Shirt',
     'desc': 'Solid crosshatch straight shirt in classic navy blue. A timeless piece for any occasion.'},
    {'folder': '10', 'name': 'Printed Lawn Shirt - Green', 'color': 'Green', 'fabric': 'Lawn', 'price': 3800, 'sub': 'Straight Shirt',
     'desc': 'Printed lawn straight shirt in refreshing green. Perfect for a breezy summer look.'},
    {'folder': '11', 'name': 'Solid Lawn Shirt - Mustard Yellow', 'color': 'Mustard Yellow', 'fabric': 'Lawn', 'price': 3600, 'sub': 'Straight Shirt',
     'desc': 'Solid lawn straight shirt in warm mustard yellow. A rich and sophisticated color for seasonal styling.'},
    {'folder': '12', 'name': 'Printed Lawn Shirt - Lime Yellow', 'color': 'Lime Yellow', 'fabric': 'Lawn', 'price': 4000, 'sub': 'Straight Shirt',
     'desc': 'Printed lawn straight shirt in bold lime yellow. A fresh and modern addition to your wardrobe.'},
]
sizes_female = ['XS', 'S', 'M', 'L', 'XL']
for i, p in enumerate(rtw_products, 1):
    folder_path = os.path.join(rtw_dir, p['folder'])
    create_product(name=p['name'], category='stitched', gender='female',
        fabric=p['fabric'], color=p['color'], price=p['price'],
        description=p['desc'], images_folder=folder_path,
        sku_prefix='RTW', index=i, subcategory=p.get('sub', ''), sizes=sizes_female)

# ============================================================
# Step 4: STITCH MEN (3000 - 5000)
# ============================================================
print('\n=== Adding Stitched Men Products ===')
men_dir = os.path.join(INVENTORY_DIR, 'stitch Men')
men_products = [
    {'folder': '1', 'name': 'Classic Shalwar Kameez - White', 'color': 'White', 'fabric': 'Cotton', 'price': 4500,
     'desc': 'Premium white cotton shalwar kameez with a classic cut. A wardrobe staple for everyday wear and formal occasions.'},
    {'folder': '2', 'name': 'Classic Shalwar Kameez - Off White', 'color': 'Off White', 'fabric': 'Cotton', 'price': 4500,
     'desc': 'Elegant off-white cotton shalwar kameez with refined tailoring. Perfect for both casual and formal settings.'},
    {'folder': '3', 'name': 'Classic Shalwar Kameez - Light Grey', 'color': 'Light Grey', 'fabric': 'Cotton Blend', 'price': 4800,
     'desc': 'Sophisticated light grey cotton blend shalwar kameez. A modern take on traditional menswear with premium finishing.'},
    {'folder': '4', 'name': 'Classic Shalwar Kameez - Beige', 'color': 'Beige', 'fabric': 'Wash & Wear', 'price': 5000,
     'desc': 'Premium beige wash & wear shalwar kameez with impeccable tailoring. Low maintenance fabric with a polished look.'},
]
sizes_male = ['S', 'M', 'L', 'XL', 'XXL']
for i, p in enumerate(men_products, 1):
    folder_path = os.path.join(men_dir, p['folder'])
    create_product(name=p['name'], category='stitched', gender='male',
        fabric=p['fabric'], color=p['color'], price=p['price'],
        description=p['desc'], images_folder=folder_path,
        sku_prefix='MEN', index=i, subcategory='Shalwar Kameez', sizes=sizes_male)

# ============================================================
# Step 5: UNSTITCHED CLOTH (3000 - 5000)
# ============================================================
print('\n=== Adding Unstitched Cloth Products ===')
unstitch_dir = os.path.join(INVENTORY_DIR, 'unstitch cloth')
unstitch_products = [
    {'folder': '1', 'name': '3 Piece Embroidered Lawn Suit - Sage Green', 'color': 'Sage Green', 'fabric': 'Lawn', 'price': 4200,
     'desc': 'Make a statement with our three-piece embroidered sage green ensemble featuring a lawn shirt paired with a voile dupatta and cotton trousers.'},
    {'folder': '2', 'name': '3 Piece Embroidered Lawn Suit - Blue', 'color': 'Blue', 'fabric': 'Lawn', 'price': 4500,
     'desc': 'Make a statement with our three-piece embroidered blue ensemble featuring a lawn shirt paired with a voile dupatta and cotton trousers.'},
    {'folder': '3', 'name': '2 Piece Embroidered Lawn Suit - Teal Blue', 'color': 'Teal Blue', 'fabric': 'Lawn', 'price': 3200,
     'desc': 'Make a statement with our two-piece embroidered teal blue and off-white ensemble featuring a lawn shirt paired with a voile dupatta.'},
    {'folder': '4', 'name': '2 Piece Embroidered Lawn Suit - Light Yellow', 'color': 'Light Yellow', 'fabric': 'Lawn', 'price': 3000,
     'desc': 'Make a statement with our two-piece embroidered light yellow ensemble featuring a lawn shirt paired with a multicoloured voile dupatta.'},
    {'folder': '5', 'name': '3 Piece Embroidered Silk Suit - Black', 'color': 'Black', 'fabric': 'Blended Grip Silk', 'price': 5000,
     'desc': 'Make a statement with our three-piece embroidered black ensemble featuring a blended grip silk shirt paired with a blended tissue dupatta and viscose raw silk trousers.'},
    {'folder': '6', 'name': '3 Piece Embroidered Raw Silk Suit - Mustard', 'color': 'Mustard', 'fabric': 'Raw Silk', 'price': 4800,
     'desc': 'Make a statement with our three-piece embroidered mustard ensemble featuring a raw silk shirt paired with viscose raw silk trousers and a blended chiffon dupatta.'},
    {'folder': '7', 'name': '3 Piece Embroidered Lawn Suit - Pistachio', 'color': 'Light Pistachio', 'fabric': 'Lawn', 'price': 4200,
     'desc': 'Perfect your style with our three-piece embroidered light pistachio ensemble featuring a lawn shirt paired with cotton trousers and a blended karandi dupatta.'},
    {'folder': '8', 'name': '3 Piece Embroidered Lawn Suit - Mustard', 'color': 'Mustard', 'fabric': 'Lawn', 'price': 4000,
     'desc': 'Make a statement with our three-piece embroidered mustard ensemble featuring a lawn shirt paired with a voile dupatta and cotton trousers.'},
    {'folder': '9', 'name': '3 Piece Embroidered Raw Silk Suit - Brown', 'color': 'Brown', 'fabric': 'Viscose Raw Silk', 'price': 4900,
     'desc': 'Make a sophisticated statement with our three-piece embroidered brown ensemble featuring a viscose raw silk shirt and trousers paired with a blended net dupatta.'},
    {'folder': '10', 'name': '3 Piece Embroidered Dobby Suit - Purple', 'color': 'Purple', 'fabric': 'Dobby', 'price': 4500,
     'desc': 'Make a statement with our three-piece embroidered purple ensemble featuring a dobby shirt paired with a blended organza dupatta and cotton trousers.'},
    {'folder': '11', 'name': '3 Piece Printed Lawn Suit - Purple & White', 'color': 'Purple', 'fabric': 'Lawn', 'price': 3500,
     'desc': 'Make a statement with our three-piece printed purple and off white ensemble featuring a lawn shirt paired with a voile dupatta and cotton trousers.'},
    {'folder': '12', 'name': '3 Piece Embroidered Lawn Suit - Light Sage', 'color': 'Light Sage Green', 'fabric': 'Lawn', 'price': 4200,
     'desc': 'Make a statement with our three-piece embroidered light sage green ensemble featuring a lawn shirt paired with a voile dupatta and cotton trousers.'},
    {'folder': '13', 'name': 'Printed Lawn 3 Piece Suit - Floral', 'color': 'Multi', 'fabric': 'Lawn', 'price': 3800,
     'desc': 'Elegant printed lawn 3-piece suit featuring a printed lawn dupatta, printed lawn shirt, and dyed trouser. A beautiful floral ensemble.'},
    {'folder': '14', 'name': 'Printed Khaddar 3 Piece Suit - Classic', 'color': 'Multi', 'fabric': 'Khaddar', 'price': 4600,
     'desc': 'Premium printed khaddar 3-piece suit with a printed khaddar dupatta, printed khaddar shirt, and dyed trouser. Warm and stylish.'},
    {'folder': '15', 'name': 'Jacquard 3 Piece Suit - Elegant', 'color': 'Multi', 'fabric': 'Jacquard', 'price': 5000,
     'desc': 'Luxurious jacquard 3-piece suit featuring a jacquard dupatta, jacquard shirt, and dyed trouser. Premium fabric with intricate weaving.'},
]
for i, p in enumerate(unstitch_products, 1):
    folder_path = os.path.join(unstitch_dir, p['folder'])
    create_product(name=p['name'], category='unstitched', gender='female',
        fabric=p['fabric'], color=p['color'], price=p['price'],
        description=p['desc'], images_folder=folder_path, sku_prefix='UNS', index=i)

# ============================================================
# Step 6: ABAYAS as ACCESSORIES (2500 - 6000)
# ============================================================
print('\n=== Adding Abaya/Hijab Products (Accessories) ===')
abayas_dir = os.path.join(INVENTORY_DIR, 'abayas')
abaya_products = [
    {'folder': '1', 'name': 'Basic Chiffon Hijab - Chocolate Brown', 'color': 'Chocolate Brown', 'fabric': 'Chiffon', 'price': 2500,
     'desc': 'Basic hijab in soft and breathable chiffon fabric. Perfect for everyday wear with a comfortable drape.'},
    {'folder': '2', 'name': 'Basic Chiffon Hijab - Light Blue', 'color': 'Light Blue', 'fabric': 'Chiffon', 'price': 2500,
     'desc': 'Basic hijab in soft and breathable chiffon fabric. A serene light blue for everyday elegance.'},
    {'folder': '3', 'name': 'Basic Chiffon Hijab - Brown', 'color': 'Brown', 'fabric': 'Chiffon', 'price': 2700,
     'desc': 'Basic hijab in soft and breathable chiffon fabric. Warm brown tone for a classic look.'},
    {'folder': '4', 'name': 'Premium Chiffon Hijab - White', 'color': 'White', 'fabric': 'Chiffon', 'price': 3000,
     'desc': 'Premium white chiffon hijab in soft and breathable fabric. Elegant and versatile for any occasion.'},
    {'folder': '5', 'name': 'Basic Chiffon Hijab - Navy', 'color': 'Navy', 'fabric': 'Chiffon', 'price': 2800,
     'desc': 'Basic hijab in soft and breathable chiffon fabric. Deep navy for a sophisticated look.'},
    {'folder': '6', 'name': 'Embroidered Abaya - Black', 'color': 'Black', 'fabric': 'Nida', 'price': 5500,
     'desc': 'Elegant black embroidered abaya in premium nida fabric. Features intricate embroidery detailing for a luxurious look.'},
    {'folder': '7', 'name': 'Classic Abaya - Dark Brown', 'color': 'Dark Brown', 'fabric': 'Nida', 'price': 4800,
     'desc': 'Classic dark brown abaya in flowing nida fabric. A timeless design with refined finishing.'},
    {'folder': '8', 'name': 'Designer Abaya - Maroon', 'color': 'Maroon', 'fabric': 'Crepe', 'price': 6000,
     'desc': 'Designer maroon abaya in luxurious crepe fabric. A statement piece with contemporary design elements.'},
    {'folder': '9', 'name': 'Everyday Abaya - Grey', 'color': 'Grey', 'fabric': 'Nida', 'price': 4200,
     'desc': 'Comfortable grey everyday abaya in lightweight nida fabric. Perfect for daily wear with a modern silhouette.'},
    {'folder': '10', 'name': 'Casual Abaya - Olive', 'color': 'Olive', 'fabric': 'Nida', 'price': 3800,
     'desc': 'Stylish olive casual abaya in premium nida fabric. A versatile piece with a relaxed fit.'},
]
for i, p in enumerate(abaya_products, 1):
    folder_path = os.path.join(abayas_dir, p['folder'])
    create_product(name=p['name'], category='accessories', gender='female',
        fabric=p['fabric'], color=p['color'], price=p['price'],
        description=p['desc'], images_folder=folder_path,
        sku_prefix='ABY', index=i, subcategory='Abaya & Hijab')

# ============================================================
# Summary
# ============================================================
total = Product.objects.count()
print(f'\n=== DONE! ===')
print(f'Total products added: {total}')
print(f'  - Dupattas: {Product.objects.filter(category="dupatta").count()}')
print(f'  - Stitched (Female): {Product.objects.filter(category="stitched", gender="female").count()}')
print(f'  - Stitched (Male): {Product.objects.filter(category="stitched", gender="male").count()}')
print(f'  - Unstitched: {Product.objects.filter(category="unstitched").count()}')
print(f'  - Accessories (Abayas/Hijabs): {Product.objects.filter(category="accessories").count()}')
print(f'Total images: {ProductImage.objects.count()}')
