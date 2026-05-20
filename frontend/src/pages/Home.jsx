import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../services/api';
import { setCart } from '../store/slices/cartSlice';
import './Home.css';
import './Shop.css';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import MicIcon from '@mui/icons-material/Mic';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import stitchedImg from '../assets/branding/stitched.png';
import unstitchedImg from '../assets/branding/unstitched.webp';
import dupattasImg from '../assets/branding/dupattas.webp';
import accessoriesImg from '../assets/branding/accessories.png';

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false); // eslint-disable-line no-unused-vars
  const homeRef = useRef(null);

  // Scroll-reveal animation observer
  const setupScrollReveal = useCallback(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const el = homeRef.current;
    if (el) {
      el.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale').forEach((item) => {
        observer.observe(item);
      });
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const cleanup = setupScrollReveal();
    return cleanup;
  }, [setupScrollReveal, recommendations]);

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/cart/')
        .then((response) => {
          dispatch(setCart(response.data));
        })
        .catch((error) => {
          console.error('Error loading cart:', error);
        });
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      setLoadingRecs(true);
      api.get('/recommendations_users/?limit=8')
        .then((res) => {
          setRecommendations(res.data.results || []);
        })
        .catch((err) => {
          console.error("Error fetching recommendations:", err);
        })
        .finally(() => {
          setLoadingRecs(false);
        });
    }
  }, [isAuthenticated]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="home-enterprise" ref={homeRef}>
      {/* Hero Section */}
      <section className="hero-modern">
        <div className="hero-overlay"></div>
        <div className="container hero-container">
          <div className="hero-content-box">
            <div className="hero-badge-premium">
              <AutoFixHighIcon fontSize="small" sx={{ mr: 1 }} />
              <span>ADVANCED AI FASHION ENGINE</span>
            </div>
            <h1>The New Standard of <span className="text-gold">Elegance</span></h1>
            <p>Libaas Sapna combines traditional craftsmanship with cutting-edge AI to redefine your wardrobe experience.</p>

            <form onSubmit={handleSearch} className="hero-search-enterprise">
              <div className="search-wrapper-glass">
                <SearchIcon className="search-icon-glass" />
                <input
                  type="text"
                  placeholder="Search collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="search-btn-glass">
                  EXPLORE
                </button>
              </div>
            </form>

            <div className="hero-actions">
              <Link to="/shop" className="btn-enterprise-primary">
                VIEW COLLECTION
              </Link>
              <Link to="/new-arrivals" className="btn-enterprise-outline">
                NEW ARRIVALS
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Section */}
      {isAuthenticated && recommendations.length > 0 && (
        <section className="curated-section">
          <div className="container">
            <div className="section-header-modern scroll-reveal">
              <div className="header-left">
                <h2>Curated For You</h2>
              </div>
              <Link to="/shop" className="view-all-link">
                View More <ArrowForwardIcon fontSize="small" />
              </Link>
            </div>

            <div className="products-grid-modern">
              {recommendations.map((product) => (
                <Link key={product.id} to={`/product/${product.id}`} className="product-card-premium">
                  <div className="product-image-container">
                    <img
                      src={product.image || 'https://via.placeholder.com/400x500'}
                      alt={product.name}
                    />
                    <div className="product-actions-overlay">
                       <VisibilityIcon />
                    </div>
                    {product.recommendation_score && (
                      <div className="match-score">
                        {Math.min(100, Math.round((product.recommendation_score / 8) * 100))}% MATCH
                      </div>
                    )}
                  </div>
                  <div className="product-info-premium">
                    <span className="category-label">{product.category}</span>
                    <h3>{product.name}</h3>
                    <div className="price-tag">Rs. {product.price.toLocaleString()}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories Grid */}
      <section className="categories-enterprise">
        <div className="container">
          <div className="section-header-modern center scroll-reveal">
             <span className="subtitle">COLLECTIONS</span>
             <h2>Shop By Category</h2>
          </div>
          <div className="category-grid-master">
            <Link to="/shop?category=stitched" className="category-item scroll-reveal-scale stagger-1">
              <div className="category-bg" style={{ backgroundImage: `url(${stitchedImg})` }}></div>
              <div className="category-content-overlay">
                <h3>Stitched</h3>
                <span>EXPLORE COLLECTION</span>
              </div>
            </Link>
            <Link to="/shop?category=unstitched" className="category-item scroll-reveal-scale stagger-2">
              <div className="category-bg" style={{ backgroundImage: `url(${unstitchedImg})` }}></div>
              <div className="category-content-overlay">
                <h3>Unstitched</h3>
                <span>EXPLORE COLLECTION</span>
              </div>
            </Link>
            <Link to="/shop?category=dupatta" className="category-item scroll-reveal-scale stagger-3">
              <div className="category-bg" style={{ backgroundImage: `url(${dupattasImg})` }}></div>
              <div className="category-content-overlay">
                <h3>Dupattas</h3>
                <span>EXPLORE COLLECTION</span>
              </div>
            </Link>
            <Link to="/shop?category=accessories" className="category-item scroll-reveal-scale stagger-4">
              <div className="category-bg" style={{ backgroundImage: `url(${accessoriesImg})` }}></div>
              <div className="category-content-overlay">
                <h3>Accessories</h3>
                <span>EXPLORE COLLECTION</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="features-modern">
        <div className="container">
          <div className="features-grid-enterprise">
            <div className="feature-item scroll-reveal stagger-1">
              <div className="feature-icon-box"><MicIcon /></div>
              <h4>Voice Commands</h4>
              <p>State-of-the-art Urdu & English voice recognition for hands-free shopping.</p>
            </div>
            <div className="feature-item scroll-reveal stagger-2">
              <div className="feature-icon-box"><AutoFixHighIcon /></div>
              <h4>AI Styling</h4>
              <p>Neural networks that learn your preferences to provide better recommendations.</p>
            </div>
            <div className="feature-item scroll-reveal stagger-3">
              <div className="feature-icon-box"><LocalShippingIcon /></div>
              <h4>Elite Logistics</h4>
              <p>Priority white-glove delivery service across all major regions.</p>
            </div>
            <div className="feature-item scroll-reveal stagger-4">
              <div className="feature-icon-box"><CreditCardIcon /></div>
              <h4>Secure Assets</h4>
              <p>Multi-layered encryption for all financial transactions and data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Refined */}
      <section className="testimonials-modern">
        <div className="container">
          <div className="section-header-modern center scroll-reveal">
             <span className="subtitle">REVIEWS</span>
             <h2>The Client Perspective</h2>
          </div>
          <div className="testimonial-row">
            {[
              { name: "Ayesha Khan", city: "Lahore", text: "The voice search feature is revolutionary. Finding traditional wear has never been this intuitive." },
              { name: "Fatima Ali", city: "Karachi", text: "Exceptional fabric quality paired with a world-class digital experience. Simply unmatched." },
              { name: "Sara Ahmed", city: "Islamabad", text: "Libaas Sapna has set a new benchmark for Pakistani e-commerce. The AI picks are spot on." }
            ].map((t, idx) => (
              <div key={idx} className={`testimonial-card-premium scroll-reveal stagger-${idx + 1}`}>
                <ChatBubbleOutlineIcon className="quote-icon" />
                <p>"{t.text}"</p>
                <div className="author-info">
                  <strong>{t.name}</strong>
                  <span>{t.city}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta-enterprise scroll-reveal-scale">
        <div className="cta-content">
          <h2>Elevate Your Presence</h2>
          <p>Join the elite circle of Libaas Sapna customers today.</p>
          <Link to="/shop" className="btn-cta-gold">
            GET STARTED <ArrowForwardIcon sx={{ ml: 1 }} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;




