import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import InboxIcon from '@mui/icons-material/Inbox';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import './AdminPages.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    fetchProducts();
    // Real-time refresh every 30 seconds
    const interval = setInterval(fetchProducts, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStockTooltip = (p) => {
    if (!p.sizes || p.sizes.length === 0) return `Total: ${p.stock_qty}`;
    return p.sizes.map(s => `${s.size}: ${s.stock_qty}`).join('\n');
  };

  const getStatusText = (p) => {
    if (isOutOfStock(p)) {
      const oosSizes = p.sizes?.filter(s => s.stock_qty === 0).map(s => s.size);
      if (oosSizes?.length > 0 && oosSizes.length < p.sizes.length) {
        return `OOS: ${oosSizes.join(', ')}`;
      }
      return 'Out of Stock';
    }
    if (isLowStock(p)) {
      const lowSizes = p.sizes?.filter(s => s.stock_qty > 0 && s.stock_qty <= (p.low_stock_threshold || 10)).map(s => s.size);
      if (lowSizes?.length > 0) {
        return `Low: ${lowSizes.join(', ')}`;
      }
      return 'Low Stock';
    }
    return 'In Stock';
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products/');
      setProducts(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) return;

    try {
      await api.delete(`/products/${productId}/`);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        (typeof error.response?.data === 'string' ? error.response.data : null) ||
        'Error deleting product';
      toast.error(msg);
      console.error('Delete error:', error.response?.data || error);
    }
  };

  const isLowStock = (p) => {
    if (!p.sizes || p.sizes.length === 0) {
      return p.stock_qty > 0 && p.stock_qty <= (p.low_stock_threshold || 10);
    }
    return p.sizes.some(s => s.stock_qty > 0 && s.stock_qty <= (p.low_stock_threshold || 10));
  };

  const isOutOfStock = (p) => {
    if (!p.sizes || p.sizes.length === 0) {
      return p.stock_qty === 0;
    }
    return p.sizes.some(s => s.stock_qty === 0);
  };

  const isInStock = (p) => {
    if (!p.sizes || p.sizes.length === 0) {
      return p.stock_qty > (p.low_stock_threshold || 10);
    }
    return p.sizes.every(s => s.stock_qty > (p.low_stock_threshold || 10));
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || product.category === filterCategory;
    const matchesStock = stockFilter === 'all' || 
      (stockFilter === 'in' && isInStock(product)) ||
      (stockFilter === 'low' && isLowStock(product)) ||
      (stockFilter === 'out' && isOutOfStock(product));
    return matchesSearch && matchesCategory && matchesStock;
  });

  const totalProducts = products.length;
  const inStock = products.filter(isInStock).length;
  const lowStock = products.filter(isLowStock).length;
  const outOfStock = products.filter(isOutOfStock).length;

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1><Inventory2Icon sx={{ mr: 1, verticalAlign: 'bottom' }} /> Product Management</h1>
          <p>Manage your inventory and product listings</p>
        </div>
        <Link to="/admin/products/new" className="save-btn" style={{ textDecoration: 'none' }}>
          <AddIcon sx={{ mr: 0.5 }} /> Add New Product
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className={`stat-card${stockFilter === 'all' ? ' active' : ''}`} onClick={() => setStockFilter('all')} style={{cursor:'pointer'}}>
          <span className="stat-icon"><Inventory2Icon /></span>
          <div className="stat-info">
            <span className="stat-value">{totalProducts}</span>
            <span className="stat-label">Total Products</span>
          </div>
        </div>
        <div className={`stat-card success${stockFilter === 'in' ? ' active' : ''}`} onClick={() => setStockFilter('in')} style={{cursor:'pointer'}}>
          <span className="stat-icon"><CheckCircleIcon /></span>
          <div className="stat-info">
            <span className="stat-value">{inStock}</span>
            <span className="stat-label">In Stock</span>
          </div>
        </div>
        <div className={`stat-card warning${stockFilter === 'low' ? ' active' : ''}`} onClick={() => setStockFilter('low')} style={{cursor:'pointer'}}>
          <span className="stat-icon"><WarningAmberIcon /></span>
          <div className="stat-info">
            <span className="stat-value">{lowStock}</span>
            <span className="stat-label">Low Stock</span>
          </div>
        </div>
        <div className={`stat-card danger${stockFilter === 'out' ? ' active' : ''}`} onClick={() => setStockFilter('out')} style={{cursor:'pointer'}}>
          <span className="stat-icon"><CancelIcon /></span>
          <div className="stat-info">
            <span className="stat-value">{outOfStock}</span>
            <span className="stat-label">Out of Stock</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <SearchIcon className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="period-select"
        >
          <option value="">All Categories</option>
          <option value="stitched">Stitched</option>
          <option value="unstitched">Unstitched</option>
          <option value="dupatta">Dupatta</option>
          <option value="accessories">Accessories</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="table-container">
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <InboxIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 2 }} />
            <h3>No products found</h3>
            <p>Try adjusting your search or add a new product</p>
            <Link to="/admin/products/new" className="save-btn" style={{ mt: 2, textDecoration: 'none' }}>
              <AddIcon sx={{ mr: 0.5 }} /> Add First Product
            </Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
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
                        src={product.images?.[0]?.url || product.images?.[0]?.image_url || 'https://via.placeholder.com/60x60?text=No+Image'}
                        alt={product.name}
                        className="product-thumb"
                      />
                      <div className="product-info" style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="product-name" style={{ fontWeight: 600, color: '#1e293b' }}>{product.name}</span>
                        {product.name_urdu && <span className="product-urdu" style={{ fontSize: '0.8rem', color: '#64748b' }}>{product.name_urdu}</span>}
                      </div>
                    </div>
                  </td>
                  <td><span className="sku-badge">{product.sku || 'N/A'}</span></td>
                  <td><span className="category-badge" style={{ fontSize: '0.85rem', color: '#475569' }}>{product.category}</span></td>
                  <td>
                    <div className="price-cell" style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="current-price" style={{ fontWeight: 600 }}>Rs. {product.price}</span>
                      {product.discount > 0 && (
                        <span className="discount-tag" style={{ fontSize: '0.75rem', color: '#10b981' }}>-{product.discount}%</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="stock-qty" title={getStockTooltip(product)} style={{ fontWeight: 600 }}>
                      {product.stock_qty}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${isOutOfStock(product) ? 'out-of-stock' :
                        isLowStock(product) ? 'low-stock' : 'in-stock'
                      }`}>
                      {getStatusText(product)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link to={`/admin/products/edit/${product.product_id}`} className="btn-action edit" style={{ display: 'flex', alignItems: 'center' }}>
                        <EditIcon sx={{ fontSize: 16, mr: 0.5 }} /> Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.product_id, product.name)}
                        className="btn-action delete"
                        style={{ display: 'flex', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', cursor: 'pointer' }}
                      >
                        <DeleteIcon sx={{ fontSize: 16, mr: 0.5 }} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Products;



