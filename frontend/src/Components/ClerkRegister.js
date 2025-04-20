import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../ComponentsCSS/ClerkRegister.css';

const ClerkRegistration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [clerk_id, setClerkId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    district: '',
    court_name: '',
    court_no: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });
  const [emailOTP, setEmailOTP] = useState('');

  const handleRegistration = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/clerk/register', {
        name: formData.name,
        gender: formData.gender,
        district: formData.district,
        court_name: formData.court_name,
        court_no: formData.court_no,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password
      });

      setClerkId(response.data.clerk_id);
      setStep(2);
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    }
  };

  const handleEmailVerification = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/clerk/verify-email', {
        clerk_id,
        otp: emailOTP
      });
      navigate('/clerk/login');
    } catch (error) {
      setError(error.response?.data?.message || 'Verification failed');
    }
  };

  return (
    <div className="clerk-registration-container">
      <div className="clerk-registration-box">
        <h2 className="clerk-registration-heading">Court Clerk Registration</h2>

        {error && (
          <div className="clerk-registration-error">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRegistration} className="clerk-registration-form">
            <div className="clerk-registration-field">
              <label className="clerk-registration-label">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="clerk-registration-input"
                required
              />
            </div>

            <div className="clerk-registration-field">
              <label className="clerk-registration-label">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                className="clerk-registration-select"
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="clerk-registration-field">
              <label className="clerk-registration-label">District</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({...formData, district: e.target.value})}
                className="clerk-registration-input"
                required
              />
            </div>

            <div className="clerk-registration-field">
              <label className="clerk-registration-label">Court Name</label>
              <input
                type="text"
                value={formData.court_name}
                onChange={(e) => setFormData({...formData, court_name: e.target.value})}
                className="clerk-registration-input"
                required
              />
            </div>

            <div className="clerk-registration-field">
              <label className="clerk-registration-label">Court Number</label>
              <input
                type="text"
                value={formData.court_no}
                onChange={(e) => setFormData({...formData, court_no: e.target.value})}
                className="clerk-registration-input"
                required
              />
            </div>

            <div className="clerk-registration-field">
              <label className="clerk-registration-label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="clerk-registration-input"
                required
              />
            </div>

            <div className="clerk-registration-field">
              <label className="clerk-registration-label">Mobile Number</label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                className="clerk-registration-input"
                required
              />
            </div>

            <div className="clerk-registration-field">
              <label className="clerk-registration-label">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="clerk-registration-input"
                required
                minLength={6}
              />
            </div>

            <div className="clerk-registration-field">
              <label className="clerk-registration-label">Confirm Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="clerk-registration-input"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="clerk-registration-submit-btn"
            >
              Register
            </button>

            <p className="clerk-registration-login-text">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/clerk/login')}
                className="clerk-registration-login-link"
              >
                Login here
              </button>
            </p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleEmailVerification} className="clerk-verification-form">
            <div className="clerk-verification-field">
              <label className="clerk-verification-label">Email Verification OTP</label>
              <input
                type="text"
                value={emailOTP}
                onChange={(e) => setEmailOTP(e.target.value)}
                className="clerk-verification-input"
                required
              />
              <p className="clerk-verification-instructions">
                Please enter the OTP sent to your email address
              </p>
            </div>

            <button
              type="submit"
              className="clerk-verification-submit-btn"
            >
              Verify Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ClerkRegistration;
