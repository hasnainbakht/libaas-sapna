import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import api from '../services/api';
import { setCart } from '../store/slices/cartSlice';
import { toast } from 'react-toastify';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import './Cart.css';

const Cart = () => {
  const { items, total } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await api.get('/cart/');
      dispatch(setCart({
        items: response.data.cart_items || [],
        total: response.data.total || 0
      }));
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const updateQuantity = async (cartId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await api.put(`/cart/${cartId}/`, { quantity: newQuantity });
      fetchCart();
    } catch (error) {
      toast.error('Error updating quantity');
    }
  };

  const removeItem = async (cartId) => {
    try {
      await api.delete(`/cart/${cartId}/remove/`);
      fetchCart();
      toast.success('Removed from bag');
    } catch (error) {
      toast.error('Error removing item');
    }
  };

  if (items.length === 0) {
    return (
      <div className="cart-enterprise empty">
        <div className="container">
           <ShoppingBagIcon sx={{ fontSize: 80, color: '#f1f5f9', mb: 3 }} />
           <h2>YOUR BAG IS EMPTY</h2>
           <p>Continue exploring our latest collections to find your perfect style.</p>
           <button onClick={() => navigate('/shop')} className="btn-shop-now">EXPLORE SHOP</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-enterprise">
      <div className="container">
        <div className="cart-header-master">
           <h1>SHOPPING BAG</h1>
           <span>{items.length} {items.length === 1 ? 'PIECE' : 'PIECES'}</span>
        </div>

        <div className="cart-grid-master">
          <div className="cart-items-master">
            {items.map((item) => (
              <div key={item.cart_id} className="cart-item-modern">
                <div className="item-image-box">
                  <img src={item.image || '/placeholder.png'} alt={item.product_name} />
                </div>
                <div className="item-info-box">
                  <div className="info-top">
                    <h3>{item.product_name}</h3>
                    <button className="remove-minimal" onClick={() => removeItem(item.cart_id)}>
                      <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                    </button>
                  </div>
                  <div className="info-meta">
                    {item.size && <span>SIZE: <strong>{item.size}</strong></span>}
                    <span>PRICE: <strong>Rs. {item.price.toLocaleString()}</strong></span>
                  </div>
                  <div className="info-bottom">
                    <div className="qty-pill-minimal">
                       <button onClick={() => updateQuantity(item.cart_id, item.quantity - 1)} disabled={item.quantity <= 1}><RemoveIcon sx={{ fontSize: 14 }} /></button>
                       <span>{item.quantity}</span>
                       <button onClick={() => updateQuantity(item.cart_id, item.quantity + 1)}><AddIcon sx={{ fontSize: 14 }} /></button>
                    </div>
                    <div className="item-subtotal-modern">Rs. {item.subtotal.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
            <button className="back-to-shop" onClick={() => navigate('/shop')}>
              <ArrowBackIcon sx={{ mr: 1, fontSize: 18 }} /> CONTINUE SHOPPING
            </button>
          </div>

          <aside className="cart-summary-master">
            <div className="summary-card-premium">
              <h3>ORDER SUMMARY</h3>
              <div className="summary-line">
                <span>SUBTOTAL</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>
              <div className="summary-line">
                <span>SHIPPING</span>
                <span className="free">COMPLIMENTARY</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-line total">
                <span>TOTAL</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>
              <button
                className="checkout-btn-master"
                onClick={() => navigate('/checkout')}
              >
                SECURE CHECKOUT
              </button>
              <p className="checkout-hint">VAT & Duties included in total price.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Cart;
