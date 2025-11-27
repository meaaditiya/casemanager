import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../ComponentsCSS/litigantmeeting.css';
import { QRCodeSVG } from 'qrcode.react';  // We'll use this library for QR code generation

const LitigantMeetingPanel = () => {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState('');
  const [meetingData, setMeetingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [meetingLink, setMeetingLink] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);
  const [showQrCode, setShowQrCode] = useState(false); // State to toggle QR code visibility
  const qrRef = useRef(null); // Create a ref for the QR code SVG element

  // Get user info and fetch cases on component mount
  useEffect(() => {
    fetchUserProfile();
    fetchCases();
  }, []);

  // Update time remaining when meetingData changes
  useEffect(() => {
    if (meetingData) {
      updateTimeRemaining(meetingData.startDateTime, meetingData.endDateTime);
    }
  }, [meetingData]);

  // Fetch user profile information
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const userResponse = await axios.get(
        'https://ecourt-yr51.onrender.com/api/litigant/profile',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUserInfo(userResponse.data.litigant);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error.response?.data?.message || error.message);
      setMessage({
        text: error.response?.data?.message || 'Failed to fetch your profile information',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch cases for the litigant
  const fetchCases = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const casesResponse = await axios.get(
        'https://ecourt-yr51.onrender.com/api/cases/litigant',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCases(casesResponse.data.cases);
    } catch (error) {
      console.error('Error fetching cases:', error);
      setError(error.response?.data?.message || 'Failed to fetch cases');
      setMessage({
        text: error.response?.data?.message || 'Failed to fetch your cases',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle case selection change
  const handleCaseChange = (e) => {
    const newCase = e.target.value;
    setSelectedCase(newCase);
    setMessage({ text: '', type: '' });
    setMeetingData(null);
    setMeetingLink(null);
    setOtpSent(false);
    setOtp('');
    setTimeRemaining(null);
    setShowQrCode(false); // Reset QR code visibility
    
    if (newCase) {
      checkMeetingExists(newCase);
    }
  };

  // Check if meeting exists for selected case
  const checkMeetingExists = async (caseNum) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      try {
        await axios.get(
          `https://ecourt-yr51.onrender.com/api/case/${caseNum}/video-meeting`, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Even if meeting exists, don't set meetingLink here
        // Instead, store meetingData and prompt for OTP
        setMeetingData({
          startDateTime: new Date(),
          endDateTime: new Date(Date.now() + 3600000) // Placeholder for active meeting
        });
        
        setMessage({
          text: 'A meeting is scheduled. Request an OTP to access it.',
          type: 'info'
        });
      } catch (error) {
        if (error.response) {
          if (error.response.status === 404) {
            setMessage({
              text: 'No active video meeting found for this case',
              type: 'info'
            });
            setMeetingData(null);
            return;
          } else if (error.response.status === 403 && error.response.data.startDateTime && error.response.data.endDateTime) {
            setMeetingData({
              startDateTime: new Date(error.response.data.startDateTime),
              endDateTime: new Date(error.response.data.endDateTime)
            });
            
            setMessage({
              text: 'A meeting is scheduled. Request an OTP to access it.',
              type: 'info'
            });
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error checking meeting status:', error);
      setMessage({
        text: error.response?.data?.message || 'Unable to check meeting status',
        type: 'error'
      });
      setMeetingData(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to update time remaining
  const updateTimeRemaining = (startDate, endDate) => {
    const now = new Date();
    startDate = new Date(startDate);
    endDate = new Date(endDate);
    
    if (now >= startDate && now <= endDate) {
      setTimeRemaining('Meeting is currently active');
    } else if (now < startDate) {
      const diffMs = startDate - now;
      const diffDays = Math.floor(diffMs / 86400000);
      const diffHrs = Math.floor((diffMs % 86400000) / 3600000);
      const diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
      
      setTimeRemaining(`Meeting starts in ${diffDays > 0 ? `${diffDays} days, ` : ''}${diffHrs} hours and ${diffMins} minutes`);
    } else {
      setTimeRemaining('Meeting has ended');
    }
  };

  // Request OTP for meeting access
  const requestOTP = async () => {
    if (!selectedCase || !userInfo?.contact.email) {
      setMessage({
        text: 'Unable to identify your email address',
        type: 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      setMessage({ text: '', type: '' });
      
      const response = await axios.post(
        `https://ecourt-yr51.onrender.com/api/case/${selectedCase}/video-meeting/request-access`, 
        { email: userInfo.contact.email }
      );
      
      setOtpSent(true);
      setMessage({
        text: `OTP sent to ${userInfo.contact.email}. Please check and enter below.`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error requesting OTP:', error);
      setMessage({
        text: error.response?.data?.message || 'Failed to send OTP',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP to get meeting link
  const verifyOTP = async () => {
    if (!selectedCase || !userInfo?.contact.email || !otp) {
      setMessage({
        text: 'Please enter the OTP you received',
        type: 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      setMessage({ text: '', type: '' });
      
      const response = await axios.post(
        `https://ecourt-yr51.onrender.com/api/case/${selectedCase}/video-meeting/verify-otp`, 
        { email: userInfo.contact.email, otp: otp }
      );
      
      setMeetingLink(response.data.meetingLink);
      setMeetingData({
        startDateTime: new Date(response.data.startDateTime),
        endDateTime: new Date(response.data.endDateTime)
      });
      
      setMessage({
        text: 'OTP verified successfully! You can now join the meeting.',
        type: 'success'
      });
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setMessage({
        text: error.response?.data?.message || 'Invalid or expired OTP',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle QR code visibility
  const toggleQrCode = () => {
    setShowQrCode(!showQrCode);
  };

  // Download QR code as SVG
  const downloadQrCode = () => {
    if (qrRef.current) {
      // Get the SVG element
      const svgElement = qrRef.current;
      
      // Clone the SVG to avoid modifying the rendered one
      const svgClone = svgElement.cloneNode(true);
      
      // Convert SVG to string
      const svgData = new XMLSerializer().serializeToString(svgClone);
      
      // Create a Blob from the SVG string
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      
      // Create URL for the Blob
      const svgUrl = URL.createObjectURL(svgBlob);
      
      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = `meeting-qr-${selectedCase}.svg`;
      
      // Trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Release the object URL
      URL.revokeObjectURL(svgUrl);
    }
  };

  return (
    <div className="litigant-panel">
      <h2 className="panel-title">Video Meeting Access</h2>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <div className="case-selection">
        <label className="form-label">Select Your Case</label>
        <select 
          value={selectedCase} 
          onChange={handleCaseChange}
          className="case-select"
          disabled={loading}
        >
          <option value="">-- Select a Case --</option>
          {cases.map(caseItem => (
            <option key={caseItem.case_num} value={caseItem.case_num}>
              Case #{caseItem.case_num} - {caseItem.case_title || 
                ('vs. ' + (caseItem.plaintiff_details?.party_id === userInfo?.party_id ? 
                caseItem.respondent_details?.name : caseItem.plaintiff_details?.name))}
            </option>
          ))}
        </select>
      </div>
      
      {selectedCase && meetingData && (
        <div className="meeting-info">
          <div className="info-box">
            <h4 className="info-title">Meeting Information</h4>
            <p className="info-text">
              <strong>Start:</strong> {meetingData.startDateTime.toLocaleString()}
            </p>
            <p className="info-text">
              <strong>End:</strong> {meetingData.endDateTime.toLocaleString()}
            </p>
            {timeRemaining && (
              <p className={`time-remaining ${timeRemaining.includes('active') ? 'active' : ''}`}>
                {timeRemaining}
              </p>
            )}
          </div>
          
          {!otpSent && timeRemaining?.includes('active') && (
            <div className="access-request">
              <button
                onClick={requestOTP}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Processing...' : 'Request Access via OTP'}
              </button>
              <p className="helper-text">
                An OTP will be sent to your registered email: {userInfo?.email}
              </p>
            </div>
          )}
          
          {otpSent && !meetingLink && (
            <div className="otp-verification">
              <div className="form-group">
                <label className="form-label">Enter OTP received at {userInfo?.contact.email}</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="form-input"
                  maxLength={6}
                />
              </div>
              
              <div className="button-group">
                <button
                  onClick={verifyOTP}
                  disabled={loading || !otp}
                  className="btn btn-primary"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                
                <button
                  onClick={requestOTP}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  Resend OTP
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {meetingLink && (
        <div className="meeting-access">
          <div className="success-box">
            <p className="success-message">
              You are authorized to join this meeting.
            </p>
            
            <div className="meeting-access-options">
              <a
                href={meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="join-meeting-btn"
              >
                Join Meeting Now
              </a>
            </div>
            
            <div className="qr-code-container">
              <div className="qr-code-wrapper">
                <QRCodeSVG
                  ref={qrRef}
                  id="meeting-qr-code"
                  value={meetingLink}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="qr-code-instructions">
                <p>Scan this QR code with your mobile device to join the meeting</p>
                <button
                  onClick={downloadQrCode}
                  className="download-qr-btn"
                  type="button"
                >
                  Download QR Code
                </button>
              </div>
            </div>
          </div>
          
          <p className="instructions">
            Please ensure your camera and microphone are working properly before joining.
          </p>
        </div>
      )}
      
      {selectedCase && !meetingData && !loading && (
        <p className="no-meeting-message">
          No meeting scheduled for this case at the moment.
        </p>
      )}
      
      {!selectedCase && cases.length > 0 && (
        <p className="select-case-prompt">
          Please select a case to access video meeting details.
        </p>
      )}
      
      {cases.length === 0 && !loading && (
        <p className="no-cases-message">
          No cases found. Please contact court administration if you believe this is an error.
        </p>
      )}
      
      {loading && (
        <div className="loading-indicator">
          <span className="loading-spinner"></span>
          <span>Loading...</span>
        </div>
      )}
    </div>
  );
};

export default LitigantMeetingPanel;