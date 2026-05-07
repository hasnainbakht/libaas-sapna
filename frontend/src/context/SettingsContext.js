import React, { createContext, useContext, useState, useEffect } from 'react';

// Default settings
const defaultSettings = {
    storeName: 'LIBAAS SAPNA',
    storeEmail: 'm.mesum1800@gmail.com',
    storePhone: process.env.REACT_APP_ADMIN_WHATSAPP_NUMBER || '',
    storeAddress: 'Gilgit, Pakistan',
    currency: 'PKR',
    taxRate: 0,
    shippingFee: 200,
    freeShippingThreshold: 3000,
    enableCOD: true,
    enableEasypaisa: true,
    enableJazzCash: true,
    enableBankTransfer: true,
    easypaisaNumber: '03209811587',
    jazzcashNumber: process.env.REACT_APP_ADMIN_WHATSAPP_NUMBER || '03554856598',
    lowStockAlert: 10,
    orderEmailNotifications: true,
};

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        // Load from localStorage on initial render
        const saved = localStorage.getItem('storeSettings');
        return saved ? JSON.parse(saved) : defaultSettings;
    });

    // Save to localStorage whenever settings change
    useEffect(() => {
        localStorage.setItem('storeSettings', JSON.stringify(settings));
    }, [settings]);

    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
        localStorage.removeItem('storeSettings');
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export default SettingsContext;
