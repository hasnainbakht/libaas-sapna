import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import ImageIcon from '@mui/icons-material/Image';
import './ProductForm.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        name_urdu: '',
        description: '',
        category: 'stitched',
        subcategory: '',
        gender: 'female',
        fabric: '',
        color: '',
        price: '',
        discount: 0,
        stock_qty: 0,
        low_stock_threshold: 10,
        images: [{ image_url: '', is_primary: true, preview: null, file: null }],
        sizes: [{ size: 'S', stock_qty: 0 }],
    });

    useEffect(() => {
        if (isEditMode) {
            fetchProduct();
        }
    }, [id]);

    const fetchProduct = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/products/${id}/`);
            const product = response.data;
            setFormData({
                sku: product.sku || '',
                name: product.name || '',
                name_urdu: product.name_urdu || '',
                description: product.description || '',
                category: product.category || 'stitched',
                subcategory: product.subcategory || '',
                gender: product.gender || 'female',
                fabric: product.fabric || '',
                color: product.color || '',
                price: product.price || '',
                discount: product.discount || 0,
                stock_qty: product.stock_qty || 0,
                low_stock_threshold: product.low_stock_threshold || 10,
                images: product.images?.length > 0
                    ? product.images.map(img => ({
                        image_url: img.url || img.image_url,
                        is_primary: img.is_primary,
                        preview: img.url || img.image_url,
                        file: null
                    }))
                    : [{ image_url: '', is_primary: true, preview: null, file: null }],
                sizes: product.sizes?.length > 0
                    ? product.sizes.map(s => ({ size: s.size, stock_qty: s.stock_qty }))
                    : [{ size: 'S', stock_qty: 0 }],
            });
        } catch (error) {
            toast.error('Error fetching product');
            navigate('/admin/products');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (index, file) => {
        if (!file) return;

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            const newImages = [...formData.images];
            newImages[index] = {
                ...newImages[index],
                preview: reader.result,
                file: file
            };
            setFormData(prev => ({ ...prev, images: newImages }));
        };
        reader.readAsDataURL(file);

        // Upload to server
        setUploadingImage(true);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('image', file);
            uploadFormData.append('is_primary', index === 0 ? 'true' : 'false');

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/products/upload_image/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: uploadFormData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();

            // Update image URL with the uploaded URL
            const newImages = [...formData.images];
            newImages[index] = {
                ...newImages[index],
                image_url: data.url,
                preview: data.url
            };
            setFormData(prev => ({ ...prev, images: newImages }));
            toast.success('Image uploaded successfully');
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image');
        } finally {
            setUploadingImage(false);
        }
    };

    const addImage = () => {
        setFormData(prev => ({
            ...prev,
            images: [...prev.images, { image_url: '', is_primary: false, preview: null, file: null }]
        }));
    };

    const removeImage = (index) => {
        if (formData.images.length > 1) {
            const newImages = formData.images.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, images: newImages }));
        }
    };

    const handleSizeChange = (index, field, value) => {
        const newSizes = [...formData.sizes];
        newSizes[index] = { ...newSizes[index], [field]: value };
        
        let newStockQty = formData.stock_qty;
        if (field === 'stock_qty') {
            newStockQty = newSizes.reduce((sum, size) => sum + (parseInt(size.stock_qty) || 0), 0);
        }
        
        setFormData(prev => ({ ...prev, sizes: newSizes, stock_qty: newStockQty }));
    };

    const addSize = () => {
        setFormData(prev => ({
            ...prev,
            sizes: [...prev.sizes, { size: 'M', stock_qty: 0 }]
        }));
    };

    const removeSize = (index) => {
        if (formData.sizes.length > 1) {
            const newSizes = formData.sizes.filter((_, i) => i !== index);
            const newStockQty = newSizes.reduce((sum, size) => sum + (parseInt(size.stock_qty) || 0), 0);
            setFormData(prev => ({ ...prev, sizes: newSizes, stock_qty: newStockQty }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const sizeStockSum = formData.sizes.reduce((sum, s) => sum + (parseInt(s.stock_qty) || 0), 0);
            const hasActiveSizes = formData.sizes.some(s => parseInt(s.stock_qty) > 0) || formData.sizes.length > 1;
            const finalStockQty = hasActiveSizes ? sizeStockSum : parseInt(formData.stock_qty || 0);

            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                discount: parseFloat(formData.discount),
                stock_qty: finalStockQty,
                low_stock_threshold: parseInt(formData.low_stock_threshold),
                images: formData.images.filter(img => img.image_url.trim() !== ''),
                sizes: formData.sizes.map(s => ({
                    ...s,
                    stock_qty: parseInt(s.stock_qty)
                })),
            };

            if (isEditMode) {
                await api.put(`/products/${id}/`, payload);
                toast.success('Product updated successfully');
            } else {
                await api.post('/products/', payload);
                toast.success('Product created successfully');
            }
            navigate('/admin/products');
        } catch (error) {
            console.error('Error saving product:', error.response?.data || error);
            // Surface field-level or generic errors from the backend
            const data = error.response?.data;
            if (data && typeof data === 'object') {
                const messages = Object.entries(data)
                    .map(([field, msgs]) => {
                        let msgText = '';
                        if (Array.isArray(msgs)) {
                            msgText = msgs.map(m => typeof m === 'object' ? JSON.stringify(m) : m).join(', ');
                        } else if (typeof msgs === 'object' && msgs !== null) {
                            msgText = JSON.stringify(msgs);
                        } else {
                            msgText = String(msgs);
                        }
                        return field === 'detail' || field === 'error'
                            ? msgText
                            : `${field}: ${msgText}`;
                    })
                    .join(' | ');
                toast.error(messages || 'Error saving product');
            } else {
                toast.error(data || 'Error saving product');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loading">Loading product...</div>;

    return (
        <div className="product-form-page container">
            <div className="page-header">
                <h1>{isEditMode ? 'Edit Product' : 'Add New Product'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="product-form">
                <div className="form-grid">
                    {/* Basic Info */}
                    <div className="form-section">
                        <h2>Basic Information</h2>

                        <div className="form-group">
                            <label>SKU *</label>
                            <input
                                type="text"
                                name="sku"
                                value={formData.sku}
                                onChange={handleChange}
                                required
                                placeholder="e.g., KURTA-001"
                            />
                        </div>

                        <div className="form-group">
                            <label>Product Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="e.g., Cotton Kurta"
                            />
                        </div>

                        <div className="form-group">
                            <label>Name (Urdu)</label>
                            <input
                                type="text"
                                name="name_urdu"
                                value={formData.name_urdu}
                                onChange={handleChange}
                                placeholder="کرتا"
                                dir="rtl"
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                placeholder="Product description..."
                            />
                        </div>
                    </div>

                    {/* Category & Classification */}
                    <div className="form-section">
                        <h2>Classification</h2>

                        <div className="form-group">
                            <label>Category *</label>
                            <select name="category" value={formData.category} onChange={handleChange}>
                                <option value="stitched">Stitched</option>
                                <option value="unstitched">Unstitched</option>
                                <option value="dupatta">Dupatta</option>
                                <option value="accessories">Accessories</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Subcategory</label>
                            <input
                                type="text"
                                name="subcategory"
                                value={formData.subcategory}
                                onChange={handleChange}
                                placeholder="e.g., Formal, Casual"
                            />
                        </div>

                        <div className="form-group">
                            <label>Gender *</label>
                            <select name="gender" value={formData.gender} onChange={handleChange}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="unisex">Unisex</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Fabric</label>
                            <select name="fabric" value={formData.fabric} onChange={handleChange}>
                                <option value="">Select Fabric</option>
                                <option value="cotton">Cotton</option>
                                <option value="silk">Silk</option>
                                <option value="lawn">Lawn</option>
                                <option value="chiffon">Chiffon</option>
                                <option value="linen">Linen</option>
                                <option value="velvet">Velvet</option>
                                <option value="khaddar">Khaddar</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Color</label>
                            <input
                                type="text"
                                name="color"
                                value={formData.color}
                                onChange={handleChange}
                                placeholder="e.g., Blue, Red"
                            />
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="form-section">
                        <h2>Pricing & Stock</h2>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Price (Rs.) *</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="form-group">
                                <label>Discount (%)</label>
                                <input
                                    type="number"
                                    name="discount"
                                    value={formData.discount}
                                    onChange={handleChange}
                                    min="0"
                                    max="100"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Stock Quantity</label>
                                <input
                                    type="number"
                                    name="stock_qty"
                                    value={formData.stock_qty}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label>Low Stock Threshold</label>
                                <input
                                    type="number"
                                    name="low_stock_threshold"
                                    value={formData.low_stock_threshold}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Images */}
                    <div className="form-section">
                        <h2>Product Images</h2>
                        <div className="image-upload-container">
                            {formData.images.map((img, index) => (
                                <div key={index} className="image-upload-item">
                                    <div className="image-preview-wrapper">
                                        {img.preview ? (
                                            <img src={img.preview} alt={`Product ${index + 1}`} className="image-preview" />
                                        ) : (
                                            <div className="image-placeholder">
                                                <ImageIcon sx={{ fontSize: 32, color: '#94a3b8', mb: 1 }} />
                                                <span>No image</span>
                                            </div>
                                        )}
                                        {uploadingImage && !img.preview && (
                                            <div className="upload-loading">Uploading...</div>
                                        )}
                                    </div>
                                    <div className="image-upload-controls">
                                        <label className="file-input-label">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(index, e.target.files[0])}
                                                className="file-input-hidden"
                                            />
                                            {img.preview ? 'Change' : 'Choose File'}
                                        </label>
                                        {index === 0 && <span className="primary-badge">Primary</span>}
                                        {formData.images.length > 1 && (
                                            <button type="button" className="btn-remove" onClick={() => removeImage(index)}>
                                                ×
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button" className="btn-add" onClick={addImage} disabled={uploadingImage}>
                            + Add Image
                        </button>
                    </div>

                    {/* Sizes */}
                    <div className="form-section">
                        <h2>Size Options</h2>
                        {formData.sizes.map((size, index) => (
                            <div key={index} className="size-input-row">
                                <select
                                    value={size.size}
                                    onChange={(e) => handleSizeChange(index, 'size', e.target.value)}
                                >
                                    <option value="XS">XS</option>
                                    <option value="S">S</option>
                                    <option value="M">M</option>
                                    <option value="L">L</option>
                                    <option value="XL">XL</option>
                                    <option value="XXL">XXL</option>
                                    <option value="Free Size">Free Size</option>
                                </select>
                                <input
                                    type="number"
                                    value={size.stock_qty}
                                    onChange={(e) => handleSizeChange(index, 'stock_qty', e.target.value)}
                                    placeholder="Stock"
                                    min="0"
                                />
                                {formData.sizes.length > 1 && (
                                    <button type="button" className="btn-remove" onClick={() => removeSize(index)}>
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" className="btn-add" onClick={addSize}>
                            + Add Size
                        </button>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/products')}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Saving...' : (isEditMode ? 'Update Product' : 'Create Product')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
