import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../ComponentsCSS/LitigantLogin.css';

const LitigantLogin = () => {
  const navigate = useNavigate();
  
  // State to track which view to show with animation control
  const [view, setView] = useState('login'); // 'login', 'enterOTP'
  const [animating, setAnimating] = useState(false);
  const [party_id, setPartyId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  // Reset password state
  const [resetData, setResetData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState(0); // 0: none, 1: weak, 2: medium, 3: strong
  
  // Handle login form changes
  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };
  
  // Handle reset password form changes
  const handleResetChange = (e) => {
    const { name, value } = e.target;
    
    setResetData({
      ...resetData,
      [name]: value
    });
    
    // Check password strength when new password changes
    if (name === 'newPassword') {
      checkPasswordStrength(value);
    }
  };
  
  // Password strength checker
  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    // Convert to scale of 3
    setPasswordStrength(strength >= 4 ? 3 : (strength >= 2 ? 2 : 1));
  };
  
  // Change view with animation
  const changeView = (newView) => {
    setAnimating(true);
    setTimeout(() => {
      setView(newView);
      setError('');
      setMessage('');
      setAnimating(false);
    }, 300);
  };
  
  // Handle login form submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/litigant/login', {
        email: loginData.email,
        password: loginData.password
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userType', 'litigant');
      localStorage.setItem('userData', JSON.stringify(response.data.litigant));
      
      navigate('/litidash');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle forgot password request
  const handleForgotPassword = async () => {
    if (!loginData.email) {
      setError('Please enter your email address first');
      return;
    }
    
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/litigant/forgot-password', { 
        email: loginData.email 
      });
      
      setMessage(response.data.message);
      setPartyId(response.data.party_id);
      changeView('enterOTP');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle reset password form submission
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    // Validate password match
    if (resetData.newPassword !== resetData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (passwordStrength < 2) {
      setError('Please use a stronger password');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/litigant/reset-password', {
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
  
  // Get strength class for password meter
  const getPasswordStrengthClass = () => {
    switch (passwordStrength) {
      case 1: return 'strength-weak';
      case 2: return 'strength-medium';
      case 3: return 'strength-strong';
      default: return '';
    }
  };
  
  // Get strength label
  const getPasswordStrengthLabel = () => {
    switch (passwordStrength) {
      case 1: return 'Weak';
      case 2: return 'Medium';
      case 3: return 'Strong';
      default: return '';
    }
  };
  
  // Render login form
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
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Login'}
        </button>
      </form>
    </div>
  );
  
  // Render enter OTP and reset password form
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
            {loading ? 'Processing...' : 'Reset Password'}
          </button>
        </div>
      </form>
    </div>
  );
  
  // Switch between different views based on the current state
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
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default LitigantLogin;