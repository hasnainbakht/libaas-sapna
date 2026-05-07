import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import AdminLayout from './components/AdminLayout/AdminLayout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminProductForm from './pages/admin/ProductForm';
import AdminOrders from './pages/admin/Orders';
import AdminCustomers from './pages/admin/Customers';
import AdminInventory from './pages/admin/Inventory';
import AdminAnalytics from './pages/admin/Analytics';
import AdminSettings from './pages/admin/Settings';
import OrderHistory from './pages/OrderHistory';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';

// Admin page wrapper component
const AdminPage = ({ children }) => (
  <AdminLayout>{children}</AdminLayout>
);

function App() {
  return (
    <Routes>
      {/* Public and Customer Routes with Main Layout */}
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/shop" element={<Layout><Shop /></Layout>} />
      <Route path="/product/:id" element={<Layout><ProductDetail /></Layout>} />
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/register" element={<Layout><Register /></Layout>} />
      <Route
        path="/cart"
        element={
          <Layout>
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/checkout"
        element={
          <Layout>
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/orders"
        element={
          <Layout>
            <ProtectedRoute>
              <OrderHistory />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/favorites"
        element={
          <Layout>
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/profile"
        element={
          <Layout>
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </Layout>
        }
      />

      {/* Admin Routes with Admin Layout */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute adminOnly>
            <AdminPage><AdminDashboard /></AdminPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute adminOnly>
            <AdminPage><AdminProducts /></AdminPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products/new"
        element={
          <ProtectedRoute adminOnly>
            <AdminPage><AdminProductForm /></AdminPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products/edit/:id"
        element={
          <ProtectedRoute adminOnly>
            <AdminPage><AdminProductForm /></AdminPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute adminOnly>
            <AdminPage><AdminOrders /></AdminPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/customers"
        element={
          <ProtectedRoute adminOnly>
            <AdminPage><AdminCustomers /></AdminPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/inventory"
        element={
          <ProtectedRoute adminOnly>
            <AdminPage><AdminInventory /></AdminPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute adminOnly>
            <AdminPage><AdminAnalytics /></AdminPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute adminOnly>
            <AdminPage><AdminSettings /></AdminPage>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;


