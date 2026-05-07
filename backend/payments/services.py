import hashlib
import hmac
import requests
from decimal import Decimal
from typing import Dict
from django.conf import settings


class EasypaisaPaymentGateway:
    """Easypaisa payment integration"""

    def __init__(self):
        self.merchant_id = settings.EASYPAISA_MERCHANT_ID
        self.secret_key = settings.EASYPAISA_SECRET_KEY
        self.api_url = settings.EASYPAISA_API_URL

    def create_payment(self, order_id: int, amount: Decimal) -> Dict:
        """Initialize payment with Easypaisa"""
        data = {
            'merchant_id': self.merchant_id,
            'order_id': str(order_id),
            'amount': str(amount),
            'currency': 'PKR',
            'callback_url': f"{settings.SITE_URL}/api/payments/webhook"
        }

        # Generate signature
        data['signature'] = self._generate_signature(data)

        try:
            response = requests.post(f"{self.api_url}/init", json=data, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {'error': str(e)}

    def verify_payment(self, transaction_id: str) -> Dict:
        """Verify payment status"""
        data = {
            'merchant_id': self.merchant_id,
            'transaction_id': transaction_id
        }

        data['signature'] = self._generate_signature(data)

        try:
            response = requests.post(f"{self.api_url}/verify", json=data, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {'error': str(e)}

    def _generate_signature(self, data: Dict) -> str:
        """Generate HMAC signature"""
        message = '&'.join([f"{k}={v}" for k, v in sorted(data.items())])
        signature = hmac.new(
            self.secret_key.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        return signature


class JazzCashPaymentGateway:
    """JazzCash payment integration"""
    # Similar implementation as Easypaisa
    def __init__(self):
        self.merchant_id = settings.JAZZCASH_MERCHANT_ID
        self.secret_key = settings.JAZZCASH_SECRET_KEY
        self.api_url = settings.JAZZCASH_API_URL

    def create_payment(self, order_id: int, amount: Decimal) -> Dict:
        """Initialize payment with JazzCash"""
        # Implementation similar to Easypaisa
        return {'payment_url': f"{self.api_url}/payment?order_id={order_id}"}

    def verify_payment(self, transaction_id: str) -> Dict:
        """Verify payment status"""
        return {'status': 'success'}


def get_payment_gateway(method: str):
    """Get payment gateway instance"""
    if method == 'easypaisa':
        return EasypaisaPaymentGateway()
    elif method == 'jazzcash':
        return JazzCashPaymentGateway()
    else:
        raise ValueError(f"Unsupported payment method: {method}")


