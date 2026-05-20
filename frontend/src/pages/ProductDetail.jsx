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
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarHalfIcon from '@mui/icons-material/StarHalf';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'One Size'];

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && id) {
      checkFavoriteStatus();
    }
  }, [isAuthenticated, id]);

  useEffect(() => {
    if (id) {
      fetchReviews();
    }
  }, [id]);

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

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/reviews/product/${id}`);
      setReviews(response.data.reviews || []);
      setReviewsTotal(response.data.total || 0);
      setAverageRating(response.data.average_rating || 0);

      // Check if current user already reviewed
      if (isAuthenticated && user) {
        const existing = (response.data.reviews || []).find(
          (r) => r.customer_id === user.user_id
        );
        if (existing) {
          setUserHasReviewed(true);
          setReviewRating(existing.rating);
          setReviewComment(existing.comment || '');
        }
      }
    } catch (error) {
      // Reviews fetch failed silently
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
    if (product.category !== 'unstitched' && product.sizes && product.sizes.length > 0 && !selectedSize) {
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
    // Unstitched: stock is in meters, 1 suit = 4 meters
    if (product?.category === 'unstitched') {
      return Math.floor((product?.stock_qty || 0) / 4);
    }
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

  // --- Review handlers ---
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = reviewImages.length + files.length;

    if (totalImages > 3) {
      toast.warning('Maximum 3 images allowed per review');
      return;
    }

    const validFiles = files.filter((f) => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
        toast.warning(`Invalid file type: ${f.name}`);
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.warning(`${f.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
    setReviewImages((prev) => [...prev, ...validFiles]);
    setReviewImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(reviewImagePreviews[index]);
    setReviewImages((prev) => prev.filter((_, i) => i !== index));
    setReviewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Please login to submit a review');
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (reviewRating === 0) {
      toast.warning('Please select a star rating');
      return;
    }

    setSubmittingReview(true);
    try {
      const formData = new FormData();
      formData.append('product_id', id);
      formData.append('rating', reviewRating);
      formData.append('comment', reviewComment);
      reviewImages.forEach((img) => {
        formData.append('images', img);
      });

      await api.post('/reviews/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(userHasReviewed ? 'Review updated!' : 'Review submitted!');
      setUserHasReviewed(true);
      setReviewImages([]);
      setReviewImagePreviews([]);
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating, size = 20) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(<StarIcon key={i} sx={{ fontSize: size, color: '#f59e0b' }} />);
      } else if (rating >= i - 0.5) {
        stars.push(<StarHalfIcon key={i} sx={{ fontSize: size, color: '#f59e0b' }} />);
      } else {
        stars.push(<StarBorderIcon key={i} sx={{ fontSize: size, color: '#d1d5db' }} />);
      }
    }
    return stars;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
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

             {product.category !== 'unstitched' && product.sizes && product.sizes.length > 0 && (
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

             {product.category === 'unstitched' && (
               <div className="selection-group-premium">
                  <div className="group-header">
                     <h3><StraightenIcon sx={{ fontSize: 18, mr: 1 }} /> FABRIC DETAILS</h3>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>
                    📐 Each suit requires <strong>4 meters</strong> of fabric.
                    {maxQuantity > 0
                      ? <> Currently <strong>{maxQuantity} suit{maxQuantity !== 1 ? 's' : ''}</strong> available.</>
                      : <strong style={{ color: '#dc2626' }}> Out of stock.</strong>
                    }
                  </p>
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

        {/* ===================== REVIEWS SECTION ===================== */}
        <div className="reviews-section-premium">
          <div className="reviews-header">
            <h2>CUSTOMER REVIEWS</h2>
            <div className="reviews-summary">
              <div className="reviews-avg-rating">
                <span className="avg-number">{averageRating.toFixed(1)}</span>
                <div className="avg-stars">{renderStars(averageRating, 24)}</div>
                <span className="reviews-count">Based on {reviewsTotal} review{reviewsTotal !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* Review Form */}
          <div className="review-form-section">
            <h3>{userHasReviewed ? 'UPDATE YOUR REVIEW' : 'WRITE A REVIEW'}</h3>
            {!isAuthenticated ? (
              <p className="review-login-prompt">
                <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}>
                  Sign in
                </Link>{' '}
                to leave a review
              </p>
            ) : (
              <form onSubmit={handleSubmitReview} className="review-form">
                <div className="review-rating-input">
                  <span className="rating-label">YOUR RATING</span>
                  <div className="star-input-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="star-input-btn"
                        onMouseEnter={() => setReviewHover(star)}
                        onMouseLeave={() => setReviewHover(0)}
                        onClick={() => setReviewRating(star)}
                      >
                        {star <= (reviewHover || reviewRating) ? (
                          <StarIcon sx={{ fontSize: 32, color: '#f59e0b' }} />
                        ) : (
                          <StarBorderIcon sx={{ fontSize: 32, color: '#d1d5db' }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="review-comment-input">
                  <label>YOUR REVIEW</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    rows={4}
                  />
                </div>

                <div className="review-images-input">
                  <label>ADD PHOTOS <span className="optional-label">(optional, up to 3)</span></label>
                  <div className="image-upload-area">
                    {reviewImagePreviews.map((preview, idx) => (
                      <div key={idx} className="upload-preview-thumb">
                        <img src={preview} alt={`Preview ${idx + 1}`} />
                        <button type="button" className="remove-preview-btn" onClick={() => removeImage(idx)}>
                          <CloseIcon sx={{ fontSize: 14 }} />
                        </button>
                      </div>
                    ))}
                    {reviewImages.length < 3 && (
                      <label className="upload-trigger">
                        <CameraAltIcon sx={{ fontSize: 24, color: '#94a3b8' }} />
                        <span>Add Photo</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          onChange={handleImageUpload}
                          hidden
                        />
                      </label>
                    )}
                  </div>
                </div>

                <button type="submit" className="submit-review-btn" disabled={submittingReview || reviewRating === 0}>
                  {submittingReview ? 'SUBMITTING...' : userHasReviewed ? 'UPDATE REVIEW' : 'SUBMIT REVIEW'}
                </button>
              </form>
            )}
          </div>

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review.review_id} className="review-card">
                  <div className="review-card-header">
                    <div className="reviewer-info">
                      <div className="reviewer-avatar">
                        <PersonIcon sx={{ fontSize: 20, color: '#94a3b8' }} />
                      </div>
                      <div>
                        <span className="reviewer-name">{review.customer_name}</span>
                        <span className="review-date">{formatDate(review.review_date)}</span>
                      </div>
                    </div>
                    <div className="review-stars">{renderStars(review.rating, 18)}</div>
                  </div>
                  {review.comment && <p className="review-comment">{review.comment}</p>}
                  {review.images && review.images.length > 0 && (
                    <div className="review-images-grid">
                      {review.images.map((img) => (
                        <div
                          key={img.id}
                          className="review-image-thumb"
                          onClick={() => setLightboxImage(img.image)}
                        >
                          <img src={img.image} alt="Review" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-reviews">
              <p>No reviews yet. Be the first to share your experience!</p>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div className="review-lightbox" onClick={() => setLightboxImage(null)}>
          <button className="lightbox-close" onClick={() => setLightboxImage(null)}>
            <CloseIcon sx={{ fontSize: 28 }} />
          </button>
          <img src={lightboxImage} alt="Review" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
