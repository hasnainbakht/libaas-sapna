import React from 'react';
import './PasswordStrength.css';

const PasswordStrength = ({ password }) => {
  const getStrength = (pwd) => {
    let strength = 0;
    const checks = {
      length: pwd.length >= 8,
      lowercase: /[a-z]/.test(pwd),
      uppercase: /[A-Z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };

    Object.values(checks).forEach(check => {
      if (check) strength++;
    });

    if (strength <= 2) return { level: 'weak', percentage: 33, color: '#e74c3c' };
    if (strength <= 4) return { level: 'medium', percentage: 66, color: '#f39c12' };
    return { level: 'strong', percentage: 100, color: '#27ae60' };
  };

  if (!password) return null;

  const strength = getStrength(password);
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  return (
    <div className="password-strength">
      <div className="strength-bar-container">
        <div 
          className="strength-bar" 
          style={{ 
            width: `${strength.percentage}%`, 
            backgroundColor: strength.color 
          }}
        />
      </div>
      <div className="strength-text">
        Password Strength: <span style={{ color: strength.color }}>{strength.level.toUpperCase()}</span>
      </div>
      <div className="password-checks">
        <div className={`check-item ${checks.length ? 'valid' : ''}`}>
          {checks.length ? '✓' : '✗'} At least 8 characters
        </div>
        <div className={`check-item ${checks.lowercase ? 'valid' : ''}`}>
          {checks.lowercase ? '✓' : '✗'} One lowercase letter
        </div>
        <div className={`check-item ${checks.uppercase ? 'valid' : ''}`}>
          {checks.uppercase ? '✓' : '✗'} One uppercase letter
        </div>
        <div className={`check-item ${checks.number ? 'valid' : ''}`}>
          {checks.number ? '✓' : '✗'} One number
        </div>
        <div className={`check-item ${checks.special ? 'valid' : ''}`}>
          {checks.special ? '✓' : '✗'} One special character
        </div>
      </div>
    </div>
  );
};

export default PasswordStrength;


