import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Favorites.css';

const Favorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            const response = await api.get('/products/wishlist/');
            // Handle both paginated and non-paginated responses
            const data = response.data.results || response.data;
            setFavorites(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching favorites:', error);
            toast.error('Failed to load favorites');
            setFavorites([]);
        } finally {
            setLoading(false);
        }
    };

    const removeFromFavorites = async (productId) => {
        try {
            await api.post('/products/wishlist/toggle/', { product_id: productId });
            setFavorites(favorites.filter(item => item.product.product_id !== productId));
            toast.success('Removed from favorites');
        } catch (error) {
            toast.error('Failed to remove from favorites');
        }
    };

    if (loading) {
        return (
            <div className="favorites-page">
                <div className="favorites-container">
                    <div className="loading">Loading your favorites...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="favorites-page">
            <div className="favorites-header">
                <h1>❤️ My Favorites</h1>
                <p>Your saved items for later</p>
            </div>

            <div className="favorites-container">
                {favorites.length === 0 ? (
                    <div className="empty-favorites">
                        <span className="empty-icon">💔</span>
                        <h2>No favorites yet</h2>
                        <p>Start adding items to your favorites by clicking the heart icon on products!</p>
                        <Link to="/shop" className="btn-shop">
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="favorites-grid">
                        {favorites.map((item) => (
                            <div key={item.wishlist_id} className="favorite-card">
                                <Link to={`/product/${item.product.product_id}`} className="product-link">
                                    <div className="product-image">
                                        {item.product.images && item.product.images.length > 0 ? (
                                            <img
                                                src={item.product.images[0].url || item.product.images[0].image_url}
                                                alt={item.product.name}
                                            />
                                        ) : (
                                            <div className="no-image">No Image</div>
                                        )}
                                        {item.product.discount > 0 && (
                                            <span className="discount-badge">{item.product.discount}% OFF</span>
                                        )}
                                    </div>
                                    <div className="product-details">
                                        <span className="category-badge">{item.product.category}</span>
                                        <h3>{item.product.name}</h3>
                                        <div className="price-row">
                                            <span className="current-price">Rs. {item.product.final_price}</span>
                                            {item.product.discount > 0 && (
                                                <span className="original-price">Rs. {item.product.price}</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                                <button
                                    className="remove-btn"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        removeFromFavorites(item.product.product_id);
                                    }}
                                >
                                    🗑️ Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Favorites;
