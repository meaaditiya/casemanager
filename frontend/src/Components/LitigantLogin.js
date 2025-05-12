import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Turnstile } from '@marsidev/react-turnstile';
import '../ComponentsCSS/LitigantLogin.css';

// Ensure React is loaded correctly
if (!React.useState) {
  console.error('React is not properly loaded. Check for multiple React instances or version mismatches.');
}

const LitigantLogin = () => {
  const navigate = useNavigate();
  
  const [view, setView] = useState('login');
  const [animating, setAnimating] = useState(false);
  const [party_id, setPartyId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  const [resetData, setResetData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState(null);
  const turnstileRef = useRef(null);

  // Use the direct site key instead of environment variable
  const siteKey = "0x4AAAAAABUex35iY9OmXSBB";
  
  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setResetData({
      ...resetData,
      [name]: value
    });
    if (name === 'newPassword') {
      checkPasswordStrength(value);
    }
  };
  
  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength >= 4 ? 3 : (strength >= 2 ? 2 : 1));
  };
  
  const changeView = (newView) => {
    setAnimating(true);
    setTimeout(() => {
      setView(newView);
      setError('');
      setMessage('');
      setAnimating(false);
      setTurnstileToken(null); // Reset token on view change
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
    }, 300);
  };
  
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!turnstileToken) {
      setError('Please complete the CAPTCHA verification');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('https://ecourt-yr51.onrender.com/api/litigant/login', {
        email: loginData.email,
        password: loginData.password,
        'cf-turnstile-response': turnstileToken // This is the correct field name expected by Cloudflare
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userType', 'litigant');
      localStorage.setItem('userData', JSON.stringify(response.data.litigant));
      navigate('/litidash');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      setTurnstileToken(null);
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleForgotPassword = async () => {
    if (!loginData.email) {
      setError('Please enter your email address first');
      return;
    }
    if (!turnstileToken) {
      setError('Please complete the CAPTCHA verification');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post('https://ecourt-yr51.onrender.com/api/litigant/forgot-password', { 
        email: loginData.email,
        'cf-turnstile-response': turnstileToken
      });

      setMessage(response.data.message);
      setPartyId(response.data.party_id);
      changeView('enterOTP');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to process request');
      setTurnstileToken(null);
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    if (resetData.newPassword !== resetData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (passwordStrength < 2) {
      setError('Please use a stronger password');
      setLoading(false);
      return;
    }
    try {
      const response = await axios.post('https://ecourt-yr51.onrender.com/api/litigant/reset-password', {
        party_id,
        otp: resetData.otp,
        newPassword: resetData.newPassword,
        confirmPassword: resetData.confirmPassword
      });
      setMessage(response.data.message);
      setTimeout(() => {
        changeView('login');
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };
  
  const getPasswordStrengthClass = () => {
    switch (passwordStrength) {
      case 1: return 'strength-weak';
      case 2: return 'strength-medium';
      case 3: return 'strength-strong';
      default: return '';
    }
  };
  
  const getPasswordStrengthLabel = () => {
    switch (passwordStrength) {
      case 1: return 'Weak';
      case 2: return 'Medium';
      case 3: return 'Strong';
      default: return '';
    }
  };
  
  const renderLoginForm = () => (
    <div className={`view-transition ${animating ? 'fade-out' : 'fade-in'}`}>
      <h2 className="litigant-title">Litigant Login</h2>
      {error && <div className="litigant-error-box">{error}</div>}
      {message && <div className="litigant-success-box">{message}</div>}
      <form onSubmit={handleLoginSubmit}>
        <div className="litigant-form-group">
          <label className="litigant-label">Email</label>
          <input
            type="email"
            name="email"
            value={loginData.email}
            onChange={handleLoginChange}
            className="litigant-input"
            required
            autoFocus
          />
        </div>
        <div className="litigant-form-group">
          <label className="litigant-label">Password</label>
          <input
            type="password"
            name="password"
            value={loginData.password}
            onChange={handleLoginChange}
            className="litigant-input"
            required
          />
        </div>
        <div className="litigant-form-group turnstile-container">
          <Turnstile
            ref={turnstileRef}
            siteKey={siteKey}
            onSuccess={(token) => {
              setTurnstileToken(token);
              setError(''); // Clear any previous CAPTCHA errors
            }}
            onError={() => {
              setError('CAPTCHA verification failed. Please try again.');
              setTurnstileToken(null);
            }}
            onExpire={() => {
              setError('CAPTCHA expired. Please verify again.');
              setTurnstileToken(null);
            }}
            theme="light"
            size="normal"
            responseField={false}
            refreshExpired="auto"
            appearance="interaction-only" // Using a more modern appearance
          />
        </div>
        <div className="forgot-password-link">
          <span 
            onClick={handleForgotPassword}
            className="text-link"
          >
            Forgot Password?
          </span>
        </div>
        <button 
          type="submit" 
          className="litigant-submit-btn"
          disabled={loading || !turnstileToken}
        >
          {loading ? 'Processing...' : 'Login'}
        </button>
      </form>
    </div>
  );
  
  const renderEnterOTPForm = () => (
    <div className={`view-transition ${animating ? 'fade-out' : 'fade-in'}`}>
      <h2 className="litigant-title">Reset Password</h2>
      {error && <div className="litigant-error-box">{error}</div>}
      {message && <div className="litigant-success-box">{message}</div>}
      <form onSubmit={handleResetSubmit}>
        <div className="litigant-form-group">
          <label className="litigant-label">Enter OTP</label>
          <input
            type="text"
            name="otp"
            value={resetData.otp}
            onChange={handleResetChange}
            className="litigant-input"
            required
            autoFocus
            maxLength="6"
          />
          <div className="form-hint">
            Enter the OTP sent to your registered email address
          </div>
        </div>
        <div className="litigant-form-group">
          <label className="litigant-label">New Password</label>
          <input
            type="password"
            name="newPassword"
            value={resetData.newPassword}
            onChange={handleResetChange}
            className="litigant-input"
            required
          />
          {resetData.newPassword && (
            <>
              <div className="password-strength">
                <div className={`password-strength-meter ${getPasswordStrengthClass()}`}></div>
              </div>
              <div style={{textAlign: 'right', fontSize: '0.8rem', marginTop: '0.25rem', color: passwordStrength === 1 ? '#dc3545' : passwordStrength === 2 ? '#ffc107' : '#198754'}}>
                {getPasswordStrengthLabel()}
              </div>
            </>
          )}
        </div>
        <div className="litigant-form-group">
          <label className="litigant-label">Confirm New Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={resetData.confirmPassword}
            onChange={handleResetChange}
            className="litigant-input"
            required
          />
          {resetData.confirmPassword && resetData.newPassword !== resetData.confirmPassword && (
            <div style={{color: '#dc3545', fontSize: '0.8rem', marginTop: '0.25rem'}}>
              Passwords do not match
            </div>
          )}
        </div>
        <div className="form-actions">
          <button 
            type="button" 
            className="litigant-secondary-btn"
            onClick={() => changeView('login')}
          >
            Back to Login
          </button>
          <button 
            type="submit" 
            className="litigant-submit-btn"
            disabled={loading || resetData.newPassword !== resetData.confirmPassword || passwordStrength < 2}
          >
            {loading  ? 'Processing...' : 'Reset Password'}
          </button>
        </div>
      </form>
    </div>
  );
  
  const renderCurrentView = () => {
    switch(view) {
      case 'enterOTP':
        return renderEnterOTPForm();
      default:
        return renderLoginForm();
    }
  };

  return (
    <div className="litigant-container">
      <div className="litigant-login-box">
        <img 
          src="../images/aadiimage4.svg" 
          alt="Official Logo" 
          className="official-logo"
        />
        <div className="secure-authentication">
          Secure Authentication
        </div>
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default LitigantLogin;