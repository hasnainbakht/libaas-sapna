# from products.models import Product
# from .models import StockAlert
# from django.db.models import Sum
# from django.utils import timezone
# from datetime import timedelta


# def create_stock_alert(product: Product, alert_type: str):
#     """Create stock alert and notify admin"""
#     messages = {
#         'low': f"Low stock alert: {product.name} has only {product.stock_qty} items left.",
#         'out': f"Out of stock: {product.name} is out of stock!",
#         'low-high-demand': f"Urgent: {product.name} is low on stock and selling fast!"
#     }

#     message = messages.get(alert_type, "Stock alert")

#     # Create alert
#     alert = StockAlert.objects.create(
#         product=product,
#         alert_type=alert_type,
#         message=message
#     )

#     return alert


# def is_fast_selling(product: Product) -> bool:
#     """Determine if product is selling fast"""
#     from analytics.models import SalesAnalytics

#     # Check sales in last 7 days
#     start_date = timezone.now().date() - timedelta(days=7)

#     recent_sales = SalesAnalytics.objects.filter(
#         product=product,
#         sale_date__gte=start_date
#     ).aggregate(total=Sum('quantity_sold'))

#     total_sold = recent_sales['total'] or 0

#     # Consider fast-selling if average daily sales > 3
#     avg_daily_sales = total_sold / 7

#     return avg_daily_sales > 3


from products.models import Product
from .models import StockAlert
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
import requests
import urllib.parse
from django.conf import settings
# EMAIL
from django.core.mail import send_mail
from django.conf import settings

# WHATSAPP (Twilio)
from twilio.rest import Client


def create_stock_alert(product: Product, alert_type: str, size: str = None, admin_email=None, admin_phone=None):
    """Create stock alert + send notifications (Per-size aware)"""
    size_info = f" (Size: {size})" if size else ""
    stock_val = product.stock_qty
    
    # If size provided, get that size's stock
    if size:
        from products.models import ProductSize
        try:
            ps = ProductSize.objects.get(product=product, size=size)
            stock_val = ps.stock_qty
        except:
            pass

    messages = {
        'low': f"⚠ Low stock alert: {product.name}{size_info} has only {stock_val} items left.",
        'out': f"🚨 Out of stock: {product.name}{size_info} is out of stock!",
        'low-high-demand': f"🔥 Urgent: {product.name}{size_info} is low on stock and selling fast!"
    }

    message = messages.get(alert_type, f"Stock alert for {product.name}{size_info}")

    # 1. Save DB alert
    alert = StockAlert.objects.create(
        product=product,
        size=size,
        alert_type=alert_type,
        message=message
    )

    # 2. SEND EMAIL (ADMIN)
    send_email_alert(product, message, admin_email)

    # 3. SEND WHATSAPP
    send_whatsapp_alert(product, message, admin_phone)

    return alert


# EMAIL FUNCTION
def send_email_alert(product, message, admin_email=None):
    try:
        subject = f"⚠ Stock Alert - {product.name}"
        recipient = admin_email or getattr(settings, 'DEFAULT_FROM_EMAIL', "muhammadmesum738@gmail.com")

        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            [recipient],
            fail_silently=False,
        )
    except Exception as e:
        print("Email alert failed:", e)


from .whatsapp_services import send_whatsapp_message

# WHATSAPP FUNCTION
def send_whatsapp_alert(product, message, admin_phone=None):
    """Send admin stock alert via Meta WhatsApp (Session Message)"""
    try:
        phone = admin_phone or getattr(settings, 'ADMIN_WHATSAPP_NUMBER', '')

        if not phone:
            print(f"[WHATSAPP SIMULATION] Message:\n{message}")
            return

        # Use Meta WhatsApp instead of CallMeBot
        send_whatsapp_message(phone, message)
            
    except Exception as e:
        print("WhatsApp alert failed:", e)


def is_fast_selling(product: Product) -> bool:
    """Determine if product is selling fast"""
    from analytics.models import SalesAnalytics

    start_date = timezone.now().date() - timedelta(days=7)

    recent_sales = SalesAnalytics.objects.filter(
        product=product,
        sale_date__gte=start_date
    ).aggregate(total=Sum('quantity_sold'))

    total_sold = recent_sales['total'] or 0

    avg_daily_sales = total_sold / 7

    return avg_daily_sales > 3