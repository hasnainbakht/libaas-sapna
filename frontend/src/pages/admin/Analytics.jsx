import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    BarChart, Bar, PieChart, Pie, Cell, Legend,
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PieChartIcon from '@mui/icons-material/PieChart';
import './AdminPages.css';

const COLORS = ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'];

const Analytics = () => {
    const [data, setData] = useState({
        total_sales: 0,
        total_orders: 0,
        total_items_sold: 0,
        top_products: [],
        sales_by_category: []
    });
    const [period, setPeriod] = useState('monthly');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        try {
            const response = await api.get(`/analytics/dashboard?period=${period}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setData({
                total_sales: 0,
                total_orders: 0,
                total_items_sold: 0,
                avg_order_value: 0,
                top_products: [],
                sales_by_category: []
            });
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => `Rs. ${value.toLocaleString()}`;

    if (loading) return <div className="loading">Loading analytics...</div>;

    return (
        <div className="admin-page">
            <div className="page-header">
                <div className="header-left">
                    <h1><TrendingUpIcon sx={{ mr: 1 }} /> Sales Analytics</h1>
                    <p>Track your business performance and revenue generation</p>
                </div>
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

            {/* Main Stats */}
            <div className="stats-row">
                <div className="stat-card large">
                    <AttachMoneyIcon className="stat-icon" />
                    <div className="stat-info">
                        <span className="stat-value">Rs. {data.total_sales?.toLocaleString()}</span>
                        <span className="stat-label">Total Revenue</span>
                    </div>
                </div>
                <div className="stat-card large success">
                    <Inventory2Icon className="stat-icon" />
                    <div className="stat-info">
                        <span className="stat-value">{data.total_orders}</span>
                        <span className="stat-label">Total Orders</span>
                    </div>
                </div>
                <div className="stat-card large">
                    <ShoppingCartIcon className="stat-icon" />
                    <div className="stat-info">
                        <span className="stat-value">{data.total_items_sold}</span>
                        <span className="stat-label">Items Sold</span>
                    </div>
                </div>
                <div className="stat-card large warning">
                    <AccountBalanceWalletIcon className="stat-icon" />
                    <div className="stat-info">
                        <span className="stat-value">Rs. {(data.avg_order_value || (data.total_orders > 0 ? Math.round(data.total_sales / data.total_orders) : 0))?.toLocaleString()}</span>
                        <span className="stat-label">Avg. Order Value</span>
                    </div>
                </div>
            </div>

            {/* Analytics Grid */}
            <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Top Products */}
                <div className="table-container" style={{ margin: 0, padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', color: '#1e293b' }}>
                        <EmojiEventsIcon sx={{ mr: 1, color: '#64748b' }} /> Top Selling Products
                    </h2>
                    <div style={{ height: 350 }}>
                        {data.top_products?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.top_products} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                    <XAxis type="number" tickFormatter={(tick) => `Rs. ${tick}`} stroke="#94a3b8" />
                                    <YAxis type="category" dataKey="product_name" width={120} tick={{fontSize: 12, fill: '#475569'}} />
                                    <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                                    <Bar dataKey="revenue" fill="#1e293b" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="empty-state">
                                No sales data available for this period.
                            </div>
                        )}
                    </div>
                </div>

                {/* Sales by Category */}
                <div className="table-container" style={{ margin: 0, padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', color: '#1e293b' }}>
                        <PieChartIcon sx={{ mr: 1, color: '#64748b' }} /> Sales by Category
                    </h2>
                    <div style={{ height: 350 }}>
                        {data.sales_by_category?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.sales_by_category}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={2}
                                        dataKey="revenue"
                                        nameKey="category"
                                    >
                                        {data.sales_by_category.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: '#475569' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="empty-state">
                                No category data available.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
