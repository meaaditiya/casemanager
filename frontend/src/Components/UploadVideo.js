import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VideoRecorder from './Videoplead'; 
import { useNavigate } from 'react-router-dom';

const UploadVideoPleading = () => {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const navigate = useNavigate();

  // Fetch authentication token and cases on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const storedToken = localStorage.getItem('token');
        setToken(storedToken);
        
        const response = await axios.get(
            'https://ecourt-yr51.onrender.com/api/cases/litigant',
            { headers: { Authorization: `Bearer ${storedToken}` } }
        );
        
        setCases(response.data.cases);
      } catch (err) {
        console.error('Error fetching cases:', err);
        setError(
          err.response?.data?.message || 'Failed to load cases. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Handle case selection
  const handleCaseSelect = (e) => {
    setSelectedCase(e.target.value);
    setError(''); // Clear any previous errors
  };

  // Toggle user guide visibility
  const toggleGuide = () => {
    setShowGuide(!showGuide);
  };

  return (
    <div className="video-pleading-container">
      <div className="header">
        <div className="logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 8V16H5V8H15ZM16 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.55 18 17 17.55 17 17V13.5L21 17.5V6.5L17 10.5V7C17 6.45 16.55 6 16 6Z" fill="#2563EB"/>
          </svg>
          <span>LegalVideo</span>
        </div>
        <h1>Video Pleading Submission</h1>
      </div>

      <div className="content-container">
        <div className="info-panel">
          <div className="purpose-section">
            <h2>Why Video Pleading?</h2>
            <p>Video pleadings provide a powerful alternative to traditional written submissions, allowing you to:</p>
            <ul>
              <li>Present your case with nuance and emotion</li>
              <li>Demonstrate evidence more effectively</li>
              <li>Ensure your voice is directly heard by the court</li>
              <li>Create a more personal connection with your legal arguments</li>
            </ul>
            <p>Your video will be securely transmitted to the court and become part of the official case record.</p>
          </div>

          <button className="guide-toggle" onClick={toggleGuide}>
            {showGuide ? 'Hide Recording Guide' : 'Show Recording Guide'}
          </button>
          
          {showGuide && (
            <div className="guide-section">
              <h2>How to Record Your Video Pleading</h2>
              <ol>
                <li><strong>Prepare your environment</strong> - Find a quiet location with good lighting and a neutral background.</li>
                <li><strong>Dress appropriately</strong> - Wear professional attire as you would for a court appearance.</li>
                <li><strong>Organize your thoughts</strong> - Consider preparing notes or an outline (but avoid reading directly).</li>
                <li><strong>Check your equipment</strong> - Ensure your camera and microphone are working properly.</li>
                <li><strong>Keep it concise</strong> - Videos should be under 10 minutes. Focus on key points.</li>
                <li><strong>Speak clearly</strong> - Maintain a moderate pace and enunciate your words.</li>
                <li><strong>Review before submitting</strong> - You can re-record if necessary.</li>
              </ol>
              <div className="tips">
                <h3>Pro Tips:</h3>
                <ul>
                  <li>Look directly at the camera to establish connection</li>
                  <li>Avoid excessive gestures or movements</li>
                  <li>State your name and case number at the beginning</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="recorder-panel">
          {isLoading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Loading your cases...</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" fill="currentColor"/>
              </svg>
              <p>{error}</p>
            </div>
          )}

          {!isLoading && cases.length > 0 && (
            <div className="case-selector">
              <label htmlFor="caseSelect">Select Your Case</label>
              <div className="select-wrapper">
                <select
                  id="caseSelect"
                  value={selectedCase}
                  onChange={handleCaseSelect}
                >
                  <option value="">-- Select a Case --</option>
                  {cases.map((caseItem) => (
                    <option key={caseItem.case_num} value={caseItem.case_num}>
                      Case #{caseItem.case_num} - {caseItem.case_type || 'Untitled Case'}
                    </option>
                  ))}
                </select>
                <div className="select-arrow"></div>
              </div>
            </div>
          )}

          {selectedCase && token && (
            <div className="recorder-container">
              <h3>Recording for Case #{selectedCase}</h3>
              <VideoRecorder caseNum={selectedCase} token={token} />
            </div>
          )}
          
          {selectedCase && !token && (
            <div className="error-message">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" fill="currentColor"/>
              </svg>
              <p>Authentication token not found. Please log in again.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        /* Global Styles */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        
        body {
          background-color: #ffffff;
          color: #1e293b;
          line-height: 1.6;
        }
        
        /* Container */
        .video-pleading-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          background-color: #ffffff;
        }
        
        /* Header */
        .header {
          margin-bottom: 2.5rem;
          text-align: center;
          background-color: #ffffff;
        }
        
        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          font-size: 1.5rem;
          font-weight: 700;
          color: #2563eb;
          background-color: #ffffff;
        }
        
        .logo svg {
          margin-right: 0.5rem;
        }
        
        h1 {
          font-size: 2.25rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.025em;
          margin-bottom: 0.5rem;
          background-color: #ffffff;
        }
        
        /* Content Layout */
        .content-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          align-items: start;
          background-color: #ffffff;
        }
        
        @media (max-width: 768px) {
          .content-container {
            grid-template-columns: 1fr;
          }
        }
        
        /* Info Panel */
        .info-panel {
          background-color: #ffffff;
          border-radius: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          padding: 2rem;
        }
        
        .purpose-section h2, 
        .guide-section h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e2e8f0;
          background-color: #ffffff;
        }
        
        .purpose-section p,
        .guide-section p {
          margin-bottom: 1rem;
          color: #334155;
          background-color: #ffffff;
        }
        
        .purpose-section ul,
        .guide-section ul,
        .guide-section ol {
          margin-left: 1.5rem;
          margin-bottom: 1.5rem;
          background-color: #ffffff;
        }
        
        .purpose-section li,
        .guide-section li {
          margin-bottom: 0.5rem;
          background-color: #ffffff;
        }
        
        .guide-toggle {
          display: block;
          width: 100%;
          padding: 0.75rem 1rem;
          margin: 1.5rem 0;
          background-color: #2563eb;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .guide-toggle:hover {
          background-color: #1d4ed8;
        }
        
        .guide-section {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
          background-color: #ffffff;
        }
        
        .tips {
          background-color: #ffffff;
          border-left: 4px solid #2563eb;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-top: 1rem;
        }
        
        .tips h3 {
          color: #1e40af;
          margin-bottom: 0.5rem;
          font-weight: 600;
          background-color: #ffffff;
        }
        
        /* Recorder Panel */
        .recorder-panel {
          background-color: #ffffff;
          border-radius: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          padding: 2rem;
          min-height: 400px;
          display: flex;
          flex-direction: column;
        }
        
        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          background-color: #ffffff;
        }
        
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top: 4px solid #2563eb;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-message {
          display: flex;
          align-items: center;
          padding: 1rem;
          background-color: #fee2e2;
          color: #b91c1c;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
        }
        
        .error-message svg {
          margin-right: 0.5rem;
          flex-shrink: 0;
        }
        
        .case-selector {
          margin-bottom: 2rem;
          background-color: #ffffff;
        }
        
        .case-selector label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #0f172a;
          background-color: #ffffff;
        }
        
        .select-wrapper {
          position: relative;
          background-color: #ffffff;
        }
        
        .select-wrapper select {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          border: 1px solid #cbd5e1;
          background-color: #ffffff;
          font-size: 1rem;
          color: #0f172a;
          appearance: none;
          cursor: pointer;
        }
        
        .select-arrow {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid #64748b;
          pointer-events: none;
        }
        
        .recorder-container {
          background-color: #ffffff;
          padding: 1.5rem;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          flex-grow: 1;
        }
        
        .recorder-container h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 1.5rem;
          text-align: center;
          background-color: #ffffff;
        }
      `}</style>
    </div>
  );
};

export default UploadVideoPleading;