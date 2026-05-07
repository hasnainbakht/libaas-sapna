import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import './AdminPages.css';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products/');
            setProducts(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStock = async (productId, newStock) => {
        try {
            await api.patch(`/products/${productId}/update_stock/`, { stock_qty: newStock });
            toast.success('Stock updated successfully');
            fetchProducts();
        } catch (error) {
            toast.error('Error updating stock');
        }
    };

    const getFilteredProducts = () => {
        switch (filter) {
            case 'low':
                return products.filter(p => p.stock_qty > 0 && p.stock_qty <= (p.low_stock_threshold || 5));
            case 'out':
                return products.filter(p => p.stock_qty === 0);
            case 'in':
                return products.filter(p => p.stock_qty > (p.low_stock_threshold || 5));
            default:
                return products;
        }
    };

    const filteredProducts = getFilteredProducts();
    const totalStock = products.reduce((sum, p) => sum + p.stock_qty, 0);
    const lowStockCount = products.filter(p => p.stock_qty > 0 && p.stock_qty <= (p.low_stock_threshold || 5)).length;
    const outOfStockCount = products.filter(p => p.stock_qty === 0).length;

    if (loading) return <div className="loading">Loading inventory...</div>;

    return (
        <div className="admin-page">
            <div className="page-header">
                <div className="header-left">
                    <h1><Inventory2Icon sx={{ mr: 1, verticalAlign: 'bottom' }} /> Inventory Management</h1>
                    <p>Monitor and update your stock levels</p>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-row">
                <div className="stat-card" onClick={() => setFilter('all')} style={{ cursor: 'pointer' }}>
                    <span className="stat-icon"><Inventory2Icon /></span>
                    <div className="stat-info">
                        <span className="stat-value">{products.length}</span>
                        <span className="stat-label">Total Products</span>
                    </div>
                </div>
                <div className="stat-card success" onClick={() => setFilter('in')} style={{ cursor: 'pointer' }}>
                    <span className="stat-icon"><CheckCircleIcon /></span>
                    <div className="stat-info">
                        <span className="stat-value">{totalStock}</span>
                        <span className="stat-label">Total Stock Units</span>
                    </div>
                </div>
                <div className="stat-card warning" onClick={() => setFilter('low')} style={{ cursor: 'pointer' }}>
                    <span className="stat-icon"><WarningAmberIcon /></span>
                    <div className="stat-info">
                        <span className="stat-value">{lowStockCount}</span>
                        <span className="stat-label">Low Stock</span>
                    </div>
                </div>
                <div className="stat-card danger" onClick={() => setFilter('out')} style={{ cursor: 'pointer' }}>
                    <span className="stat-icon"><CancelIcon /></span>
                    <div className="stat-info">
                        <span className="stat-value">{outOfStockCount}</span>
                        <span className="stat-label">Out of Stock</span>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                    All Products
                </button>
                <button className={`tab ${filter === 'low' ? 'active' : ''}`} onClick={() => setFilter('low')} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <WarningAmberIcon fontSize="small" /> Low Stock
                </button>
                <button className={`tab ${filter === 'out' ? 'active' : ''}`} onClick={() => setFilter('out')} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CancelIcon fontSize="small" /> Out of Stock
                </button>
            </div>

            {/* Inventory Table */}
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>Category</th>
                            <th>Current Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((product) => (
                            <tr key={product.product_id}>
                                <td>
                                    <div className="product-cell">
                                        <img
                                            src={product.images?.[0]?.url || product.images?.[0]?.image_url || 'https://via.placeholder.com/40'}
                                            alt={product.name}
                                            className="product-thumb"
                                        />
                                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{product.name}</span>
                                    </div>
                                </td>
                                <td><span className="sku-badge">{product.sku || 'N/A'}</span></td>
                                <td>{product.category}</td>
                                <td>
                                    <div className="stock-input">
                                        <input
                                            type="number"
                                            defaultValue={product.stock_qty}
                                            min="0"
                                            style={{
                                                padding: '0.4rem',
                                                borderRadius: '4px',
                                                border: '1px solid #cbd5e1',
                                                background: '#ffffff',
                                                fontSize: '0.85rem',
                                                color: '#334155'
                                            }}
                                            onBlur={(e) => {
                                                const newValue = parseInt(e.target.value);
                                                if (newValue !== product.stock_qty) {
                                                    updateStock(product.product_id, newValue);
                                                }
                                            }}
                                        />
                                        <span>units</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${product.stock_qty === 0 ? 'out-of-stock' :
                                            product.stock_qty <= (product.low_stock_threshold || 5) ? 'low-stock' : 'in-stock'
                                        }`}>
                                        {product.stock_qty === 0 ? 'Out of Stock' :
                                            product.stock_qty <= (product.low_stock_threshold || 5) ? 'Low Stock' : 'In Stock'}
                                    </span>
                                </td>
                                <td>
                                    <Link to={`/admin/products/edit/${product.product_id}`} className="btn-action edit" style={{ display: 'flex', alignItems: 'center' }}>
                                        <EditIcon sx={{ fontSize: 16, mr: 0.5 }} /> Edit
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Inventory;
