import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../store/slices/authSlice';
import api from '../services/api';
import { toast } from 'react-toastify';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchProfile();
    fetchOrders();
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setProfileData(response.data);
      setEditForm({ name: response.data.name || '', phone: response.data.phone || '' });
    } catch (error) {
      if (user) {
        const fallback = {
          name: user.name, email: user.email,
          phone: user.phone || null, email_verified: user.email_verified ?? true,
          phone_verified: user.phone_verified ?? false, role: user.role,
        };
        setProfileData(fallback);
        setEditForm({ name: fallback.name || '', phone: fallback.phone || '' });
      } else {
        toast.error('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/list');
      setRecentOrders((response.data.orders || []).slice(0, 3));
    } catch {}
  };

  const handleSave = async () => {
    if (!editForm.name.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    try {
      const payload = { name: editForm.name.trim(), phone: editForm.phone.trim() };

      if (showPasswordSection) {
        if (!passwordForm.current_password) { toast.error('Enter your current password'); setSaving(false); return; }
        if (passwordForm.new_password.length < 8) { toast.error('New password must be at least 8 characters'); setSaving(false); return; }
        if (passwordForm.new_password !== passwordForm.confirm_password) { toast.error('Passwords do not match'); setSaving(false); return; }
        payload.current_password = passwordForm.current_password;
        payload.new_password = passwordForm.new_password;
      }

      const response = await api.patch('/auth/profile', payload);
      setProfileData({ ...profileData, ...response.data });

      // Update Redux store so the navbar name updates too
      dispatch(setCredentials({
        user: { ...user, name: response.data.name, phone: response.data.phone },
        token: localStorage.getItem('token'),
      }));

      toast.success('Profile updated successfully!');
      setEditing(false);
      setShowPasswordSection(false);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setShowPasswordSection(false);
    setEditForm({ name: profileData?.name || '', phone: profileData?.phone || '' });
    setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
  };

  const [verifying, setVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerifyInput, setShowVerifyInput] = useState(false);

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    setVerifying(true);
    try {
      await api.post('/auth/verify-email', {
        email: profileData.email,
        code: verificationCode.toUpperCase(),
      });
      toast.success('Email verified successfully!');
      
      fetchProfile();
      setShowVerifyInput(false);
      setVerificationCode('');
      
      dispatch(setCredentials({
        user: { ...user, email_verified: true },
        token: localStorage.getItem('token'),
      }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await api.post('/auth/resend-verification', { email: profileData.email });
      toast.success('New verification code sent to your email!');
    } catch (err) {
      toast.error('Failed to resend code');
    }
  };

  const [whatsappVerifying, setWhatsappVerifying] = useState(false);
  const [whatsappVerificationCode, setWhatsappVerificationCode] = useState('');
  const [showWhatsappVerifyInput, setShowWhatsappVerifyInput] = useState(false);

  const handleWhatsappVerify = async () => {
    if (!whatsappVerificationCode || whatsappVerificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    setWhatsappVerifying(true);
    try {
      await api.post('/auth/verify-whatsapp', {
        email: profileData.email,
        code: whatsappVerificationCode.toUpperCase(),
      });
      toast.success('WhatsApp verified successfully!');
      
      fetchProfile();
      setShowWhatsappVerifyInput(false);
      setWhatsappVerificationCode('');
      
      dispatch(setCredentials({
        user: { ...user, phone_verified: true },
        token: localStorage.getItem('token'),
      }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed');
    } finally {
      setWhatsappVerifying(false);
    }
  };

  const handleResendWhatsappCode = async () => {
    try {
      await api.post('/auth/resend-whatsapp-verification', { email: profileData.email });
      toast.success('New verification code sent to your WhatsApp!');
    } catch (err) {
      toast.error('Failed to resend code');
    }
  };

  if (loading) return <div className="loading">Loading Profile...</div>;

  const cardStyle = {
    background: 'var(--white)', padding: 'var(--space-xl)',
    borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--gray-200)',
  };

  const rowStyle = {
    display: 'flex', alignItems: 'center', padding: 'var(--space-md)',
    background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', gap: '0.75rem',
  };

  const inputStyle = {
    width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px',
    border: '1px solid var(--gray-300)', fontSize: '0.95rem',
    fontFamily: 'var(--font-body)', outline: 'none',
  };

  return (
    <div className="container" style={{ padding: 'var(--space-2xl) 0' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-xl)', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem' }}>My Profile</h1>
        <p style={{ color: 'var(--gray-500)' }}>Manage your account and view recent activity</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-xl)' }}>

        {/* Account Details Card */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', margin: 0 }}>
              <PersonIcon sx={{ color: 'var(--gold)' }} /> Account Details
            </h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: '#111111', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
              >
                <EditIcon fontSize="small" /> Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 1rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                  <CheckIcon fontSize="small" /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={handleCancel} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 0.85rem', background: 'var(--gray-200)', color: 'var(--gray-700)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <CloseIcon fontSize="small" />
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {/* Name */}
            <div style={rowStyle}>
              <PersonIcon sx={{ color: 'var(--gray-500)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '0.2rem' }}>Full Name</span>
                {editing
                  ? <input style={inputStyle} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
                  : <strong>{profileData?.name}</strong>}
              </div>
            </div>

            {/* Email — always read-only */}
            <div style={{ ...rowStyle, flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <EmailIcon sx={{ color: 'var(--gray-500)', flexShrink: 0, marginRight: '0.75rem' }} />
                <div style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '0.2rem' }}>Email Address</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong>{profileData?.email}</strong>
                    {profileData?.email_verified ? (
                      <span style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                        <VerifiedUserIcon sx={{ fontSize: '0.9rem' }} /> Verified
                      </span>
                    ) : (
                      !showVerifyInput && (
                        <button onClick={() => setShowVerifyInput(true)} style={{ padding: '0.2rem 0.6rem', background: 'var(--gold)', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}>
                          Verify Now
                        </button>
                      )
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', display: 'block', marginTop: '0.2rem' }}>Email cannot be changed</span>
                </div>
              </div>
              {/* Email Verification Code Input Section */}
              {!profileData?.email_verified && showVerifyInput && (
                <div style={{ width: '100%', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Enter the 6-digit code sent to your email:</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      style={{ ...inputStyle, textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold', fontSize: '1.1rem' }}
                      value={verificationCode}
                      onChange={e => setVerificationCode(e.target.value.toUpperCase())}
                      placeholder="XXXXXX"
                      maxLength={6}
                    />
                    <button onClick={handleVerify} disabled={verifying} style={{ padding: '0 1rem', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                      {verifying ? '...' : 'Confirm'}
                    </button>
                    <button onClick={() => setShowVerifyInput(false)} style={{ padding: '0 0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <CloseIcon fontSize="small" />
                    </button>
                  </div>
                  <button onClick={handleResendCode} style={{ background: 'none', border: 'none', color: 'var(--primary-purple)', fontSize: '0.75rem', marginTop: '0.5rem', cursor: 'pointer', padding: 0 }}>
                    Resend Code
                  </button>
                </div>
              )}
            </div>

            {/* Phone */}
            <div style={{ ...rowStyle, flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <PhoneIcon sx={{ color: 'var(--gray-500)', flexShrink: 0, marginRight: '0.75rem' }} />
                <div style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '0.2rem' }}>WhatsApp Number</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {editing ? (
                      <input style={inputStyle} value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="e.g. +923001234567" />
                    ) : (
                      <strong>{profileData?.phone || 'Not provided'}</strong>
                    )}
                    
                    {!editing && profileData?.phone && (
                      profileData?.phone_verified ? (
                        <span style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                          <VerifiedUserIcon sx={{ fontSize: '0.9rem' }} /> Verified
                        </span>
                      ) : (
                        !showWhatsappVerifyInput && (
                          <button onClick={() => setShowWhatsappVerifyInput(true)} style={{ padding: '0.2rem 0.6rem', background: 'var(--gold)', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}>
                            Verify Now
                          </button>
                        )
                      )
                    )}
                  </div>
                </div>
              </div>
              {/* WhatsApp Verification Code Input Section */}
              {!profileData?.phone_verified && showWhatsappVerifyInput && profileData?.phone && !editing && (
                <div style={{ width: '100%', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Enter the 6-digit code sent to your WhatsApp:</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      style={{ ...inputStyle, textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold', fontSize: '1.1rem' }}
                      value={whatsappVerificationCode}
                      onChange={e => setWhatsappVerificationCode(e.target.value.toUpperCase())}
                      placeholder="XXXXXX"
                      maxLength={6}
                    />
                    <button onClick={handleWhatsappVerify} disabled={whatsappVerifying} style={{ padding: '0 1rem', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                      {whatsappVerifying ? '...' : 'Confirm'}
                    </button>
                    <button onClick={() => setShowWhatsappVerifyInput(false)} style={{ padding: '0 0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <CloseIcon fontSize="small" />
                    </button>
                  </div>
                  <button onClick={handleResendWhatsappCode} style={{ background: 'none', border: 'none', color: 'var(--primary-purple)', fontSize: '0.75rem', marginTop: '0.5rem', cursor: 'pointer', padding: 0 }}>
                    Resend Code
                  </button>
                </div>
              )}
            </div>

            {/* Change Password toggle (only in edit mode) */}
            {editing && (
              <div>
                <button
                  onClick={() => setShowPasswordSection(s => !s)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', background: 'transparent', border: '1px dashed var(--gray-300)', borderRadius: '6px', cursor: 'pointer', color: 'var(--gray-600)', fontSize: '0.875rem', width: '100%' }}
                >
                  <LockIcon fontSize="small" />
                  {showPasswordSection ? 'Cancel Password Change' : 'Change Password'}
                </button>

                {showPasswordSection && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <input style={inputStyle} type="password" placeholder="Current password" value={passwordForm.current_password} onChange={e => setPasswordForm(f => ({ ...f, current_password: e.target.value }))} />
                    <input style={inputStyle} type="password" placeholder="New password (min. 8 chars)" value={passwordForm.new_password} onChange={e => setPasswordForm(f => ({ ...f, new_password: e.target.value }))} />
                    <input style={inputStyle} type="password" placeholder="Confirm new password" value={passwordForm.confirm_password} onChange={e => setPasswordForm(f => ({ ...f, confirm_password: e.target.value }))} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders Card */}
        <div style={cardStyle}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--space-lg)', fontSize: '1.25rem' }}>
            <LocalShippingIcon sx={{ color: 'var(--gold)' }} /> Recent Orders
          </h2>

          {recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl) 0', color: 'var(--gray-400)' }}>
              <LocalShippingIcon sx={{ fontSize: 48, opacity: 0.2, mb: 2, display: 'block', margin: '0 auto 1rem' }} />
              <p style={{ marginBottom: '1rem' }}>You haven't placed any orders yet.</p>
              <button onClick={() => navigate('/shop')} className="btn btn-outline">Start Shopping</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {recentOrders.map(order => (
                <div key={order.order_id} style={{ padding: 'var(--space-md)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ display: 'block' }}>Order #{order.order_id}</strong>
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>{new Date(order.order_date).toLocaleDateString()}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ display: 'block' }}>Rs. {order.total_amount}</strong>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: 'var(--gray-100)', color: 'var(--gray-700)', textTransform: 'capitalize' }}>
                      {order.order_status}
                    </span>
                  </div>
                </div>
              ))}
              <button onClick={() => navigate('/orders')} className="btn btn-outline" style={{ width: '100%', marginTop: 'var(--space-md)' }}>
                View All Orders
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Profile;
