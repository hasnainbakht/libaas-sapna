import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useSettings } from '../../context/SettingsContext';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';
import StoreIcon from '@mui/icons-material/Store';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PaymentIcon from '@mui/icons-material/Payment';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import './AdminPages.css';

const Settings = () => {
    const { settings: savedSettings, updateSettings } = useSettings();
    const [settings, setSettings] = useState(savedSettings);

    // Sync with context when it changes
    useEffect(() => {
        setSettings(savedSettings);
    }, [savedSettings]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = () => {
        updateSettings(settings);
        toast.success('Settings saved successfully! Changes will appear across the site.');
    };

    return (
        <div className="admin-page">
            <div className="page-header">
                <div className="header-left">
                    <h1><SettingsIcon sx={{ mr: 1, verticalAlign: 'bottom' }} /> Store Settings</h1>
                    <p>Configure your store preferences</p>
                </div>
                <button className="save-btn" onClick={handleSave} style={{ display: 'flex', alignItems: 'center' }}>
                    <SaveIcon sx={{ mr: 0.5, fontSize: 20 }} /> Save Changes
                </button>
            </div>

            <div className="settings-grid">
                {/* Store Information */}
                <div className="settings-card">
                    <h2 style={{ display: 'flex', alignItems: 'center' }}><StoreIcon sx={{ mr: 1, color: '#64748b' }} /> Store Information</h2>
                    <div className="settings-form">
                        <div className="form-group">
                            <label>Store Name</label>
                            <input
                                type="text"
                                name="storeName"
                                value={settings.storeName}
                                onChange={handleChange}
                            />
                            <small>This name will appear in the header and footer</small>
                        </div>
                        <div className="form-group">
                            <label>Contact Email</label>
                            <input
                                type="email"
                                name="storeEmail"
                                value={settings.storeEmail}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="text"
                                name="storePhone"
                                value={settings.storePhone}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Address</label>
                            <input
                                type="text"
                                name="storeAddress"
                                value={settings.storeAddress}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing Settings */}
                <div className="settings-card">
                    <h2 style={{ display: 'flex', alignItems: 'center' }}><AttachMoneyIcon sx={{ mr: 1, color: '#64748b' }} /> Pricing & Shipping</h2>
                    <div className="settings-form">
                        <div className="form-group">
                            <label>Currency</label>
                            <select name="currency" value={settings.currency} onChange={handleChange}>
                                <option value="PKR">PKR (Pakistani Rupee)</option>
                                <option value="USD">USD (US Dollar)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Tax Rate (%)</label>
                            <input
                                type="number"
                                name="taxRate"
                                value={settings.taxRate}
                                onChange={handleChange}
                                min="0"
                                max="100"
                            />
                        </div>
                        <div className="form-group">
                            <label>Shipping Fee (Rs.)</label>
                            <input
                                type="number"
                                name="shippingFee"
                                value={settings.shippingFee}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label>Free Shipping Threshold (Rs.)</label>
                            <input
                                type="number"
                                name="freeShippingThreshold"
                                value={settings.freeShippingThreshold}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="settings-card">
                    <h2 style={{ display: 'flex', alignItems: 'center' }}><PaymentIcon sx={{ mr: 1, color: '#64748b' }} /> Payment Methods</h2>
                    <div className="settings-form">
                        <div className="checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="enableCOD"
                                    checked={settings.enableCOD}
                                    onChange={handleChange}
                                />
                                <span className="checkmark"></span>
                                Cash on Delivery (COD)
                            </label>
                        </div>
                        <div className="checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="enableEasypaisa"
                                    checked={settings.enableEasypaisa}
                                    onChange={handleChange}
                                />
                                <span className="checkmark"></span>
                                Easypaisa
                            </label>
                        </div>
                        <div className="checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="enableJazzCash"
                                    checked={settings.enableJazzCash}
                                    onChange={handleChange}
                                />
                                <span className="checkmark"></span>
                                JazzCash
                            </label>
                        </div>
                        <div className="checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="enableBankTransfer"
                                    checked={settings.enableBankTransfer}
                                    onChange={handleChange}
                                />
                                <span className="checkmark"></span>
                                Bank Transfer
                            </label>
                        </div>
                        <hr style={{margin: '1rem 0', borderColor: '#eee'}} />
                        <div className="form-group">
                            <label>Easypaisa Account Number</label>
                            <input
                                type="text"
                                name="easypaisaNumber"
                                value={settings.easypaisaNumber || ''}
                                onChange={handleChange}
                                placeholder="e.g., 03209811587"
                            />
                            <small>Customers will send payments to this number</small>
                        </div>
                        <div className="form-group">
                            <label>JazzCash Account Number</label>
                            <input
                                type="text"
                                name="jazzcashNumber"
                                value={settings.jazzcashNumber || ''}
                                onChange={handleChange}
                                placeholder="e.g., 03554856598"
                            />
                            <small>Customers will send payments to this number</small>
                        </div>
                    </div>
                </div>

                {/* Inventory Settings */}
                <div className="settings-card">
                    <h2 style={{ display: 'flex', alignItems: 'center' }}><Inventory2Icon sx={{ mr: 1, color: '#64748b' }} /> Inventory & Notifications</h2>
                    <div className="settings-form">
                        <div className="form-group">
                            <label>Low Stock Alert Threshold</label>
                            <input
                                type="number"
                                name="lowStockAlert"
                                value={settings.lowStockAlert}
                                onChange={handleChange}
                                min="0"
                            />
                            <small>Alert when stock falls below this number</small>
                        </div>
                        <div className="checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="orderEmailNotifications"
                                    checked={settings.orderEmailNotifications}
                                    onChange={handleChange}
                                />
                                <span className="checkmark"></span>
                                Email notifications for new orders
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
