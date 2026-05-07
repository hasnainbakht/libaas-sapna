import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { useSettings } from '../../context/SettingsContext';
import SearchIcon from '@mui/icons-material/Search';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import './Layout.css';

const Layout = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { itemCount } = useSelector((state) => state.cart);
  const { settings } = useSettings();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const [headerSearch, setHeaderSearch] = useState('');
  const [headerListening, setHeaderListening] = useState(false);
  const [headerVoiceError, setHeaderVoiceError] = useState('');
  const headerRecogRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (headerVoiceError) {
      const t = setTimeout(() => setHeaderVoiceError(''), 4000);
      return () => clearTimeout(t);
    }
  }, [headerVoiceError]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleHeaderSearch = (e) => {
    e.preventDefault();
    if (headerSearch.trim()) {
      navigate(`/shop?search=${encodeURIComponent(headerSearch.trim())}`);
      setHeaderSearch('');
    }
  };

  const startHeaderVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setHeaderVoiceError('Voice search not supported');
      return;
    }
    if (headerRecogRef.current) headerRecogRef.current.stop();
    const recognition = new SpeechRecognition();
    headerRecogRef.current = recognition;
    recognition.lang = 'ur-PK';
    recognition.interimResults = false;
    recognition.onstart = () => setHeaderListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setHeaderListening(false);
      navigate(`/shop?search=${encodeURIComponent(transcript)}&t=${Date.now()}`);
      setHeaderSearch('');
    };
    recognition.onend = () => setHeaderListening(false);
    recognition.start();
  };

  const stopHeaderVoice = () => {
    if (headerRecogRef.current) headerRecogRef.current.stop();
    setHeaderListening(false);
  };

  return (
    <div className="layout-enterprise">
      <header className={`header-premium ${isScrolled ? 'scrolled' : ''} ${isHomePage && !isScrolled ? 'on-dark' : ''}`}>
        <div className="container header-inner">
          <Link to="/" className="logo-master">
            <span className="logo-symbol">LS</span>
            <div className="logo-info">
              <span className="logo-name">{settings.storeName}</span>
              <span className="logo-subtitle">CURATED ELEGANCE</span>
            </div>
          </Link>

          <form className="header-search-premium" onSubmit={handleHeaderSearch}>
            <div className="search-pill-modern">
               <SearchIcon className="search-icon-dim" />
               <input
                 type="text"
                 placeholder={headerListening ? 'LISTENING...' : 'SEARCH COLLECTIONS...'}
                 value={headerSearch}
                 onChange={(e) => setHeaderSearch(e.target.value)}
                 readOnly={headerListening}
               />
               <button 
                 type="button" 
                 onClick={headerListening ? stopHeaderVoice : startHeaderVoice}
                 className={`mic-pill-btn ${headerListening ? 'active' : ''}`}
               >
                 {headerListening ? <MicOffIcon /> : <MicIcon />}
               </button>
            </div>
          </form>

          <nav className="nav-master">
            <Link to="/shop" className="nav-item">COLLECTION</Link>
            
            {isAuthenticated ? (
              <div className="nav-actions-master">
                {user?.role === 'admin' && (
                  <Link to="/admin/dashboard" className="nav-icon-link admin" title="Admin">
                    <DashboardIcon />
                  </Link>
                )}
                <Link to="/orders" className="nav-icon-link" title="Orders">
                  <Inventory2Icon />
                </Link>
                <Link to="/favorites" className="nav-icon-link" title="Favorites">
                  <FavoriteBorderIcon />
                </Link>
                <Link to="/cart" className="nav-icon-link cart-trigger" title="Bag">
                  <ShoppingCartIcon />
                  {itemCount > 0 && <span className="badge-pulsar">{itemCount}</span>}
                </Link>
                
                <div className="user-profile-trigger">
                  <span className="avatar-minimal">{user?.name?.charAt(0)}</span>
                  <KeyboardArrowDownIcon fontSize="small" />
                  <div className="profile-dropdown-master">
                     <div className="dropdown-header">
                        <strong>{user?.name}</strong>
                        <span>{user?.email}</span>
                     </div>
                     <Link to="/profile">MY PROFILE</Link>
                     <button onClick={handleLogout} className="logout-master">SIGN OUT</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="nav-auth-master">
                <Link to="/login" className="login-btn-minimal">SIGN IN</Link>
                <Link to="/register" className="register-btn-master">JOIN US</Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className={`main-viewport ${isHomePage ? 'home-view' : ''}`}>{children}</main>

      <footer className="footer-master">
        <div className="container">
          <div className="footer-top-grid">
            <div className="footer-col brand-col">
              <span className="footer-logo-text">{settings.storeName}</span>
              <p>Redefining the boundaries of traditional Pakistani fashion through artificial intelligence and elite craftsmanship.</p>
              <div className="footer-social-master">
                <a href="#"><InstagramIcon /></a>
                <a href="#"><FacebookIcon /></a>
                <a href="#"><TwitterIcon /></a>
              </div>
            </div>
            
            <div className="footer-col">
              <h4>COLLECTIONS</h4>
              <Link to="/shop?category=stitched">Stitched Wear</Link>
              <Link to="/shop?category=unstitched">Unstitched Fabric</Link>
              <Link to="/shop?category=dupatta">Silk Dupattas</Link>
              <Link to="/shop?category=accessories">Elite Accessories</Link>
            </div>

            <div className="footer-col">
              <h4>CLIENT SERVICE</h4>
              <Link to="/profile">My Account</Link>
              <Link to="/orders">Order Tracking</Link>
              <Link to="#">Shipping Policy</Link>
              <Link to="#">Return Center</Link>
            </div>

            <div className="footer-col">
              <h4>CONTACT</h4>
              <span>{settings.storePhone}</span>
              <span>{settings.storeEmail}</span>
              <span className="address-dim">{settings.storeAddress}</span>
            </div>
          </div>

          <div className="footer-bottom-master">
             <div className="bottom-left">
                <span>© 2024 LIBAAS SAPNA. ALL RIGHTS RESERVED.</span>
             </div>
             <div className="bottom-right">
                <Link to="#">PRIVACY</Link>
                <Link to="#">TERMS</Link>
                <Link to="#">ACCESSIBILITY</Link>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

