import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PeopleIcon from '@mui/icons-material/People';
import StoreIcon from '@mui/icons-material/Store';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
    const location = useLocation();

    const menuItems = [
        { path: '/admin/dashboard', icon: <DashboardIcon fontSize="small" />, label: 'Dashboard' },
        { path: '/admin/products', icon: <CheckroomIcon fontSize="small" />, label: 'Products' },
        { path: '/admin/orders', icon: <ShoppingBagIcon fontSize="small" />, label: 'Orders' },
        { path: '/admin/customers', icon: <PeopleIcon fontSize="small" />, label: 'Customers' },
        { path: '/admin/inventory', icon: <StoreIcon fontSize="small" />, label: 'Inventory' },
        { path: '/admin/analytics', icon: <TrendingUpIcon fontSize="small" />, label: 'Analytics' },
        { path: '/admin/settings', icon: <SettingsIcon fontSize="small" />, label: 'Settings' },
    ];

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <div className="logo-section">
                        <ShoppingBagIcon className="text-gold" />
                        <h2>LIBAAS SAPNA</h2>
                    </div>
                    <span>Admin Panel</span>
                </div>
                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `nav-item ${isActive ? 'active' : ''}`
                            }
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <NavLink to="/" className="back-to-store">
                        <ArrowBackIcon fontSize="small" sx={{ mr: 1 }} /> Back to Store
                    </NavLink>
                </div>
            </aside>
            <main className="admin-main">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
