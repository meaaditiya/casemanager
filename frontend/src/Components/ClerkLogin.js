import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../ComponentsCSS/ClerkLogin.css';

const ClerkLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/clerk/login', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userType', 'clerk');
      localStorage.setItem('userData', JSON.stringify(response.data.clerk));
      navigate('/clerkdash');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="clerk-container">
      <div className="clerk-login-box">
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
          <button type="submit" className="clerk-submit-btn">Login</button>
        </form>
      </div>
    </div>
  );
};

export default ClerkLogin;
