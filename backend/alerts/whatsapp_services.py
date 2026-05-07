import os
import requests
from django.conf import settings

def send_whatsapp_message(to_number, message_body):
    """
    Send a WhatsApp message using Meta WhatsApp Cloud API (Session Message).
    Only works if user messaged in the last 24 hours.
    """
    access_token = getattr(settings, 'META_ACCESS_TOKEN', os.getenv('META_ACCESS_TOKEN'))
    phone_number_id = getattr(settings, 'META_PHONE_NUMBER_ID', os.getenv('META_PHONE_NUMBER_ID'))
    
    # Format the recipient number
    if to_number.startswith('+'):
        to_number = to_number[1:]
    to_number = "".join(filter(str.isdigit, to_number))

    if not access_token or not phone_number_id:
        # Simulation Mode
        print("\n" + "="*50)
        print("[META SIMULATION MODE - WhatsApp Session Message]")
        print(f"To: {to_number}")
        print(f"Message:\n{message_body}")
        print("="*50 + "\n")
        return True

    url = f"https://graph.facebook.com/v20.0/{phone_number_id}/messages"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    data = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "text",
        "text": {
            "body": message_body
        }
    }

    try:
        response = requests.post(url, headers=headers, json=data)
        response_data = response.json()
        if response.status_code in [200, 201]:
            print(f"[META SUCCESS] Session message sent to {to_number}.")
            return True
        else:
            print(f"[META ERROR] Failed to send message to {to_number}. Error: {response_data}")
            return False
    except Exception as e:
        print(f"[META ERROR] Exception sending message to {to_number}: {e}")
        return False

def send_whatsapp_template(to_number, template_name, components=None):
    """
    Send a WhatsApp message using Meta WhatsApp Cloud API (Template Message).
    Required for messages outside the 24-hour window (e.g., OTP).
    """
    access_token = getattr(settings, 'META_ACCESS_TOKEN', os.getenv('META_ACCESS_TOKEN'))
    phone_number_id = getattr(settings, 'META_PHONE_NUMBER_ID', os.getenv('META_PHONE_NUMBER_ID'))
    
    if to_number.startswith('+'):
        to_number = to_number[1:]
    to_number = "".join(filter(str.isdigit, to_number))

    if not access_token or not phone_number_id:
        # Simulation Mode
        print("\n" + "="*50)
        print("[META SIMULATION MODE - WhatsApp Template]")
        print(f"To: {to_number}")
        print(f"Template: {template_name}")
        print(f"Components: {components}")
        print("="*50 + "\n")
        return True

    url = f"https://graph.facebook.com/v20.0/{phone_number_id}/messages"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    data = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {
                "code": "en_US"
            }
        }
    }
    
    if components:
        data["template"]["components"] = components

    try:
        response = requests.post(url, headers=headers, json=data)
        response_data = response.json()
        if response.status_code in [200, 201]:
            print(f"[META SUCCESS] Template '{template_name}' sent to {to_number}.")
            return True
        else:
            print(f"[META ERROR] Template '{template_name}' failed for {to_number}. Error: {response_data}")
            return False
    except Exception as e:
        print(f"[META EXCEPTION] Template error: {e}")
        return False

def send_whatsapp_otp(phone, code):
    """Sends OTP verification code via WhatsApp. Fallback to Session Message if template is missing."""
    message = f"Your LIBAAS SAPNA verification code is: {code}"
    
    # Try template, but the fallback will catch it if template is not approved
    components = [{"type": "body", "parameters": [{"type": "text", "text": code}]}]
    success = send_whatsapp_template(phone, "verification_code", components)
    
    if not success:
        print(f"[WHATSAPP] Template failed/blocked. Sending session message to {phone}...")
        return send_whatsapp_message(phone, message)
    return True

def send_whatsapp_order_confirmation(phone, order_id, total):
    """Sends Order confirmation. Fallback to Session Message if template is missing."""
    message = f"LIBAAS SAPNA - Order Confirmation\n\nOrder ID: #{order_id}\nTotal: Rs. {total}\n\nThank you for your order!"
    
    components = [{"type": "body", "parameters": [{"type": "text", "text": str(order_id)}, {"type": "text", "text": str(total)}]}]
    success = send_whatsapp_template(phone, "order_confirmation", components)
    
    if not success:
        print(f"[WHATSAPP] Template failed/blocked. Sending session message to {phone}...")
        return send_whatsapp_message(phone, message)
    return True

def send_whatsapp_status_update(phone, customer_name, order_id, status):
    """Sends Order status update. Fallback to Session Message if template is missing."""
    message = f"Order Status Update\n\nHi {customer_name},\nYour order #{order_id} status has been updated to: {status}\n\nThank you for choosing LIBAAS SAPNA!"
    
    components = [{"type": "body", "parameters": [{"type": "text", "text": customer_name}, {"type": "text", "text": str(order_id)}, {"type": "text", "text": status}]}]
    success = send_whatsapp_template(phone, "order_status_update", components)
    
    if not success:
        print(f"[WHATSAPP] Template failed/blocked. Sending session message to {phone}...")
        return send_whatsapp_message(phone, message)
    return True
