import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import api from '../services/api';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { Visibility, VisibilityOff } from '@mui/icons-material';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loginError, setLoginError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || '/';

  // Comprehensive email validation
  const validateEmail = (email) => {
    if (!email) return false;

    // Basic format check
    const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicRegex.test(email)) return false;

    // Check for consecutive dots anywhere
    if (/\.{2,}/.test(email)) return false;

    // Split email into local and domain parts
    const parts = email.split('@');
    if (parts.length !== 2) return false;

    const [localPart, domainPart] = parts;

    // Local part checks
    if (localPart.length === 0 || localPart.length > 64) return false;
    if (localPart.startsWith('.') || localPart.endsWith('.')) return false;

    // Domain part checks
    if (domainPart.length === 0 || domainPart.length > 255) return false;
    if (domainPart.startsWith('.') || domainPart.startsWith('-')) return false;
    if (domainPart.endsWith('-')) return false;

    // Check for valid domain structure
    const domainParts = domainPart.split('.');
    if (domainParts.length < 2) return false;

    // Check for repeated TLDs like .com.com
    const tld = domainParts[domainParts.length - 1].toLowerCase();
    const secondLast = domainParts[domainParts.length - 2].toLowerCase();
    if (tld === secondLast && ['com', 'org', 'net', 'edu', 'gov', 'io', 'co', 'pk', 'uk', 'in'].includes(tld)) {
      return false;
    }

    // Check each domain part
    for (const part of domainParts) {
      if (part.length === 0 || part.length > 63) return false;
      if (!/^[a-zA-Z0-9-]+$/.test(part)) return false;
      if (part.startsWith('-') || part.endsWith('-')) return false;
    }

    // TLD must be at least 2 characters and only letters
    if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) return false;

    // Strict TLD check using the provided method
    const validTlds = ['com', 'org', 'net', 'edu', 'gov', 'io', 'co', 'pk', 'uk', 'in'];
    if (!validTlds.includes(tld)) {
      return false;
    }

    return true;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear errors when user starts typing
    if (e.target.name === 'email') {
      setEmailError('');
    }
    setLoginError('');
  };

  const handleEmailBlur = () => {
    if (formData.email && !validateEmail(formData.email)) {
      setEmailError('Please enter a valid email address');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const { sub: google_id, email, name, picture } = decoded;

      const response = await api.post('/auth/google-login', {
        google_id,
        email,
        name,
        profile_picture: picture
      });

      dispatch(setCredentials({
        user: {
          user_id: response.data.user_id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role,
          phone: response.data.phone || null,
          email_verified: response.data.email_verified ?? true, // Google users are pre-verified
        },
        token: response.data.token,
      }));
      toast.success('Google login successful!');
      navigate(redirectPath);
    } catch (error) {
      toast.error('Google login failed');
      console.error('Google Login Error:', error);
    }
  };

  const handleGoogleError = () => {
    toast.error('Google login failed');
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email before submission
    if (!validateEmail(formData.email)) {
      setEmailError('Please enter a valid email address');
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setLoginError('');

    try {
      const response = await api.post('/auth/login', formData);

      if (response.data.email_verified === false) {
        setShowVerification(true);
        setVerificationEmail(formData.email);
        toast.info('Please verify your email to continue');
        return;
      }

      dispatch(setCredentials({
        user: {
          user_id: response.data.user_id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role,
          phone: response.data.phone || null,
          email_verified: response.data.email_verified ?? false,
        },
        token: response.data.token,
      }));
      toast.success('Login successful!');
      navigate(redirectPath);
    } catch (error) {
      if (error.response?.data?.email_verified === false) {
        setShowVerification(true);
        setVerificationEmail(formData.email);
        toast.info('Please verify your email to continue');
      } else {
        const errorMsg = error.response?.data?.error || 'Login failed. Please try again.';
        setLoginError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/verify-email', {
        email: verificationEmail,
        code: verificationCode,
      });
      toast.success('Email verified! Please login again.');
      setShowVerification(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Verification failed');
    }
  };

  const handleResendCode = async () => {
    try {
      await api.post('/auth/resend-verification', { email: verificationEmail });
      toast.success('Verification code sent to your email');
    } catch (error) {
      toast.error('Failed to resend code');
    }
  };

  if (showVerification) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <h1>Verify Your Email</h1>
          <p style={{ textAlign: 'center', marginBottom: '20px', color: '#7f8c8d' }}>
            We've sent a verification code to {verificationEmail}
          </p>
          <form onSubmit={handleVerifyEmail}>
            <div className="form-group">
              <label>Verification Code</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                maxLength="6"
                required
                style={{ textAlign: 'center', letterSpacing: '5px', fontSize: '1.5rem' }}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Verify Email
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '15px' }}>
            Didn't receive code?{' '}
            <button onClick={handleResendCode} className="link-btn">
              Resend
            </button>
          </p>
          <button onClick={() => setShowVerification(false)} className="link-btn" style={{ marginTop: '10px' }}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Login to LIBAAS SAPNA</h1>
        {loginError && (
          <div className="login-error-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>{loginError}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleEmailBlur}
              autoComplete="new-email"
              required
              className={emailError ? 'input-error' : ''}
            />
            {emailError && (
              <span style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>{emailError}</span>
            )}
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="password-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <div className="google-login-wrapper" style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="filled_blue"
            shape="pill"
            text="continue_with"
          />
        </div>

        <p>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
