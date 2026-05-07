import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SearchIcon from '@mui/icons-material/Search';
import './AdminPages.css';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerOrders, setCustomerOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    useEffect(() => {
        fetchCustomers(true);
        
        // Real-time polling every 5 seconds
        const interval = setInterval(() => {
            fetchCustomers(false);
        }, 5000);
        
        return () => clearInterval(interval);
    }, []);

    const fetchCustomers = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            // Fetch customers from API
            const response = await api.get('/auth/users/');
            const users = Array.isArray(response.data) ? response.data : (response.data.results || []);
            setCustomers(users);
        } catch (error) {
            console.error('Error fetching customers:', error);
            // Show empty state instead of fake data
            setCustomers([]);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const handleCustomerClick = async (customer) => {
        setSelectedCustomer(customer);
        setLoadingOrders(true);
        try {
            const response = await api.get(`/orders/user/${customer.user_id}`);
            setCustomerOrders(response.data);
        } catch (error) {
            console.error('Error fetching customer orders:', error);
            setCustomerOrders([]);
        } finally {
            setLoadingOrders(false);
        }
    };

    const closeModal = () => {
        setSelectedCustomer(null);
        setCustomerOrders([]);
    };

    const filteredCustomers = customers.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="loading">Loading customers...</div>;

    return (
        <div className="admin-page">
            <div className="page-header">
                <div className="header-left">
                    <h1><PeopleIcon sx={{ mr: 1, verticalAlign: 'bottom' }} /> Customer Management</h1>
                    <p>View and manage your customers</p>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-row">
                <div className="stat-card">
                    <span className="stat-icon"><PeopleIcon /></span>
                    <div className="stat-info">
                        <span className="stat-value">{customers.length}</span>
                        <span className="stat-label">Total Customers</span>
                    </div>
                </div>
                <div className="stat-card success">
                    <span className="stat-icon"><ShoppingCartIcon /></span>
                    <div className="stat-info">
                        <span className="stat-value">{customers.reduce((sum, c) => sum + (c.orders_count || 0), 0)}</span>
                        <span className="stat-label">Total Orders</span>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="filters-bar">
                <div className="search-box">
                    <span className="search-icon"><SearchIcon fontSize="small" /></span>
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Customers Table */}
            <div className="table-container">
                {filteredCustomers.length === 0 ? (
                    <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
                        <PeopleIcon sx={{ fontSize: 64, opacity: 0.1, mb: 2 }} />
                        <h3>No Customers Yet</h3>
                        <p style={{ color: 'var(--gray-500)' }}>Customers will appear here when they register on your store.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Email</th>
                                <th>Joined</th>
                                <th>Orders</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.user_id} onClick={() => handleCustomerClick(customer)} style={{ cursor: 'pointer' }} className="clickable-row">
                                    <td>
                                        <div className="customer-cell">
                                            <div className="avatar">{customer.name?.charAt(0)?.toUpperCase()}</div>
                                            <span>{customer.name}</span>
                                        </div>
                                    </td>
                                    <td>{customer.email}</td>
                                    <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                                    <td><span className="orders-badge">{customer.orders_count || 0} orders</span></td>
                                    <td>
                                        <span className={`status-badge ${customer.is_active ? 'active' : 'inactive'}`}>
                                            {customer.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Customer Details Modal */}
            {selectedCustomer && (
                <div className="customer-modal-overlay" onClick={closeModal}>
                    <div className="customer-modal" onClick={e => e.stopPropagation()}>
                        <div className="customer-modal-header">
                            <h2>{selectedCustomer.name}'s Details</h2>
                            <button className="close-btn" onClick={closeModal}>×</button>
                        </div>
                        
                        <div className="customer-details-grid">
                            <div className="detail-section">
                                <h3>Contact Info</h3>
                                <p><strong>Email:</strong> {selectedCustomer.email}</p>
                                <p><strong>Phone:</strong> {selectedCustomer.phone || 'Not provided'}</p>
                                <p><strong>Joined:</strong> {new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="detail-section">
                                <h3>Address</h3>
                                {customerOrders.length > 0 && customerOrders[0].shipping_address ? (
                                    <>
                                        <p>{customerOrders[0].shipping_address}</p>
                                        <p>{customerOrders[0].shipping_city}</p>
                                    </>
                                ) : (
                                    <p>No address on file (no orders yet).</p>
                                )}
                            </div>
                        </div>

                        <div className="customer-orders-section">
                            <h3>Order History ({customerOrders.length})</h3>
                            {loadingOrders ? (
                                <p>Loading orders...</p>
                            ) : customerOrders.length === 0 ? (
                                <p>This customer hasn't placed any orders.</p>
                            ) : (
                                <div className="customer-orders-list">
                                    {customerOrders.map(order => (
                                        <div key={order.order_id} className="customer-order-item">
                                            <div className="order-item-header">
                                                <strong>Order #{order.order_id}</strong>
                                                <span className={`status-badge ${order.order_status}`}>{order.order_status}</span>
                                            </div>
                                            <div className="order-item-details">
                                                <span>{new Date(order.order_date).toLocaleDateString()}</span>
                                                <span>Rs. {order.total_amount}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
