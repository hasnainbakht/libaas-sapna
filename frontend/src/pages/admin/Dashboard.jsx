import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import './Dashboard.css';

const COLORS = ['#1a1a1a', '#404040', '#737373', '#a6a6a6', '#d9d9d9'];

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    total_sales: 0,
    total_orders: 0,
    total_items_sold: 0,
    low_stock_items: [],
    top_products: [],
    recent_orders: [],
    sales_trend: [],
    sales_by_category: []
  });
  const [period, setPeriod] = useState('weekly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, [period]);

  const fetchDashboard = async () => {
    try {
      const response = await api.get(`/analytics/dashboard?period=${period}`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setDashboardData({
        total_sales: 0,
        total_orders: 0,
        total_items_sold: 0,
        low_stock_items: [],
        top_products: [],
        recent_orders: [],
        sales_trend: [],
        sales_by_category: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => `Rs. ${value.toLocaleString()}`;

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1><DashboardIcon sx={{ mr: 1, verticalAlign: 'bottom' }} /> Overview</h1>
          <p>Enterprise Analytics & Store Performance</p>
        </div>
        <div className="header-right">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="period-select"
          >
            <option value="daily">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon"><MonetizationOnIcon /></div>
          <div className="kpi-content">
            <span className="kpi-label">Total Revenue</span>
            <span className="kpi-value">Rs. {dashboardData.total_sales?.toLocaleString()}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><ShoppingBagIcon /></div>
          <div className="kpi-content">
            <span className="kpi-label">Total Orders</span>
            <span className="kpi-value">{dashboardData.total_orders}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><ShoppingCartIcon /></div>
          <div className="kpi-content">
            <span className="kpi-label">Items Sold</span>
            <span className="kpi-value">{dashboardData.total_items_sold}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: dashboardData.low_stock_items?.length > 0 ? '#d32f2f' : 'inherit' }}>
            <WarningIcon />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Low Stock Alerts</span>
            <span className="kpi-value">{dashboardData.low_stock_items?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Revenue Trend Area Chart */}
        <div className="chart-card full-width">
          <h2>Revenue Trend</h2>
          <div className="chart-container" style={{ height: 300 }}>
            {dashboardData.sales_trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData.sales_trend}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1a1a1a" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="sale_date" tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} />
                  <YAxis tickFormatter={(tick) => `Rs. ${tick}`} width={80} />
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} labelFormatter={(label) => new Date(label).toLocaleDateString()} />
                  <Area type="monotone" dataKey="sales" stroke="#1a1a1a" fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">No revenue data available for this period.</div>
            )}
          </div>
        </div>

        {/* Top Products Bar Chart */}
        <div className="chart-card">
          <h2>Top Selling Products</h2>
          <div className="chart-container" style={{ height: 300 }}>
            {dashboardData.top_products?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.top_products} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(tick) => `Rs. ${tick}`} />
                  <YAxis type="category" dataKey="product_name" width={120} tick={{fontSize: 12}} />
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#1a1a1a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">No product data available.</div>
            )}
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="chart-card">
          <h2>Revenue by Category</h2>
          <div className="chart-container" style={{ height: 300 }}>
            {dashboardData.sales_by_category?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.sales_by_category}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="revenue"
                    nameKey="category"
                  >
                    {dashboardData.sales_by_category.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">No category data available.</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid (Alerts & Orders) */}
      <div className="dashboard-grid">
        {/* Low Stock Alerts */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Inventory Alerts</h2>
            <Link to="/admin/inventory" className="view-all">Manage Inventory</Link>
          </div>
          <div className="card-content">
            {dashboardData.low_stock_items?.length > 0 ? (
              <div className="alert-list">
                {dashboardData.low_stock_items.map((item) => (
                  <div key={item.product_id} className="alert-item">
                    <div className="alert-info">
                      <span className="alert-name">{item.name}</span>
                      <span className="alert-stock">
                        Stock: {item.stock_qty} (Min: {item.low_stock_threshold})
                      </span>
                    </div>
                    <Link to={`/admin/products/edit/${item.product_id}`} className="restock-btn">
                      Restock
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state success">
                <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#2e7d32' }} /> Inventory levels are optimal.
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Recent Orders</h2>
            <Link to="/admin/orders" className="view-all">All Orders</Link>
          </div>
          <div className="activity-feed">
            {dashboardData.recent_orders?.length > 0 ? (
              dashboardData.recent_orders.slice(0, 5).map((order, index) => (
                <div key={order.order_id || index} className="activity-item">
                  <span className="activity-icon"><ShoppingCartIcon fontSize="small" /></span>
                  <div className="activity-content">
                    <span className="activity-text">
                      Order #{order.order_id} - Rs. {order.total_amount?.toLocaleString()}
                    </span>
                    <span className="activity-time">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Recently'} • {order.order_status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                No recent orders found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;



