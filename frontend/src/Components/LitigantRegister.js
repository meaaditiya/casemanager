import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../ComponentsCSS/Register.css';

const LitigantRegistration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [partyId, setPartyId] = useState('');
  const [emailOTP, setEmailOTP] = useState('');

  const [formData, setFormData] = useState({
    party_type: '',
    full_name: '',
    parentage: '',
    gender: '',
    street: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });

  // List of Indian states for dropdown
  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ];

  const handleRegistration = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const registrationData = {
        party_type: formData.party_type,
        full_name: formData.full_name,
        parentage: formData.parentage,
        gender: formData.gender,
        street: formData.street,
        city: formData.city,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password
      };

      const response = await axios.post(
        'https://ecourt-yr51.onrender.com/api/litigant/register',
        registrationData
      );

      setPartyId(response.data.party_id);
      setStep(2);
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    }
  };

  const handleEmailVerification = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://ecourt-yr51.onrender.com/api/litigant/verify-email', {
        party_id: partyId,
        otp: emailOTP
      });

      navigate('/litilogin');
    } catch (error) {
      setError(error.response?.data?.message || 'Verification failed');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Litigant Registration</h2>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRegistration}>
            <div className="space-y-4">
              <div>
                <label className="block mb-1">Party Type</label>
                <select
                  name="party_type"
                  value={formData.party_type}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select Party Type</option>
                  <option value="plaintiff">Plaintiff</option>
                  <option value="defendant">Defendant</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Parent's Name</label>
                <input
                  type="text"
                  name="parentage"
                  value={formData.parentage}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Address Fields */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold mb-2">Address Details</h3>
                
                <div className="mb-3">
                  <label className="block mb-1">Street/House/Village</label>
                  <textarea
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    rows="2"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1">District</label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block mb-1">State</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full p-2 border rounded"
                      required
                    >
                      <option value="">Select State</option>
                      {indianStates.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block mb-1">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      className="w-full p-2 border rounded"
                      pattern="[0-9]{6}"
                      placeholder="6-digit pincode"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Mobile</label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  pattern="[0-9]{10}"
                  placeholder="10-digit mobile number"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
              >
                Register
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleEmailVerification}>
            <div className="space-y-4">
              <div>
                <label className="block mb-1">Email OTP</label>
                <input
                  type="text"
                  value={emailOTP}
                  onChange={(e) => setEmailOTP(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  Please enter the OTP sent to your email address
                </p>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
              >
                Verify Email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LitigantRegistration;