import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import api from '../services/api';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import PasswordStrength from '../components/PasswordStrength';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

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

  // Comprehensive phone validation (Pakistani format)
  const validatePhone = (phone) => {
    if (!phone) return true; // Return true if empty, unless it's strictly required
    
    // Remove spaces and dashes for checking
    const cleanPhone = phone.replace(/[\s-]/g, '');
    
    // Check for valid Pakistani phone structure (03XX XXXXXXX or +923XX XXXXXXX)
    const pkPhoneRegex = /^(?:\+92|92|0)?3[0-9]{9}$/;
    
    return pkPhoneRegex.test(cleanPhone);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear email error when user starts typing
    if (e.target.name === 'email') {
      setEmailError('');
    }
    if (e.target.name === 'phone') {
      setPhoneError('');
    }
  };

  const handleEmailBlur = () => {
    if (formData.email && !validateEmail(formData.email)) {
      setEmailError('Please enter a valid email address');
    }
  };

  const handlePhoneBlur = () => {
    if (formData.phone && !validatePhone(formData.phone)) {
      setPhoneError('Please enter a valid Pakistani phone number (e.g. 03XXXXXXXXX)');
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
        },
        token: response.data.token,
      }));
      toast.success('Google signup successful!');
      navigate('/');
    } catch (error) {
      toast.error('Google signup failed');
      console.error('Google Signup Error:', error);
    }
  };

  const handleGoogleError = () => {
    toast.error('Google signup failed');
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email before submission
    if (!validateEmail(formData.email)) {
      setEmailError('Please enter a valid email address');
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate phone before submission
    if (formData.phone && !validatePhone(formData.phone)) {
      setPhoneError('Please enter a valid Pakistani phone number (e.g. 03XXXXXXXXX)');
      toast.error('Please enter a valid phone number');
      return;
    }

    if (formData.password !== formData.password2) {
      toast.error('Passwords do not match');
      return;
    }

    // Check password strength
    const strengthChecks = {
      length: formData.password.length >= 8,
      lowercase: /[a-z]/.test(formData.password),
      uppercase: /[A-Z]/.test(formData.password),
      number: /[0-9]/.test(formData.password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    };

    const strengthCount = Object.values(strengthChecks).filter(Boolean).length;
    if (strengthCount < 3) {
      toast.error('Password is too weak. Please use a stronger password.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        password2: formData.password2,
        phone: formData.phone,
      });

      setRegisteredEmail(formData.email);
      setShowVerification(true);
      toast.info('Verification code sent! Please verify your email.');
    } catch (error) {
      console.error('Registration Error:', error);
      const errorData = error.response?.data;

      if (errorData) {
        if (typeof errorData === 'string') {
          toast.error(errorData);
        } else if (errorData.error) {
          toast.error(errorData.error);
        } else {
          // Handle field-specific errors (e.g., { email: ['User with this email already exists.'] })
          const messages = Object.entries(errorData).map(([key, val]) => {
            const msg = Array.isArray(val) ? val[0] : val;
            return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${msg}`;
          });

          if (messages.length > 0) {
            messages.forEach(msg => toast.error(msg));
          } else {
            toast.error('Registration failed');
          }
        }
      } else {
        toast.error('Registration failed. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/verify-email', {
        email: registeredEmail,
        code: verificationCode,
      });
      toast.success('Email verified successfully!');

      // Auto login after verification
      const loginResponse = await api.post('/auth/login', {
        email: registeredEmail,
        password: formData.password,
      });

      dispatch(setCredentials({
        user: {
          user_id: loginResponse.data.user_id,
          name: loginResponse.data.name,
          email: loginResponse.data.email,
        },
        token: loginResponse.data.token,
      }));

      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Verification failed');
    }
  };

  const handleResendCode = async () => {
    try {
      await api.post('/auth/resend-verification', { email: registeredEmail });
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
            We've sent a verification code to {registeredEmail}
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
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Register to LIBAAS SAPNA</h1>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="off"
              required
            />
          </div>
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
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handlePhoneBlur}
              autoComplete="off"
              className={phoneError ? 'input-error' : ''}
            />
            {phoneError && (
              <span style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>{phoneError}</span>
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
            <PasswordStrength password={formData.password} />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <div className="password-group">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
              >
                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
              </button>
            </div>
            {formData.password2 && formData.password !== formData.password2 && (
              <span style={{ color: '#e74c3c', fontSize: '0.85rem' }}>Passwords do not match</span>
            )}
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Registering...' : 'Register'}
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
            text="signup_with"
          />
        </div>

        <p>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
