import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { toast } from 'react-toastify';
import './ProductDetail.css';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import VerifiedIcon from '@mui/icons-material/Verified';
import DescriptionIcon from '@mui/icons-material/Description';
import StraightenIcon from '@mui/icons-material/Straighten';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'One Size'];

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && id) {
      checkFavoriteStatus();
    }
  }, [isAuthenticated, id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${id}/`);
      setProduct(response.data);
    } catch (error) {
      toast.error('Product not found');
      navigate('/shop');
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const response = await api.get(`/products/wishlist/check/?product_id=${id}`);
      setIsFavorite(response.data.is_favorite);
    } catch (error) {
    }
  };

  const addToCart = async () => {
    if (!isAuthenticated) {
      toast.info('Please login to add items to cart');
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.warning('Please select a size');
      return;
    }
    try {
      await api.post('/cart/add/', {
        product_id: id,
        quantity: quantity,
        size: selectedSize || null,
      });
      toast.success('Product added to cart!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error adding to cart');
    }
  };

  const addToFavorites = async () => {
    if (!isAuthenticated) {
      toast.info('Please login to add items to favorites');
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    try {
      const response = await api.post('/products/wishlist/toggle/', { product_id: id });
      setIsFavorite(response.data.is_favorite);
      if (response.data.is_favorite) {
        toast.success('Added to favorites!');
      } else {
        toast.info('Removed from favorites');
      }
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  const getSortedSizes = () => {
    if (!product?.sizes) return [];
    return [...product.sizes].sort((a, b) => {
      const indexA = sizeOrder.indexOf(a.size);
      const indexB = sizeOrder.indexOf(b.size);
      const orderA = indexA === -1 ? 999 : indexA;
      const orderB = indexB === -1 ? 999 : indexB;
      return orderA - orderB;
    });
  };

  const getMaxQuantity = () => {
    if (selectedSize && product?.sizes) {
      const sizeObj = product.sizes.find(s => s.size === selectedSize);
      return sizeObj ? sizeObj.stock_qty : 0;
    }
    return product?.stock_qty || 0;
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    setQuantity(1);
  };

  if (loading) return <div className="loading-enterprise-box"><div className="loading-spinner"></div></div>;
  if (!product) return null;

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ url: 'https://via.placeholder.com/600x800?text=No+Image' }];

  const maxQuantity = getMaxQuantity();
  const isOutOfStock = product.stock_qty === 0 || (selectedSize && maxQuantity === 0);

  return (
    <div className="product-page-enterprise">
      <div className="container">
        <div className="product-breadcrumb-modern">
          <Link to="/">HOME</Link>
          <span className="sep">/</span>
          <Link to="/shop">COLLECTION</Link>
          <span className="sep">/</span>
          <span className="current">{product.name.toUpperCase()}</span>
        </div>

        <div className="product-master-layout">
          {/* Gallery Sidebar */}
          <div className="gallery-section-premium">
             <div className="thumbnail-track-premium">
                {images.map((img, idx) => (
                  <div 
                    key={idx} 
                    className={`thumb-box-premium ${selectedImage === idx ? 'active' : ''}`}
                    onClick={() => setSelectedImage(idx)}
                  >
                    <img src={img.url || img.image_url} alt="" />
                  </div>
                ))}
             </div>
             <div className="main-stage-premium">
                <img src={images[selectedImage]?.url || images[selectedImage]?.image_url} alt={product.name} />
                {images.length > 1 && (
                  <div className="gallery-nav-premium">
                    <button onClick={() => setSelectedImage((selectedImage - 1 + images.length) % images.length)}><ArrowBackIosNewIcon /></button>
                    <button onClick={() => setSelectedImage((selectedImage + 1) % images.length)}><ArrowForwardIosIcon /></button>
                  </div>
                )}
                {product.discount > 0 && <span className="discount-floating-badge">-{product.discount}%</span>}
             </div>
          </div>

          {/* Info Section */}
          <div className="info-section-premium">
             <div className="info-header-premium">
                <span className="premium-label">{product.category.toUpperCase()}</span>
                <h1>{product.name}</h1>
                {product.name_urdu && <h2 className="urdu-title-premium">{product.name_urdu}</h2>}
             </div>

             <div className="price-box-premium">
                <div className="current-price-premium">Rs. {(product.final_price || product.price).toLocaleString()}</div>
                {product.discount > 0 && (
                  <div className="original-price-premium">
                    <span>Rs. {product.price.toLocaleString()}</span>
                    <small>SAVE RS. {product.price - product.final_price}</small>
                  </div>
                )}
             </div>

             <div className="specs-grid-premium">
                <div className="spec-item-premium">
                   <span className="label">GENDER</span>
                   <span className="value">{product.gender.toUpperCase()}</span>
                </div>
                {product.fabric && (
                  <div className="spec-item-premium">
                    <span className="label">FABRIC</span>
                    <span className="value">{product.fabric.toUpperCase()}</span>
                  </div>
                )}
                {product.color && (
                  <div className="spec-item-premium">
                    <span className="label">COLOR</span>
                    <span className="value">{product.color.toUpperCase()}</span>
                  </div>
                )}
             </div>

             <div className="description-premium">
                <h3><DescriptionIcon sx={{ fontSize: 18, mr: 1 }} /> THE DETAILS</h3>
                <p>{product.description}</p>
             </div>

             {product.sizes && product.sizes.length > 0 && (
               <div className="selection-group-premium">
                  <div className="group-header">
                     <h3><StraightenIcon sx={{ fontSize: 18, mr: 1 }} /> SELECT SIZE</h3>
                     <button className="size-guide-btn">SIZE GUIDE</button>
                  </div>
                  <div className="size-grid-premium">
                     {getSortedSizes().map((size) => (
                       <button
                         key={size.size_id}
                         className={`size-pill-premium ${selectedSize === size.size ? 'selected' : ''} ${size.is_out_of_stock ? 'disabled' : ''}`}
                         onClick={() => handleSizeSelect(size.size)}
                         disabled={size.is_out_of_stock}
                       >
                         {size.size}
                       </button>
                     ))}
                  </div>
               </div>
             )}

             <div className="selection-group-premium">
                <h3>QUANTITY</h3>
                <div className="qty-selector-premium">
                   <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>-</button>
                   <span>{quantity}</span>
                   <button onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))} disabled={quantity >= maxQuantity}>+</button>
                </div>
             </div>

             <div className="cta-group-premium">
                <button 
                  className="add-to-cart-master" 
                  onClick={addToCart} 
                  disabled={isOutOfStock}
                >
                   {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO BAG'}
                </button>
                <button className={`wishlist-btn-premium ${isFavorite ? 'active' : ''}`} onClick={addToFavorites}>
                   {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </button>
             </div>

             <div className="trust-badges-premium">
                <div className="trust-item">
                   <LocalShippingIcon />
                   <span>Complimentary Shipping</span>
                </div>
                <div className="trust-item">
                   <AssignmentReturnIcon />
                   <span>7-Day Returns</span>
                </div>
                <div className="trust-item">
                   <VerifiedIcon />
                   <span>Authenticity Guaranteed</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
