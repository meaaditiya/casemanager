import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Turnstile } from '@marsidev/react-turnstile';
import '../ComponentsCSS/Login.css';

const AdvocateLogin = () => {
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!turnstileToken) {
      setError('Please complete the CAPTCHA verification');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/advocate/login', {
        ...formData,
        'cf-turnstile-response': turnstileToken
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userType', 'advocate');
      localStorage.setItem('userData', JSON.stringify(response.data.advocate));
      navigate('/advdash');
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
    <div className="advocate-container">
      <div className="advocate-login-box">
        <img 
          src="../images/aadiimage4.svg" 
          alt="Official Logo" 
          className="official-logo"
        />
        <div className="secure-authentication">
          Secure Authentication
        </div>
        <h2 className="advocate-title">Advocate Login</h2>
        {error && (
          <div className="advocate-error-box">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin}>
          <div className="advocate-form-group">
            <label className="advocate-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="advocate-input"
              required
            />
          </div>
          <div className="advocate-form-group">
            <label className="advocate-label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="advocate-input"
              required
            />
          </div>
          <div className="advocate-form-group turnstile-container">
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
            className="advocate-submit-btn"
            disabled={loading || !turnstileToken}
          >
            {loading ? 'Processing...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdvocateLogin;