import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../ComponentsCSS/adminmeeting.css';
const AdminMeetingPanel = () => {
  const [meetingData, setMeetingData] = useState({
    meetingLink: '',
    startDateTime: '',
    endDateTime: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [error, setError] = useState(null);
  const [existingMeeting, setExistingMeeting] = useState(null);
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState('');

  // Fetch cases on component mount
  useEffect(() => {
    fetchCases();
  }, []);

  // Fetch all cases for admin
  const fetchCases = async () => {
    try {
      setLoading(true);

      // Get token with explicit error handling
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      console.log('Using token:', token.substring(0, 10) + '...');

      const response = await axios.get('http://localhost:5000/api/cases/admin', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setCases(response.data.cases || []);
      setLoading(false);
      setError(null);
      setMessage({ text: '', type: '' });
    } catch (err) {
      console.error('Full error object:', err);

      if (!localStorage.getItem('token')) {
        setError('No authentication token found. Please login again.');
      } else if (err.response && err.response.status === 403) {
        setError('Access denied: Only court administrators can view this data');
      } else if (err.response && err.response.status === 401) {
        setError('Authentication failed. Please login again.');
        // Clear invalid token
        localStorage.removeItem('token');
        // Redirect to login page
        setTimeout(() => {
          window.location.href = '/login'; // Adjust path as needed
        }, 2000);
      } else {
        setError(
          `Failed to fetch cases: ${err.response?.data?.message || err.message}`
        );
      }

      setLoading(false);
      setCases([]);
    }
  };

  // Handle case selection change
  const handleCaseChange = (e) => {
    const caseNum = e.target.value;
    setSelectedCase(caseNum);
    setMeetingData({
      meetingLink: '',
      startDateTime: '',
      endDateTime: '',
      isActive: true,
    });
    setExistingMeeting(null);
    setMessage({ text: '', type: '' });
    setError(null);

    if (caseNum) {
      fetchExistingMeeting(caseNum);
    }
  };

  // Fetch existing meeting data if available
  const fetchExistingMeeting = async (caseNum) => {
    if (!caseNum) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const response = await axios.get(
        `http://localhost:5000/api/case/${caseNum}/video-meeting`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.meetingLink) {
        setExistingMeeting(response.data);

        // Format dates for datetime-local input
        const formatDate = (dateString) => {
          const date = new Date(dateString);
          return date.toISOString().slice(0, 16);
        };

        setMeetingData({
          meetingLink: response.data.meetingLink,
          startDateTime: formatDate(response.data.startDateTime),
          endDateTime: formatDate(response.data.endDateTime),
          isActive: response.data.isActive,
        });
        setMessage({ text: 'Existing meeting loaded.', type: 'info' });
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setMessage({ text: 'No existing meeting found for this case.', type: 'info' });
      } else {
        setMessage({
          text: error.response?.data?.message || 'Failed to fetch meeting details',
          type: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes for form fields
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMeetingData({
      ...meetingData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Handle form submission to add or update meeting
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCase) {
      setMessage({ text: 'Please select a case first.', type: 'error' });
      return;
    }

    // Validate dates
    const start = new Date(meetingData.startDateTime);
    const end = new Date(meetingData.endDateTime);
    if (start >= end) {
      setMessage({ text: 'End time must be after start time.', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      setMessage({ text: '', type: '' });
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const endpoint = `http://localhost:5000/api/case/${selectedCase}/video-meeting`;
      const method = existingMeeting ? 'put' : 'post';

      const response = await axios[method](endpoint, meetingData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage({
        text: response.data.message || 'Meeting details saved successfully',
        type: 'success',
      });

      setExistingMeeting(response.data.videoMeeting || meetingData);
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || 'Error saving meeting details',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle meeting deactivation
  const handleDeactivate = async () => {
    if (!existingMeeting || !selectedCase) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const response = await axios.put(
        `http://localhost:5000/api/case/${selectedCase}/video-meeting`,
        { ...meetingData, isActive: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({
        text: response.data.message || 'Meeting deactivated successfully',
        type: 'success',
      });

      setMeetingData({
        ...meetingData,
        isActive: false,
      });
      setExistingMeeting({ ...existingMeeting, isActive: false });
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || 'Error deactivating meeting',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-panel">
      <h2 className="panel-title">Video Meeting Administration</h2>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {error && (
        <div className="message error">
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-indicator">
          <span className="loading-spinner"></span>
          <span>Loading...</span>
        </div>
      )}

      <div className="case-selection">
        <label className="form-label">Select Case</label>
        <select
          value={selectedCase}
          onChange={handleCaseChange}
          className="case-select"
          disabled={loading}
        >
          <option value="">-- Select a Case --</option>
          {cases.map((caseItem) => (
            <option key={caseItem.case_num} value={caseItem.case_num}>
              Case #{caseItem.case_num} -{' '}
              {caseItem.plaintiff_details?.name || 'Plaintiff'} vs{' '}
              {caseItem.respondent_details?.name || 'Respondent'}
            </option>
          ))}
        </select>
      </div>

      {cases.length === 0 && !loading && !error && (
        <p className="no-cases-message">
          No cases found. Please check with the system administrator.
        </p>
      )}

      {selectedCase && (
        <form onSubmit={handleSubmit} className="meeting-form">
          <div className="form-group">
            <label className="form-label">Meeting Link</label>
            <input
              type="url"
              name="meetingLink"
              value={meetingData.meetingLink}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="https://meet.zoom.us/..."
            />
          </div>

          <div className="date-group">
            <div className="form-group">
              <label className="form-label">Start Date & Time</label>
              <input
                type="datetime-local"
                name="startDateTime"
                value={meetingData.startDateTime}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date & Time</label>
              <input
                type="datetime-local"
                name="endDateTime"
                value={meetingData.endDateTime}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              checked={meetingData.isActive}
              onChange={handleInputChange}
              className="form-checkbox"
            />
            <label htmlFor="isActive" className="checkbox-label">
              Meeting is active
            </label>
          </div>

          <div className="button-group">
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading
                ? 'Saving...'
                : existingMeeting
                ? 'Update Meeting'
                : 'Add Meeting'}
            </button>

            {existingMeeting && meetingData.isActive && (
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={loading}
                className="btn btn-danger"
              >
                {loading ? 'Deactivating...' : 'Deactivate Meeting'}
              </button>
            )}
          </div>
        </form>
      )}

      {existingMeeting && (
        <div className="info-box">
          <h4 className="info-title">Meeting Information</h4>
          <p className="info-text">
            <strong>Status:</strong> {meetingData.isActive ? 'Active' : 'Inactive'}
          </p>
          <p className="info-text">
            <strong>Note:</strong> Meeting links are accessible to litigants only
            after OTP verification.
          </p>
        </div>
      )}

      {!selectedCase && cases.length > 0 && !loading && (
        <p className="select-case-prompt">
          Please select a case to manage video meeting details.
        </p>
      )}
    </div>
  );
};

export default AdminMeetingPanel;