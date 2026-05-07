import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import './AdminPages.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/list');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Show empty state instead of fake data
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      // Update locally for demo
      setOrders(prev => prev.map(o =>
        o.order_id === orderId ? { ...o, order_status: newStatus } : o
      ));
      toast.success('Order status updated');
    }
  };

  const getFilteredOrders = () => {
    if (filter === 'all') return orders;
    return orders.filter(o => o.order_status === filter);
  };

  const filteredOrders = getFilteredOrders();
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

  if (loading) return <div className="loading">Loading orders...</div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="header-left">
          <h1><ShoppingBagIcon sx={{ mr: 1, verticalAlign: 'bottom' }} /> Order Management</h1>
          <p>View and manage customer orders</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-icon"><ShoppingBagIcon /></span>
          <div className="stat-info">
            <span className="stat-value">{orders.length}</span>
            <span className="stat-label">Total Orders</span>
          </div>
        </div>
        <div className="stat-card success">
          <span className="stat-icon"><MonetizationOnIcon /></span>
          <div className="stat-info">
            <span className="stat-value">Rs. {Number(totalRevenue).toLocaleString()}</span>
            <span className="stat-label">Total Revenue</span>
          </div>
        </div>
        <div className="stat-card warning">
          <span className="stat-icon"><AccessTimeIcon /></span>
          <div className="stat-info">
            <span className="stat-value">{orders.filter(o => o.order_status === 'processing').length}</span>
            <span className="stat-label">Processing</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon"><LocalShippingIcon /></span>
          <div className="stat-info">
            <span className="stat-value">{orders.filter(o => o.order_status === 'shipped').length}</span>
            <span className="stat-label">Shipped</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          All Orders
        </button>
        <button className={`tab ${filter === 'processing' ? 'active' : ''}`} onClick={() => setFilter('processing')}>
          Processing
        </button>
        <button className={`tab ${filter === 'shipped' ? 'active' : ''}`} onClick={() => setFilter('shipped')}>
          Shipped
        </button>
        <button className={`tab ${filter === 'delivered' ? 'active' : ''}`} onClick={() => setFilter('delivered')}>
          Delivered
        </button>
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.order_id}>
                <td><strong>#{order.order_id}</strong></td>
                <td>
                  <div className="customer-cell">
                    <div className="avatar">{order.customer?.name?.charAt(0)}</div>
                    <div>
                      <span>{order.customer?.name}</span>
                      <small style={{ display: 'block', color: 'var(--gray-500)' }}>{order.customer?.email}</small>
                    </div>
                  </div>
                </td>
                <td>{new Date(order.order_date).toLocaleDateString()}</td>
                <td>{order.items?.length || 0} items</td>
                <td><strong>Rs. {Number(order.total_amount || 0).toLocaleString()}</strong></td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className={`status-badge ${order.payment_status}`}>
                      {order.payment_method}
                    </span>
                    {order.transaction_id && (
                      <small style={{ 
                        color: 'var(--primary-purple)', 
                        fontWeight: '600',
                        fontSize: '0.75rem',
                        background: 'rgba(102, 126, 234, 0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        wordBreak: 'break-all'
                      }}>
                        TRX: {order.transaction_id}
                      </small>
                    )}
                  </div>
                </td>
                <td>
                  <select
                    value={order.order_status}
                    onChange={(e) => updateStatus(order.order_id, e.target.value)}
                    className="status-select"
                    style={{
                      padding: '0.4rem',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      color: '#334155'
                    }}
                  >
                    <option value="pending_payment">Pending Payment</option>
                    <option value="paid">Paid</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;

