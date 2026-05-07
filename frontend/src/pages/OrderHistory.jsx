import React, { useEffect, useState } from 'react';
import api from '../services/api';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptIcon from '@mui/icons-material/Receipt';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, Link } from 'react-router-dom';
import './OrderHistory.css';

const OrderTimeline = ({ status }) => {
  const steps = [
    { id: 'placed', label: 'ORDER PLACED', icon: <ReceiptIcon fontSize="small" /> },
    { id: 'processing', label: 'PROCESSING', icon: <InventoryIcon fontSize="small" /> },
    { id: 'shipped', label: 'DISPATCHED', icon: <LocalShippingIcon fontSize="small" /> },
    { id: 'delivered', label: 'DELIVERED', icon: <CheckCircleIcon fontSize="small" /> },
  ];

  const getStepStatus = (stepId) => {
    const statusMap = {
      'pending_payment': 1,
      'paid': 1,
      'processing': 2,
      'shipped': 3,
      'delivered': 4,
      'cancelled': -1,
    };

    const currentStep = statusMap[status] || 1; // Default to step 1 (placed)
    const stepIndices = { 'placed': 1, 'processing': 2, 'shipped': 3, 'delivered': 4 };
    const stepIndex = stepIndices[stepId];

    if (status === 'cancelled') return 'cancelled';
    if (currentStep > stepIndex) return 'completed';
    if (currentStep === stepIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="order-timeline-master">
      {steps.map((step, index) => {
        const stepStatus = getStepStatus(step.id);
        return (
          <div key={step.id} className={`timeline-node ${stepStatus}`}>
            <div className="node-icon-box">
               {stepStatus === 'completed' ? <CheckCircleIcon fontSize="small" /> : step.icon}
            </div>
            <span className="node-label">{step.label}</span>
            {index !== steps.length - 1 && <div className="node-line"></div>}
          </div>
        );
      })}
    </div>
  );
};

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/list');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="order-history-enterprise container">
       <div className="loading-shimmer-header"></div>
       <div className="loading-shimmer-card"></div>
    </div>
  );

  return (
    <div className="order-history-enterprise">
      <div className="container">
        <header className="history-header-modern">
          <div className="header-left">
             <span className="subtitle">MY ACCOUNT</span>
             <h1>Purchases</h1>
          </div>
          <Link to="/shop" className="btn-continue-shopping">
             <ArrowBackIcon sx={{ mr: 1, fontSize: 18 }} /> RETURN TO SHOP
          </Link>
        </header>

        {orders.length === 0 ? (
          <div className="empty-history-box">
             <ShoppingBagIcon sx={{ fontSize: 64, color: '#f1f5f9', mb: 3 }} />
             <h3>NO ORDERS DISCOVERED</h3>
             <p>Your acquisition history is currently empty. Start exploring our collections.</p>
             <button onClick={() => navigate('/shop')} className="btn-masterpiece">BROWSE COLLECTIONS</button>
          </div>
        ) : (
          <div className="orders-list-master">
            {orders.map((order) => (
              <div key={order.id} className="order-card-master">
                <div className="card-top-bar">
                  <div className="meta-group">
                    <span className="meta-label">ORDER REFERENCE</span>
                    <span className="meta-value">#{order.order_id || order.id}</span>
                  </div>
                  <div className="meta-group">
                    <span className="meta-label">DATE PLACED</span>
                    <span className="meta-value">{new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}</span>
                  </div>
                  <div className="meta-group">
                    <span className="meta-label">STATUS</span>
                    <span className={`status-tag-premium ${order.order_status || 'pending'}`}>{(order.order_status || 'pending').replace('_', ' ').toUpperCase()}</span>
                  </div>
                </div>

                <div className="card-timeline-box">
                  <OrderTimeline status={order.order_status || 'pending'} />
                </div>

                <div className="card-details-grid">
                  <div className="items-column">
                    <h4>MANIFEST</h4>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="item-row-minimal">
                        <span className="item-name">{item.product_name} <small>× {item.quantity}</small></span>
                        <span className="item-price">Rs. {(item.subtotal || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="shipping-column">
                    <h4>DESTINATION</h4>
                    <p>{order.shipping_address}</p>
                    <p>{order.shipping_city}</p>
                    <p>{order.shipping_phone}</p>
                  </div>
                  <div className="total-column">
                    <span className="total-label">GRAND TOTAL</span>
                    <span className="total-value">Rs. {(order.total_amount || 0).toLocaleString()}</span>
                    <span className="payment-method-tag">{(order.payment_method || 'cod').toUpperCase()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
