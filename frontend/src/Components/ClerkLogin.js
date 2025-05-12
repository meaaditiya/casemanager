import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Turnstile } from '@marsidev/react-turnstile';
import '../ComponentsCSS/ClerkLogin.css';

const ClerkLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState(null);
  const turnstileRef = useRef(null);

  const siteKey = "0x4AAAAAABUex35iY9OmXSBB";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!turnstileToken) {
      setError('Please complete the CAPTCHA verification');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('https://ecourt-yr51.onrender.com/api/clerk/login', {
        ...formData,
        'cf-turnstile-response': turnstileToken
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userType', 'clerk');
      localStorage.setItem('userData', JSON.stringify(response.data.clerk));
      navigate('/clerkdash');
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

  return (
    <div className="clerk-container">
      <div className="clerk-login-box">
        <img 
          src="../images/aadiimage4.svg" 
          alt="Official Logo" 
          className="official-logo"
        />
        <div className="secure-authentication2">
          Secure Authentication
        </div>
        <h2 className="clerk-title">Clerk Login</h2>

        {error && (
          <div className="clerk-error-box">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="clerk-form-group">
            <label className="clerk-label">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="clerk-input"
              required
            />
          </div>
          <div className="clerk-form-group">
            <label className="clerk-label">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="clerk-input"
              required
            />
          </div>
          <div className="clerk-form-group turnstile-container">
            <Turnstile
              ref={turnstileRef}
              siteKey={siteKey}
              onSuccess={(token) => {
                setTurnstileToken(token);
                setError('');
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
              appearance="interaction-only"
            />
          </div>
          <button 
            type="submit" 
            className="clerk-submit-btn"
            disabled={loading || !turnstileToken}
          >
            {loading ? 'Processing...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClerkLogin;