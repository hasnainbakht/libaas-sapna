import React, { useState } from 'react';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LockIcon from '@mui/icons-material/Lock';
import ShieldIcon from '@mui/icons-material/Shield';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import './PaymentGateway.css';

const PaymentGateway = ({ amount, isOpen, onClose, onPaymentSuccess }) => {
  const [step, setStep] = useState('input'); // input, processing, authenticating, success
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [error, setError] = useState('');

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === 'cardNumber') value = formatCardNumber(value);
    if (name === 'expiry') {
      value = value.replace(/[^0-9]/g, '');
      if (value.length > 2) value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    if (name === 'cvv') value = value.replace(/[^0-9]/g, '').substring(0, 3);
    
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.cardNumber.length < 19) return setError('Invalid card number');
    if (formData.expiry.length < 5) return setError('Invalid expiry date');
    if (formData.cvv.length < 3) return setError('Invalid CVV');
    
    setError('');
    setStep('processing');
    
    // Simulate high-end payment processing
    setTimeout(() => {
      setStep('authenticating');
    }, 2000);

    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onPaymentSuccess();
      }, 2000);
    }, 5000);
  };

  if (!isOpen) return null;

  return (
    <div className="payment-overlay">
      <div className="payment-modal">
        <button className="close-payment" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </button>

        {step === 'input' && (
          <form onSubmit={handleSubmit} className="payment-form">
            <div className="payment-header">
              <ShieldIcon className="text-gold" sx={{ fontSize: 48, mb: 1 }} />
              <h3>Secure Checkout</h3>
              <p>Amount to Pay: <strong>Rs. {amount.toLocaleString()}</strong></p>
            </div>

            {error && (
              <div className="payment-error">
                <ErrorOutlineIcon fontSize="small" sx={{ mr: 1 }} /> {error}
              </div>
            )}

            <div className="form-group">
              <label>Cardholder Name</label>
              <input 
                type="text" 
                name="name" 
                placeholder="Full Name as on card"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Card Number</label>
              <div className="input-with-icon">
                <CreditCardIcon className="icon" sx={{ fontSize: 20 }} />
                <input 
                  type="text" 
                  name="cardNumber" 
                  placeholder="0000 0000 0000 0000"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  maxLength="19"
                  required
                />
              </div>
            </div>

            <div className="row">
              <div className="form-group">
                <label>Expiry Date</label>
                <input 
                  type="text" 
                  name="expiry" 
                  placeholder="MM/YY"
                  value={formData.expiry}
                  onChange={handleInputChange}
                  maxLength="5"
                  required
                />
              </div>
              <div className="form-group">
                <label>CVV</label>
                <div className="input-with-icon">
                  <LockIcon className="icon" sx={{ fontSize: 20 }} />
                  <input 
                    type="password" 
                    name="cvv" 
                    placeholder="123"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    maxLength="3"
                    required
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="pay-now-btn">
              Pay Rs. {amount.toLocaleString()}
            </button>

            <div className="secure-badges">
              <span>PCI-DSS Compliant</span>
              <span>•</span>
              <span>256-bit SSL Encryption</span>
            </div>
          </form>
        )}

        {(step === 'processing' || step === 'authenticating') && (
          <div className="payment-status">
            <AutorenewIcon className="spinner text-gold" sx={{ fontSize: 64, mb: 2 }} />
            <h3>{step === 'processing' ? 'Processing Payment...' : 'Authenticating with Bank...'}</h3>
            <p>Please do not refresh the page or click back.</p>
          </div>
        )}

        {step === 'success' && (
          <div className="payment-status success">
            <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
            <h3>Payment Successful!</h3>
            <p>Your transaction has been processed securely.</p>
            <p className="redirect-text">Redirecting to order summary...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentGateway;
