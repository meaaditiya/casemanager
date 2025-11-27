import React, { useState ,useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../ComponentsCSS/Register.css';
const AdvocateRegistration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [advocate_id, setAdvocateId] = useState('');
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  // Enrollment verification data
  const [enrollmentData, setEnrollmentData] = useState({
    enrollment_no: '',
    name: '',
    district: '',
    date_of_registration: '',
    fathers_name: ''
  });

  // Main registration form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    gender: '',
    dob: '',
    address: '',
    iCOP_number: '',
    barId: '',
    cop_document: null,
    practice_details: {
      district_court: false,
      high_court: false,
      state: '',
      district: '',
      high_court_bench: ''
    }
  });
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await fetch('https://ecourt-yr51.onrender.com/api/states');
        if (response.ok) {
          const data = await response.json();
          setStates(data);
        }
      } catch (error) {
        console.error('Error fetching states:', error);
      }
    };
    fetchStates();
  }, []);
  
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!formData.practice_details.state) return;
      try {
        const response = await fetch(`https://ecourt-yr51.onrender.com/api/districts/${formData.practice_details.state}`);
        if (response.ok) {
          const data = await response.json();
          setDistricts(data);
        }
      } catch (error) {
        console.error('Error fetching districts:', error);
      }
    };
    fetchDistricts();
  }, [formData.practice_details.state]);
  // OTP verification
  const [emailOTP, setEmailOTP] = useState('');

  const handleEnrollmentVerification = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const dateObj = new Date(enrollmentData.date_of_registration);
      const formattedDate = `${(dateObj.getMonth() + 1)}/${dateObj.getDate()}/${dateObj.getFullYear()}`;

      const response = await axios.post(
        'https://ecourt-yr51.onrender.com/api/advocate/verify-enrollment',
        { ...enrollmentData, date_of_registration: formattedDate }
      );

      if (response.data.message === 'Enrollment verified successfully') {
        setStep(2);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Verification failed');
    }
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const registrationFormData = new FormData();
      
      // Add basic fields
      Object.keys(formData).forEach(key => {
        if (key !== 'practice_details' && key !== 'confirmPassword' && key !== 'cop_document') {
          registrationFormData.append(key, formData[key]);
        }
      });

      // Add enrollment data
      Object.keys(enrollmentData).forEach(key => {
        registrationFormData.append(key, enrollmentData[key]);
      });

      // Add practice details
      Object.keys(formData.practice_details).forEach(key => {
        registrationFormData.append(`practice_details[${key}]`, formData.practice_details[key]);
      });

      // Add COP document
      if (formData.cop_document) {
        registrationFormData.append('cop_document', formData.cop_document);
      }

      const response = await axios.post(
        'https://ecourt-yr51.onrender.com/api/advocate/register',
        registrationFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setAdvocateId(response.data.advocate_id);
      setStep(3);
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    }
  };

  const handleEmailVerification = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://ecourt-yr51.onrender.com/api/advocate/verify-email', {
        advocate_id,
        otp: emailOTP
      });
      navigate('/advlogin');
    } catch (error) {
      setError(error.response?.data?.message || 'Verification failed');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Advocate Registration</h2>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleEnrollmentVerification} className="space-y-4">
            <div>
              <label className="block mb-1">Enrollment Number</label>
              <input
                type="text"
                value={enrollmentData.enrollment_no}
                onChange={(e) => setEnrollmentData({
                  ...enrollmentData,
                  enrollment_no: e.target.value
                })}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1">Name</label>
              <input
                type="text"
                value={enrollmentData.name}
                onChange={(e) => setEnrollmentData({
                  ...enrollmentData,
                  name: e.target.value
                })}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1">Father's Name</label>
              <input
                type="text"
                value={enrollmentData.fathers_name}
                onChange={(e) => setEnrollmentData({
                  ...enrollmentData,
                  fathers_name: e.target.value
                })}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1">District</label>
              <input
                type="text"
                value={enrollmentData.district}
                onChange={(e) => setEnrollmentData({
                  ...enrollmentData,
                  district: e.target.value
                })}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1">Date of Registration</label>
              <input
                type="date"
                value={enrollmentData.date_of_registration}
                onChange={(e) => setEnrollmentData({
                  ...enrollmentData,
                  date_of_registration: e.target.value
                })}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              Verify Enrollment
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleRegistration} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Mobile</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">iCOP Number</label>
                <input
                  type="text"
                  value={formData.iCOP_number}
                  onChange={(e) => setFormData({...formData, iCOP_number: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Bar ID</label>
                <input
                  type="text"
                  value={formData.barId}
                  onChange={(e) => setFormData({...formData, barId: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">COP Document (PDF only)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFormData({
                    ...formData,
                    cop_document: e.target.files[0]
                  })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>

            <div className="border p-4 rounded mt-4">
              <h3 className="font-semibold mb-3">Practice Details</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.practice_details.district_court}
                      onChange={(e) => setFormData({
                        ...formData,
                        practice_details: {
                          ...formData.practice_details,
                          district_court: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    District Court
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.practice_details.high_court}
                      onChange={(e) => setFormData({
                        ...formData,
                        practice_details: {
                          ...formData.practice_details,
                          high_court: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    High Court
                  </label>
                </div>
                <div>
  <label className="block mb-1">State</label>
  <select
    value={formData.practice_details.state}
    onChange={(e) => setFormData({
      ...formData,
      practice_details: {
        ...formData.practice_details,
        state: e.target.value,
        district: '' // Reset district when state changes
      }
    })}
    className="w-full p-2 border rounded"
  >
    <option value="">Select State</option>
    {states.map((state) => (
      <option key={state} value={state}>
        {state}
      </option>
    ))}
  </select>
</div>

<div>
  <label className="block mb-1">Practice District</label>
  <select
    value={formData.practice_details.district}
    onChange={(e) => setFormData({
      ...formData,
      practice_details: {
        ...formData.practice_details,
        district: e.target.value
      }
    })}
    className="w-full p-2 border rounded"
  >
    <option value="">Select District</option>
    {districts.map((district) => (
      <option key={district} value={district}>
        {district}
      </option>
    ))}
  </select>
</div>
            

                <div>
                  <label className="block mb-1">High Court Bench</label>
                  <input
                    type="text"
                    value={formData.practice_details.high_court_bench}
                    onChange={(e) => setFormData({
                      ...formData,
                      practice_details: {
                        ...formData.practice_details,
                        high_court_bench: e.target.value
                      }
                    })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              Register
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleEmailVerification} className="space-y-4">
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
          </form>
        )}
      </div>
    </div>
  );
};

export default AdvocateRegistration;