import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../ComponentsCSS/Login.css';

const AdvocateLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/advocate/login', formData);
      localStorage.setItem('token', response.data.token);
      navigate('/advdash');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="advocate-container">
      <div className="advocate-login-box">
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
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="advocate-input"
              required
            />
          </div>
          <button type="submit" className="advocate-submit-btn">Login</button>
        </form>
      </div>
    </div>
  );
};

export default AdvocateLogin;