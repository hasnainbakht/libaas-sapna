from django.urls import path
from . import views

urlpatterns = [
    path('register', views.register, name='register'),
    path('login', views.login, name='login'),
    path('google-login', views.google_login, name='google_login'),
    path('verify-email', views.verify_email, name='verify_email'),
    path('verify-whatsapp', views.verify_whatsapp, name='verify_whatsapp'),
    path('resend-verification', views.resend_verification_code, name='resend_verification'),
    path('resend-whatsapp-verification', views.resend_whatsapp_verification_code, name='resend_whatsapp_verification'),
    path('refresh', views.refresh_token, name='refresh'),
    path('profile', views.profile, name='profile'),
    path('users/', views.list_users, name='list_users'),
]
