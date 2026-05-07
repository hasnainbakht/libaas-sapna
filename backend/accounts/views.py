from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from .serializers import UserRegistrationSerializer, UserSerializer
from .models import User
from alerts.whatsapp_services import send_whatsapp_otp


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Generate verification code
        code = user.generate_verification_code()
        
        # Send Email
        email_sent = False
        try:
            from django.core.mail import send_mail
            from django.conf import settings
            send_mail(
                'Libaas Sapna - Email Verification',
                f'Your verification code is: {code}',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
            email_sent = True
        except Exception as e:
            print(f"Email sending failed: {e}")
            # Continue registration even if message fails
        
        refresh = RefreshToken.for_user(user)
        response_data = {
            'user_id': user.user_id,
            'name': user.name,
            'email': user.email,
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'email_verified': False,
            'phone_verified': False
        }
        
        if email_sent:
            response_data['message'] = 'Registration successful! Please check your email for the verification code.'
            response_data['verification_code'] = code  # For testing, include code in response
        else:
            response_data['message'] = f'Registration successful! Your verification code is: {code} (Email not configured)'
            response_data['verification_code'] = code  # Include code for testing
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """Verify user email with code"""
    email = request.data.get('email')
    code = request.data.get('code')
    
    if not email or not code:
        return Response(
            {'error': 'Email and code are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if code matches and not expired
    if user.verification_code != code.upper():
        return Response(
            {'error': 'Invalid verification code'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if user.verification_code_expiry and user.verification_code_expiry < timezone.now():
        return Response(
            {'error': 'Verification code has expired'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify user
    user.email_verified = True
    user.verification_code = None
    user.verification_code_expiry = None
    user.save()
    
    return Response({
        'message': 'Account verified successfully!',
        'email_verified': True
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification_code(request):
    """Resend verification code"""
    email = request.data.get('email')
    
    if not email:
        return Response(
            {'error': 'Email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if user.email_verified:
        return Response(
            {'error': 'Email already verified'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Generate new code
    code = user.generate_verification_code()
    
    # Send Email
    try:
        from django.core.mail import send_mail
        from django.conf import settings
        send_mail(
            'Libaas Sapna - Email Verification',
            f'Your verification code is: {code}',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
    except Exception as e:
        print(f"Email resend failed: {e}")
    
    return Response({
        'message': 'New verification code generated and sent to email'
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_whatsapp(request):
    """Verify user phone with code"""
    email = request.data.get('email')
    code = request.data.get('code')
    
    if not email or not code:
        return Response(
            {'error': 'Email and code are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if code matches and not expired
    if user.verification_code != code.upper():
        return Response(
            {'error': 'Invalid verification code'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if user.verification_code_expiry and user.verification_code_expiry < timezone.now():
        return Response(
            {'error': 'Verification code has expired'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify phone
    user.phone_verified = True
    user.verification_code = None
    user.verification_code_expiry = None
    user.save()
    
    return Response({
        'message': 'Phone number verified successfully via WhatsApp!',
        'phone_verified': True
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_whatsapp_verification_code(request):
    """Resend WhatsApp verification code"""
    email = request.data.get('email')
    
    if not email:
        return Response(
            {'error': 'Email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if user.phone_verified:
        return Response(
            {'error': 'Phone number already verified'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not user.phone:
        return Response(
            {'error': 'No phone number associated with this account'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Generate new code
    code = user.generate_verification_code()
    send_whatsapp_otp(user.phone, code)
    
    return Response({
        'message': 'Verification code sent to your WhatsApp'
    })



@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login user and return JWT token"""
    try:
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(request, username=email, password=password)
        
        if user is None:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'error': 'User account is disabled'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Check verification for customers
        if user.role == 'customer' and not user.email_verified:
            return Response(
                {'error': 'Please verify your account (via email code) before logging in', 'email_verified': False},
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)
        serializer = UserSerializer(user)
        
        return Response({
            'user_id': user.user_id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'email_verified': user.email_verified,
            'phone_verified': user.phone_verified
        })
    except Exception as e:
        import traceback
        print(f"LOGIN ERROR: {type(e).__name__}: {e}")
        traceback.print_exc()
        return Response(
            {'error': f'Internal server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    """Login/Register with Google"""
    google_id = request.data.get('google_id')
    email = request.data.get('email')
    name = request.data.get('name')
    profile_picture = request.data.get('profile_picture')
    
    if not google_id or not email:
        return Response(
            {'error': 'Google ID and email are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Try to find existing user
    try:
        user = User.objects.get(google_id=google_id)
    except User.DoesNotExist:
        # Try to find by email
        try:
            user = User.objects.get(email=email)
            # Link Google account
            user.google_id = google_id
            user.save()
        except User.DoesNotExist:
            # Create new user
            user = User.objects.create_user(
                email=email,
                name=name or email.split('@')[0],
                google_id=google_id,
                email_verified=True,  # Google emails are pre-verified
                phone_verified=False
            )
    
    if not user.is_active:
        return Response(
            {'error': 'User account is disabled'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    refresh = RefreshToken.for_user(user)
    serializer = UserSerializer(user)
    
    return Response({
        'user_id': user.user_id,
        'name': user.name,
        'email': user.email,
        'role': user.role,
        'token': str(refresh.access_token),
        'refresh': str(refresh),
        'email_verified': user.email_verified,
        'phone_verified': user.phone_verified
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refresh_token(request):
    """Refresh JWT token"""
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response(
            {'error': 'Refresh token is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        refresh = RefreshToken(refresh_token)
        return Response({
            'token': str(refresh.access_token)
        })
    except Exception as e:
        return Response(
            {'error': 'Invalid refresh token'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile(request):
    """Get or update current user profile"""
    if request.method == 'GET':
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    # Handle profile updates
    user = request.user
    allowed_fields = ['name', 'phone']
    updated = False
    phone_updated = False

    if 'phone' in request.data and request.data['phone'] != user.phone:
        phone_updated = True

    for field in allowed_fields:
        if field in request.data:
            setattr(user, field, request.data[field])
            updated = True

    # If phone was updated, reset verification and send OTP
    if phone_updated and user.phone:
        user.phone_verified = False
        code = user.generate_verification_code()
        print(f"\n[DB DEBUG] Verification code '{code}' saved for User ID: {user.user_id} ({user.email})")
        try:
            from alerts.whatsapp_services import send_whatsapp_otp
            send_whatsapp_otp(user.phone, code)
        except Exception as e:
            print(f"WhatsApp sending failed from profile: {e}")

    # Handle password change
    new_password = request.data.get('new_password')
    current_password = request.data.get('current_password')
    if new_password:
        if not current_password:
            return Response(
                {'error': 'Current password is required to set a new password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not user.check_password(current_password):
            return Response(
                {'error': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if len(new_password) < 8:
            return Response(
                {'error': 'New password must be at least 8 characters long'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.set_password(new_password)
        updated = True

    if updated:
        user.save()

    serializer = UserSerializer(user)
    return Response({'message': 'Profile updated successfully. A verification code has been sent to your WhatsApp.', **serializer.data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_users(request):
    """List all users (admin only)"""
    if request.user.role != 'admin':
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get all customers with their order counts
    from django.db.models import Count
    users = User.objects.filter(role='customer').annotate(
        orders_count=Count('orders')
    ).order_by('-created_at')
    
    # Serialize with order count
    data = []
    for user in users:
        data.append({
            'user_id': user.user_id,
            'name': user.name,
            'email': user.email,
            'phone': user.phone,
            'role': user.role,
            'created_at': user.created_at,
            'is_active': user.is_active,
            'email_verified': user.email_verified,
            'phone_verified': user.phone_verified,
            'orders_count': user.orders_count
        })
    
    return Response(data)
