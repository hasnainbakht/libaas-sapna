"""
Notification service for order confirmations and low stock alerts.
Sends email via Django SMTP and WhatsApp via WhatsApp Web URL API.
"""
import urllib.parse
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone


def send_order_notification_email(order, admin_email):
    """Send order placed notification to admin email"""
    try:
        items_text = ""
        for item in order.items.all():
            items_text += f"  - {item.product.name} x{item.quantity} @ Rs.{item.price}\n"

        local_date = timezone.localtime(order.order_date)
        subject = f"🛒 New Order #{order.order_id} - Rs.{order.total_amount}"
        message = (
            f"New order received!\n\n"
            f"Order ID: {order.order_id}\n"
            f"Customer: {order.customer.name} ({order.customer.email})\n"
            f"Total: Rs. {order.total_amount}\n"
            f"Payment: {order.payment_method}\n"
            f"Transaction ID: {order.transaction_id or 'N/A'}\n"
            f"Shipping to: {order.shipping_address}, {order.shipping_city}\n"
            f"Phone: {order.shipping_phone}\n\n"
            f"Items:\n{items_text}\n"
            f"Date: {local_date.strftime('%Y-%m-%d %I:%M %p')}\n"
        )

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[admin_email],
            fail_silently=False,  # Set to False to catch errors in logs
        )
        print(f"[NOTIFY] Order email sent to {admin_email}")
        return True
    except Exception as e:
        print(f"[NOTIFY] Order email failed: {e}")
        return False


def send_customer_order_confirmation_email(order):
    """Send order confirmation to the customer"""
    try:
        items_text = ""
        for item in order.items.all():
            items_text += f"  - {item.product.name} x{item.quantity} @ Rs.{item.price}\n"

        local_date = timezone.localtime(order.order_date)
        subject = f"Order Confirmation - LIBAAS SAPNA (Order #{order.order_id})"
        message = (
            f"Dear {order.customer.name},\n\n"
            f"Thank you for shopping with LIBAAS SAPNA! Your order has been successfully placed.\n\n"
            f"Order Summary:\n"
            f"Order ID: {order.order_id}\n"
            f"Total Amount: Rs. {order.total_amount}\n"
            f"Payment Method: {order.payment_method}\n\n"
            f"Shipping Details:\n"
            f"Address: {order.shipping_address}, {order.shipping_city}\n"
            f"Phone: {order.shipping_phone}\n\n"
            f"Items Ordered:\n{items_text}\n"
            f"Date: {local_date.strftime('%Y-%m-%d %I:%M %p')}\n\n"
            f"We will notify you once your order is shipped.\n\n"
            f"Best regards,\n"
            f"The LIBAAS SAPNA Team"
        )

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.customer.email],
            fail_silently=False,
        )
        print(f"[NOTIFY] Order confirmation email sent to customer {order.customer.email}")
        return True
    except Exception as e:
        print(f"[NOTIFY] Customer order email failed: {e}")
        return False


def send_low_stock_notification_email(product, admin_email):
    """Send low stock alert to admin email"""
    try:
        subject = f"⚠️ Low Stock Alert: {product.name} ({product.stock_qty} left)"
        message = (
            f"Low stock alert!\n\n"
            f"Product: {product.name}\n"
            f"SKU: {product.sku}\n"
            f"Category: {product.category}\n"
            f"Current Stock: {product.stock_qty}\n"
            f"Threshold: {product.low_stock_threshold}\n\n"
            f"Please restock this item soon.\n"
        )

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[admin_email],
            fail_silently=True,
        )
        print(f"[NOTIFY] Low stock email sent for {product.name}")
        return True
    except Exception as e:
        print(f"[NOTIFY] Low stock email failed: {e}")
        return False


def send_out_of_stock_notification_email(product, admin_email):
    """Send out of stock alert to admin email"""
    try:
        subject = f"❌ OUT OF STOCK: {product.name}"
        message = (
            f"Out of stock alert!\n\n"
            f"Product: {product.name}\n"
            f"SKU: {product.sku}\n"
            f"Category: {product.category}\n"
            f"Current Stock: 0\n\n"
            f"This product is now out of stock. Customers cannot purchase it.\n"
            f"Please restock immediately.\n"
        )

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[admin_email],
            fail_silently=True,
        )
        print(f"[NOTIFY] Out of stock email sent for {product.name}")
        return True
    except Exception as e:
        print(f"[NOTIFY] Out of stock email failed: {e}")
        return False


def get_whatsapp_url(phone, message):
    """
    Generate WhatsApp Web API URL for sending a message.
    Phone should include country code, e.g., +923214858418
    """
    # Clean phone number - remove spaces, dashes
    clean_phone = phone.replace(' ', '').replace('-', '').replace('+', '')
    encoded_msg = urllib.parse.quote(message)
    return f"https://api.whatsapp.com/send?phone={clean_phone}&text={encoded_msg}"


def send_order_whatsapp(order, phone):
    """Generate WhatsApp message for new order and send via Twilio API"""
    items = []
    for item in order.items.all():
        items.append(f"• {item.product.name} x{item.quantity}")
    items_text = "\n".join(items)

    message = (
        f"🛒 *New Order #{order.order_id}*\n\n"
        f"Customer: {order.customer.name}\n"
        f"Total: Rs. {order.total_amount}\n"
        f"Payment: {order.payment_method}\n"
        f"TRX ID: {order.transaction_id or 'N/A'}\n\n"
        f"Items:\n{items_text}\n\n"
        f"Ship to: {order.shipping_address}, {order.shipping_city}\n"
        f"Phone: {order.shipping_phone}"
    )

    from alerts.whatsapp_services import send_whatsapp_message, send_whatsapp_order_confirmation
    
    # 1. Send Detailed Message to Admin
    # Using send_whatsapp_message (Session Message) for admin to include full details
    send_whatsapp_message(phone, message)
    
    # 2. Send Template Confirmation to Customer
    customer_phone = order.customer.phone if order.customer.phone else order.shipping_phone
    send_whatsapp_order_confirmation(customer_phone, order.order_id, order.total_amount)
    
    return message


def send_stock_alert_whatsapp(product, phone, is_out_of_stock=False):
    """Generate WhatsApp message for stock alert"""
    if is_out_of_stock:
        message = (
            f"❌ *OUT OF STOCK*\n\n"
            f"Product: {product.name}\n"
            f"SKU: {product.sku}\n"
            f"Stock: 0\n\n"
            f"Please restock immediately!"
        )
    else:
        message = (
            f"⚠️ *Low Stock Alert*\n\n"
            f"Product: {product.name}\n"
            f"SKU: {product.sku}\n"
            f"Current Stock: {product.stock_qty}\n"
            f"Threshold: {product.low_stock_threshold}\n\n"
            f"Please restock soon."
        )

    from alerts.whatsapp_services import send_whatsapp_order_confirmation
    send_whatsapp_order_confirmation(phone, order.order_id, order.total_amount)
    return message





def send_customer_status_update_notification(order):
    """Send order status update notification to the customer"""
    try:
        subject = f"Order Update - Order #{order.order_id} is now {order.get_order_status_display()}"
        message = (
            f"Dear {order.customer.name},\n\n"
            f"Your order #{order.order_id} status has been updated.\n\n"
            f"New Status: {order.get_order_status_display()}\n\n"
            f"Order Summary:\n"
            f"Total Amount: Rs. {order.total_amount}\n"
            f"Payment Method: {order.payment_method}\n\n"
            f"You can track your order in your account profile.\n\n"
            f"Thank you for shopping with LIBAAS SAPNA!\n\n"
            f"Best regards,\n"
            f"The LIBAAS SAPNA Team"
        )

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.customer.email],
            fail_silently=True,
        )
        print(f"[NOTIFY] Status update email sent to customer {order.customer.email}")
        
        # Also try sending WhatsApp status update
        whatsapp_msg = (
            f"📦 *Order Status Update*\n\n"
            f"Hi {order.customer.name},\n"
            f"Your order *#{order.order_id}* status has been updated to: *{order.get_order_status_display()}*\n\n"
            f"Thank you for choosing LIBAAS SAPNA!"
        )
        from alerts.whatsapp_services import send_whatsapp_status_update
        customer_phone = order.customer.phone if order.customer.phone else order.shipping_phone
        send_whatsapp_status_update(customer_phone, order.customer.name, order.order_id, order.get_order_status_display())
        
        return True
    except Exception as e:
        print(f"[NOTIFY] Customer status update email failed: {e}")
        return False
