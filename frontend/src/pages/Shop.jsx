import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Shop.css';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SearchIcon from '@mui/icons-material/Search';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import StyleIcon from '@mui/icons-material/Style';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';

const Shop = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiSearching, setAiSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [aiResult, setAiResult] = useState(null);
  const [isAiMode, setIsAiMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef(null);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    gender: '',
    min_price: '',
    max_price: '',
  });

  const aiActiveRef = useRef(!!searchParams.get('search'));
  const filterMountedRef = useRef(false);

  useEffect(() => {
    const urlSearchQuery = searchParams.get('search');
    if (urlSearchQuery) {
      aiActiveRef.current = true;
      setSearchQuery(urlSearchQuery);
      triggerAiSearch(urlSearchQuery);
    } else {
      aiActiveRef.current = false;
      fetchProducts();
    }
  }, [searchParams]);

  useEffect(() => {
    if (!filterMountedRef.current) {
      filterMountedRef.current = true;
      return;
    }
    if (!isAiMode && !aiActiveRef.current) {
      fetchProducts();
    }
  }, [filters]);


  const fetchProducts = async () => {
    if (aiActiveRef.current) return;
    try {
      setLoading(true);
      setIsAiMode(false);
      setAiResult(null);
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);

      const response = await api.get(`/products/?${params.toString()}`);
      if (!aiActiveRef.current) {
        setProducts(response.data.results || response.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      if (!aiActiveRef.current) {
        setLoading(false);
      }
    }
  };

  const triggerAiSearch = async (query) => {
    const q = (query || searchQuery || '').trim();
    if (!q) {
      aiActiveRef.current = false;
      fetchProducts();
      return;
    }
    try {
      aiActiveRef.current = true;
      setAiSearching(true);
      setLoading(true);
      const response = await api.post('/search/ai', { query: q });
      setProducts(response.data.results || []);
      setAiResult({
        english_query: response.data.english_query,
        detected_tags: response.data.detected_tags,
        results_count: response.data.results_count,
        original_query: response.data.original_query,
      });
      setIsAiMode(true);
    } catch (error) {
      console.error('AI Search error:', error);
      aiActiveRef.current = false;
      fetchProducts(); 
    } finally {
      setAiSearching(false);
      setLoading(false);
    }
  };

  const handleAiSearch = async (e) => {
    if (e) e.preventDefault();
    triggerAiSearch(searchQuery);
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError('Voice search not supported');
      toast.error('Voice search is not supported in this browser.');
      return;
    }
    if (recognitionRef.current) recognitionRef.current.stop();
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'ur-PK';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      triggerAiSearch(transcript);
    };
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
         toast.error('Microphone access denied. Please allow microphone permissions.');
      } else {
         toast.error(`Voice search error: ${event.error}`);
      }
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
  };

  const clearFilters = () => {
    aiActiveRef.current = false;
    setFilters({ category: '', gender: '', min_price: '', max_price: '' });
    setSearchQuery('');
    setAiResult(null);
    setIsAiMode(false);
    setTimeout(() => fetchProducts(), 0);
  };

  const activeTags = aiResult?.detected_tags
    ? Object.entries(aiResult.detected_tags)
        .filter(([key, val]) => val && key !== 'keywords' && key !== 'price_max' && key !== 'price_min')
        .map(([key, val]) => ({ key, val }))
    : [];

  const keywordTags = aiResult?.detected_tags?.keywords?.filter(Boolean) || [];
  const priceMin = aiResult?.detected_tags?.price_min;
  const priceMax = aiResult?.detected_tags?.price_max;
  const priceRangeLabel = priceMin && priceMax ? `Rs. ${priceMin} – Rs. ${priceMax}` : priceMax ? `Under Rs. ${priceMax}` : priceMin ? `Above Rs. ${priceMin}` : null;

  return (
    <div className="shop-enterprise">
      <div className="shop-hero-small">
        <div className="container">
          <div className="shop-nav-info">
             <span className="subtitle">COLLECTIONS</span>
             <h1>The Masterpiece Series</h1>
          </div>
          
          <div className="search-box-premium">
            <form onSubmit={handleAiSearch} className="search-form-enterprise">
              <div className="ai-badge-indicator">
                <AutoFixHighIcon fontSize="small" />
                <span>AI</span>
              </div>
              <input 
                type="text" 
                placeholder={isListening ? "Listening..." : "Search by style, color, or price..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiSearch(e)}
              />
              <div className="search-actions">
                <button type="button" onClick={isListening ? stopVoiceSearch : startVoiceSearch} className={`mic-btn-modern ${isListening ? 'active' : ''}`}>
                   {isListening ? <MicOffIcon /> : <MicIcon />}
                </button>
                <button type="submit" className="search-submit-btn">
                   {aiSearching ? <div className="spinner-small"></div> : <SearchIcon />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {isAiMode && aiResult && (
        <div className="ai-intelligence-bar">
          <div className="container intelligence-container">
             <div className="intel-left">
                <AutoFixHighIcon className="intel-icon" />
                <div className="intel-summary">
                   <span>AI INTERPRETATION</span>
                   <strong>"{aiResult.english_query}"</strong>
                </div>
             </div>
             <div className="intel-tags">
                {activeTags.map(({key, val}) => <span key={key} className="intel-tag">{val}</span>)}
                {keywordTags.map((kw, i) => <span key={i} className="intel-tag">{kw}</span>)}
                {priceRangeLabel && <span className="intel-tag price">{priceRangeLabel}</span>}
             </div>
             <button className="intel-close" onClick={clearFilters}><CloseIcon /></button>
          </div>
        </div>
      )}

      <div className="container shop-body-container">
        <div className="shop-grid-layout">
          <aside className="shop-filters-sidebar">
            <div className="filter-header-modern">
               <h3><TuneIcon sx={{ mr: 1, fontSize: 18 }} /> FILTERS</h3>
               <button onClick={clearFilters}>RESET</button>
            </div>

            <div className="filter-group-modern">
              <label>CATEGORY</label>
              <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                <option value="">ALL COLLECTIONS</option>
                <option value="stitched">STITCHED</option>
                <option value="unstitched">UNSTITCHED</option>
                <option value="dupatta">DUPATTA</option>
                <option value="accessories">ACCESSORIES</option>
              </select>
            </div>

            <div className="filter-group-modern">
              <label>GENDER</label>
              <div className="gender-toggle">
                {['MALE', 'FEMALE', 'UNISEX'].map(g => (
                  <button 
                    key={g} 
                    className={filters.gender === g.toLowerCase() ? 'active' : ''}
                    onClick={() => setFilters({ ...filters, gender: g.toLowerCase() })}
                  >{g}</button>
                ))}
              </div>
            </div>

            <div className="filter-group-modern">
              <label>PRICE RANGE</label>
              <div className="price-inputs-modern">
                <input type="number" placeholder="MIN" value={filters.min_price} onChange={(e) => setFilters({...filters, min_price: e.target.value})} />
                <div className="price-divider"></div>
                <input type="number" placeholder="MAX" value={filters.max_price} onChange={(e) => setFilters({...filters, max_price: e.target.value})} />
              </div>
            </div>
          </aside>

          <main className="shop-results-main">
             <div className="results-header-modern">
                <span>{loading ? 'ANALYZING...' : `${products.length} PIECES DISCOVERED`}</span>
             </div>

             {loading ? (
               <div className="shop-loading-enterprise">
                  <div className="loading-orb-pulsar"></div>
                  <p>Curation in progress...</p>
               </div>
             ) : (
               <div className="products-grid-premium">
                  {products.map((product) => (
                    <Link key={product.product_id} to={`/product/${product.product_id}`} className="product-card-premium">
                      <div className="product-image-container">
                        <img src={product.images?.[0]?.url || product.images?.[0]?.image || 'https://via.placeholder.com/400x500'} alt={product.name} />
                        {product.discount > 0 && <span className="discount-badge-premium">{product.discount}% OFF</span>}
                        {isAiMode && <span className="ai-match-tag">AI MATCH</span>}
                        <div className="overlay-view"><VisibilityIcon /></div>
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
          </main>
        </div>
      </div>
    </div>
  );
};

export default Shop;
