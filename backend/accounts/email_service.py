from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def send_verification_email(user, code):
    """Send email verification code to user"""
    from django.conf import settings
    
    # Debug: Print email configuration
    print("=" * 50)
    print("EMAIL CONFIGURATION DEBUG:")
    print(f"  EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"  EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"  EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"  EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
    print(f"  EMAIL_HOST_PASSWORD: {'*' * len(settings.EMAIL_HOST_PASSWORD) if settings.EMAIL_HOST_PASSWORD else 'NOT SET'}")
    print(f"  DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    print("=" * 50)
    
    # Check if email is configured
    if not settings.EMAIL_HOST_USER:
        print("ERROR: Email not configured (EMAIL_HOST_USER is empty). Skipping email send.")
        return False
    
    if not settings.EMAIL_HOST_PASSWORD:
        print("ERROR: Email password not configured (EMAIL_HOST_PASSWORD is empty). Skipping email send.")
        return False
    
    print(f"Attempting to send email to: {user.email}")
    
    subject = 'Verify Your Email - LIBAAS SAPNA'
    
    html_message = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #667eea; text-align: center;">Welcome to LIBAAS SAPNA!</h1>
            <p style="color: #333; font-size: 16px;">Hello {user.name},</p>
            <p style="color: #666;">Thank you for registering with LIBAAS SAPNA. Please verify your email address by entering the code below:</p>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
                <h2 style="margin: 0; font-size: 32px; letter-spacing: 5px;">{code}</h2>
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 15 minutes.</p>
            <p style="color: #666; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">© 2024 LIBAAS SAPNA. All rights reserved.</p>
        </div>
    </body>
    </html>
    """
    
    plain_message = strip_tags(html_message)
    
    try:
        result = send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER,
            [user.email],
            html_message=html_message,
            fail_silently=False,  # Show errors for debugging
        )
        print(f"Email sent successfully! Result: {result}")
        return True
    except Exception as e:
        print(f"ERROR sending email: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


