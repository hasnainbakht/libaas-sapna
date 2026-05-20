import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './NewArrivals.css';
import './Shop.css';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const NewArrivals = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const pageRef = useRef(null);

  const setupScrollReveal = useCallback(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    const el = pageRef.current;
    if (el) {
      el.querySelectorAll('.scroll-reveal, .scroll-reveal-scale').forEach((item) => {
        observer.observe(item);
      });
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetchNewArrivals();
  }, []);

  useEffect(() => {
    if (!loading) {
      const cleanup = setupScrollReveal();
      return cleanup;
    }
  }, [loading, setupScrollReveal]);

  const fetchNewArrivals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products/new_arrivals/');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching new arrivals:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <div className="new-arrivals-page" ref={pageRef}>
      {/* Hero Banner */}
      <section className="new-arrivals-hero">
        <div className="new-arrivals-hero-overlay"></div>
        <div className="container new-arrivals-hero-content">
          <div className="new-arrivals-badge">
            <FiberNewIcon fontSize="small" />
            <span>FRESH COLLECTION</span>
          </div>
          <h1><span style={{ color: '#ffffff' }}>New</span> <span className="text-gold">Arrivals</span></h1>
          <p>Discover the latest additions to our collection — added within the last 7 days.</p>
        </div>
      </section>

      {/* Products Section */}
      <section className="new-arrivals-body">
        <div className="container">
          <div className="new-arrivals-count-bar">
            <div className="count-info">
              <AccessTimeIcon sx={{ fontSize: 18, mr: 0.5 }} />
              <span>
                {loading ? 'Loading...' : `${products.length} new ${products.length === 1 ? 'piece' : 'pieces'} in the last 7 days`}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="shop-loading-enterprise">
              <div className="loading-orb-pulsar"></div>
              <p>Discovering new arrivals...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="no-arrivals-state">
              <FiberNewIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
              <h3>No new arrivals this week</h3>
              <p>Check back soon — we add new pieces regularly!</p>
              <Link to="/shop" className="btn-browse-all">BROWSE ALL COLLECTIONS</Link>
            </div>
          ) : (
            <div className="products-grid-premium">
              {products.map((product, idx) => (
                <Link
                  key={product.product_id}
                  to={`/product/${product.product_id}`}
                  className={`product-card-premium scroll-reveal stagger-${Math.min(idx + 1, 8)}`}
                  style={{ transitionDelay: `${Math.min(idx, 7) * 0.1}s` }}
                >
                  <div className="product-image-container">
                    <img
                      src={product.images?.[0]?.url || product.images?.[0]?.image || 'https://via.placeholder.com/400x500'}
                      alt={product.name}
                    />
                    <span className="new-badge-tag">NEW</span>
                    {product.discount > 0 && <span className="discount-badge-premium">{product.discount}% OFF</span>}
                    <div className="overlay-view"><VisibilityIcon /></div>
                    <div className="arrival-time-tag">
                      <AccessTimeIcon sx={{ fontSize: 12 }} />
                      <span>{formatDate(product.created_at)}</span>
                    </div>
                  </div>
                  <div className="product-info-premium">
                    <span className="category-label">{product.category}</span>
                    <h3>{product.name}</h3>
                    <div className="price-row">
                      <span className="current-price">Rs. {(product.final_price || product.price).toLocaleString()}</span>
                      {product.discount > 0 && <span className="old-price">Rs. {product.price.toLocaleString()}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default NewArrivals;
