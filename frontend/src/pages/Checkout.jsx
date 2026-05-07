import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import api from '../services/api';
import { clearCart } from '../store/slices/cartSlice';
import { useSettings } from '../context/SettingsContext';
import { toast } from 'react-toastify';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentGateway from '../components/Payment/PaymentGateway';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import './Checkout.css';

const Checkout = () => {
  const { items, total } = useSelector((state) => state.cart);
  const { settings } = useSettings();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    shipping_address: '',
    shipping_city: '',
    shipping_province: 'Punjab',
    shipping_phone: '',
    payment_method: 'cod',
    transaction_id: '',
  });

  const PAKISTAN_PROVINCES = [
    'Punjab',
    'Sindh',
    'Khyber Pakhtunkhwa',
    'Balochistan',
    'Gilgit-Baltistan',
    'Azad Kashmir',
    'Islamabad Capital Territory'
  ];
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'payment_method') {
      setFormData(prev => ({ ...prev, payment_method: e.target.value, transaction_id: '' }));
      setCopied(false);
    }
  };

  const needsTransactionId = ['easypaisa', 'jazzcash', 'bank_transfer'].includes(formData.payment_method);

  const getPaymentAccount = () => {
    switch (formData.payment_method) {
      case 'easypaisa': return settings.easypaisaNumber || '03209811587';
      case 'jazzcash': return settings.jazzcashNumber || '03554856598';
      case 'bank_transfer': return settings.bankAccount || 'Contact admin for bank details';
      default: return '';
    }
  };

  const getPaymentLabel = () => {
    switch (formData.payment_method) {
      case 'easypaisa': return 'Easypaisa';
      case 'jazzcash': return 'JazzCash';
      case 'bank_transfer': return 'Bank Transfer';
      default: return '';
    }
  };

  const copyAccountNumber = () => {
    const account = getPaymentAccount();
    navigator.clipboard.writeText(account);
    setCopied(true);
    toast.success('Account number copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const validateForm = () => {
    const phoneRegex = /^((\+92)?(0092)?(92)?(0)?)(3[0-9]{2})[0-9]{7}$/;
    if (!phoneRegex.test(formData.shipping_phone.replace(/[\s-]/g, ''))) {
      toast.error('Please enter a valid Pakistani mobile number');
      return false;
    }
    if (formData.shipping_address.trim().length < 10) {
      toast.error('Shipping address must be at least 10 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (needsTransactionId && !formData.transaction_id.trim()) {
      toast.error(`Please enter your ${getPaymentLabel()} Transaction ID`);
      return;
    }
    if (formData.payment_method === 'card') {
      setShowPaymentModal(true);
      return;
    }
    await placeOrder();
  };

  const placeOrder = async (isPaid = false) => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        shipping_address: `${formData.shipping_address}, ${formData.shipping_province}`,
        payment_status: isPaid ? 'paid' : 'pending',
        order_status: isPaid ? 'paid' : 'pending_payment'
      };
      delete payload.shipping_province;
      await api.post('/orders/', payload);
      dispatch(clearCart());
      toast.success('Order placed successfully!');
      navigate(`/orders`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error placing order');
    } finally {
      setLoading(false);
    }
  };

  const shippingFee = total >= (settings.freeShippingThreshold || 3000) ? 0 : (settings.shippingFee || 200);
  const grandTotal = total + shippingFee;

  return (
    <div className="checkout-enterprise">
      <div className="container">
        <div className="checkout-header-master">
           <button onClick={() => navigate('/cart')} className="back-minimal"><ArrowBackIcon /></button>
           <h1>SECURE CHECKOUT</h1>
           <div className="security-badge"><VerifiedUserIcon fontSize="small" /> 256-BIT ENCRYPTION</div>
        </div>

        <div className="checkout-grid-master">
          <form onSubmit={handleSubmit} className="checkout-form-master">
            <section className="checkout-section">
              <div className="section-title-premium">
                <span className="step-count">01</span>
                <h3>SHIPPING DESTINATION</h3>
              </div>
              <div className="form-row-modern">
                <div className="form-group-modern">
                  <label>PROVINCE / TERRITORY</label>
                  <select name="shipping_province" value={formData.shipping_province} onChange={handleChange} required>
                    {PAKISTAN_PROVINCES.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                  </select>
                </div>
                <div className="form-group-modern">
                  <label>CITY</label>
                  <input type="text" name="shipping_city" value={formData.shipping_city} onChange={handleChange} placeholder="e.g. Lahore" required />
                </div>
              </div>
              <div className="form-group-modern full">
                <label>STREET ADDRESS</label>
                <textarea name="shipping_address" value={formData.shipping_address} onChange={handleChange} required rows="3" placeholder="House #, Street, Block, Area..." />
              </div>
              <div className="form-group-modern">
                <label>MOBILE NUMBER (WHATSAPP PREFERRED)</label>
                <input type="tel" name="shipping_phone" value={formData.shipping_phone} onChange={handleChange} placeholder="03XXXXXXXXX" required />
              </div>
            </section>

            <section className="checkout-section">
              <div className="section-title-premium">
                <span className="step-count">02</span>
                <h3>PAYMENT METHOD</h3>
              </div>
              <div className="payment-grid-master">
                <label className={`payment-pill-master ${formData.payment_method === 'cod' ? 'active' : ''}`}>
                  <input type="radio" name="payment_method" value="cod" checked={formData.payment_method === 'cod'} onChange={handleChange} />
                  <LocalAtmIcon />
                  <span>CASH ON DELIVERY</span>
                </label>
                <label className={`payment-pill-master ${formData.payment_method === 'card' ? 'active' : ''}`}>
                  <input type="radio" name="payment_method" value="card" checked={formData.payment_method === 'card'} onChange={handleChange} />
                  <CreditCardIcon />
                  <span>CREDIT / DEBIT CARD</span>
                </label>
                <label className={`payment-pill-master ${formData.payment_method === 'easypaisa' ? 'active' : ''}`}>
                  <input type="radio" name="payment_method" value="easypaisa" checked={formData.payment_method === 'easypaisa'} onChange={handleChange} />
                  <PhoneAndroidIcon />
                  <span>EASYPAISA</span>
                </label>
                <label className={`payment-pill-master ${formData.payment_method === 'jazzcash' ? 'active' : ''}`}>
                  <input type="radio" name="payment_method" value="jazzcash" checked={formData.payment_method === 'jazzcash'} onChange={handleChange} />
                  <PhoneAndroidIcon />
                  <span>JAZZCASH</span>
                </label>
              </div>

              {needsTransactionId && (
                <div className="payment-guide-box">
                  <div className="guide-header">
                     <h4>SEND RS. {grandTotal.toLocaleString()} TO:</h4>
                     <div className="account-pill">
                        <strong>{getPaymentAccount()}</strong>
                        <button type="button" onClick={copyAccountNumber}>{copied ? 'COPIED' : 'COPY'}</button>
                     </div>
                  </div>
                  <p className="account-holder-name">ACCOUNT NAME: <strong>{settings.storeName || 'LIBAAS SAPNA'}</strong></p>
                  <div className="trx-input-group">
                     <label>TRANSACTION ID (TRX)</label>
                     <input type="text" name="transaction_id" value={formData.transaction_id} onChange={handleChange} placeholder="Enter the 11-digit TRX ID" required />
                  </div>
                </div>
              )}
            </section>

            <button type="submit" disabled={loading} className="place-order-master">
              {loading ? 'PROCESSING...' : `CONFIRM ORDER — RS. ${grandTotal.toLocaleString()}`}
            </button>
          </form>

          <aside className="checkout-summary-sidebar">
            <div className="summary-card-modern">
               <h3>BAG SUMMARY</h3>
               <div className="summary-items-list">
                  {items.map((item) => (
                    <div key={item.cart_id} className="summary-item-row">
                      <div className="item-main">
                         <strong>{item.product_name}</strong>
                         <span>QTY: {item.quantity} {item.size && `| SIZE: ${item.size}`}</span>
                      </div>
                      <div className="item-price">Rs. {item.subtotal.toLocaleString()}</div>
                    </div>
                  ))}
               </div>
               <div className="summary-footer">
                  <div className="footer-line">
                     <span>SUBTOTAL</span>
                     <span>Rs. {total.toLocaleString()}</span>
                  </div>
                  <div className="footer-line">
                     <span>SHIPPING</span>
                     <span className="free">{shippingFee === 0 ? 'COMPLIMENTARY' : `Rs. ${shippingFee}`}</span>
                  </div>
                  <div className="footer-line total">
                     <span>GRAND TOTAL</span>
                     <span>Rs. {grandTotal.toLocaleString()}</span>
                  </div>
               </div>
               {shippingFee === 0 && <div className="free-shipping-note">✨ YOUR ORDER QUALIFIES FOR FREE SHIPPING</div>}
            </div>
          </aside>
        </div>
      </div>

      <PaymentGateway 
        isOpen={showPaymentModal}
        amount={grandTotal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={() => {
          setShowPaymentModal(false);
          placeOrder(true);
        }}
      />
    </div>
  );
};

export default Checkout;
