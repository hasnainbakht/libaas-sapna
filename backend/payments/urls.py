from django.urls import path
from . import views

urlpatterns = [
    path('process', views.process_payment, name='process_payment'),
    path('webhook', views.payment_webhook, name='payment_webhook'),
    path('<int:payment_id>/verify', views.verify_payment, name='verify_payment'),
    path('create-checkout-session', views.create_stripe_checkout_session, name='create_stripe_checkout'),
    path('stripe-webhook', views.stripe_webhook, name='stripe_webhook'),
]


