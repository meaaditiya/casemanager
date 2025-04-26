import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../ComponentsCSS/AdvocateDashboard.css';
import emblem from "../images/aadiimage4.svg";
import logo from "../images/aadiimage4.png";

const AdvocateDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutPassword, setLogoutPassword] = useState('');
  
  // Profile picture states
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [pictureError, setPictureError] = useState(null);
  const fileInputRef = useRef(null);
  
  // Case-related states
  const [cases, setCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(false);
  
  // Hearing-related states
  const [searchCaseNum, setSearchCaseNum] = useState('');
  const [searchedHearings, setSearchedHearings] = useState(null);
  const [hearingsLoading, setHearingsLoading] = useState(false);
  const [hearingsError, setHearingsError] = useState(null);
  
  // Document-related states
  const [selectedCaseForDocuments, setSelectedCaseForDocuments] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  const [documentError, setDocumentError] = useState(null);
  const [documentSuccess, setDocumentSuccess] = useState(null);
  
  // Active section state
  const [activeSection, setActiveSection] = useState('cases');
  
  const navigate = useNavigate();

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/advlogin');
          throw new Error('No authentication token found');
        }

        const response = await axios.get('http://localhost:5000/api/advocate/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        setProfile(response.data.advocate);
        
        // If profile has a profile picture, set it
        if (response.data.advocate.profilePicture) {
          setProfilePicture(`http://localhost:5000/api/advocate/profile-picture/${response.data.advocate.profilePicture}`);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        setLoading(false);
        if (err.response?.status === 401) {
          navigate('/advlogin');
        }
      }
    };

    fetchProfile();
  }, [navigate]);

  // Fetch advocate cases
  useEffect(() => {
    if (!loading && profile) {
      fetchCases();
    }
  }, [loading, profile]);

  const fetchCases = async () => {
    setCasesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/cases/advocate', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setCases(response.data.cases || []);
    } catch (err) {
      console.error('Error fetching cases:', err);
    } finally {
      setCasesLoading(false);
    }
  };

  // Function to handle picture upload button click
  const handleUploadButtonClick = () => {
    fileInputRef.current.click();
  };

  // Function to handle profile picture change
  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!validImageTypes.includes(file.type)) {
      setPictureError('Please select a valid image file (JPG, PNG, GIF)');
      return;
    }
    
    // Check file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setPictureError('File size should be less than 2MB');
      return;
    }
    
    setUploadingPicture(true);
    setPictureError(null);
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await axios.post(
        'http://localhost:5000/api/advocate/profile-picture',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Update profile picture in state
      setProfilePicture(`http://localhost:5000/api/advocate/profile-picture/${response.data.profilePicture.filename}?${new Date().getTime()}`);
      
    } catch (err) {
      setPictureError(err.response?.data?.message || 'Error uploading profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  // Function to handle hearing search (remaining code same as before)
  const handleHearingSearch = async (e) => {
    e.preventDefault();
    setHearingsLoading(true);
    setHearingsError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/case/${searchCaseNum}/hearings/advocate`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSearchedHearings(response.data.hearings || []);
      setHearingsLoading(false);
    } catch (err) {
      setHearingsError(err.response?.data?.message || 'Error fetching hearings');
      setHearingsLoading(false);
    }
  };

  // Function to fetch documents for a specific case (same as before)
  const fetchDocuments = async (caseNum) => {
    setDocumentsLoading(true);
    setDocumentError(null);
    
    try {
      const token = localStorage.getItem('token');
      const caseResponse = await axios.get(`http://localhost:5000/api/case/${caseNum}/documents/advocate`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Find the case details to display
      const selectedCase = cases.find(c => c.case_num === caseNum);
      setSelectedCaseForDocuments(selectedCase);
      setDocuments(caseResponse.data.documents || []);
    } catch (err) {
      setDocumentError(err.response?.data?.message || 'Error fetching documents');
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Other functions remain the same
  const handleFileChange = (e) => {
    setDocumentFile(e.target.files[0]);
  };

  const handleDocumentUpload = async (e) => {
    // Existing implementation remains the same
    e.preventDefault();
    
    if (!documentFile || !documentType) {
      setDocumentError('Please select a file and document type');
      return;
    }
    
    setDocumentsLoading(true);
    setDocumentError(null);
    setDocumentSuccess(null);
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', documentFile);
      formData.append('document_type', documentType);
      formData.append('description', documentDescription);
      
      await axios.post(
        `http://localhost:5000/api/case/${selectedCaseForDocuments.case_num}/document/advocate`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      setDocumentSuccess('Document uploaded successfully');
      
      // Refresh documents
      fetchDocuments(selectedCaseForDocuments.case_num);
      
      // Reset form
      setDocumentType('');
      setDocumentDescription('');
      setDocumentFile(null);
      // Reset file input
      document.getElementById('document-file').value = '';
      
    } catch (err) {
      setDocumentError(err.response?.data?.message || 'Error uploading document');
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Function to download document
  const downloadDocument = async (documentId, fileName) => {
    // Existing implementation remains the same
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/document/${documentId}/download/advocate`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      });
      
      // Create a blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      
      // Append to html page
      document.body.appendChild(link);
      
      // Force download
      link.click();
      
      // Clean up and remove the link
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Error downloading document:', err);
    }
  };

  const downloadAttachment = async (filename, originalname) => {
    // Existing implementation remains the same
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/files/${filename}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      });
      
      // Create a blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalname);
      
      // Append to html page
      document.body.appendChild(link);
      
      // Force download
      link.click();
      
      // Clean up and remove the link
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Error downloading attachment:', err);
    }
  };

  // Function to handle logout
  const handleLogout = async () => {
    // Existing implementation remains the same
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/advocate/logout', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      localStorage.removeItem('token');
      navigate('/advlogin');
    } catch (error) {
      setError(error.response?.data?.message || 'Logout failed');
    }
  };

  // Function to handle logout from all devices
  const handleLogoutAll = async () => {
    // Existing implementation remains the same
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/advocate/logout-all', 
        { password: logoutPassword },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      localStorage.removeItem('token');
      setShowLogoutConfirm(false);
      navigate('/advlogin');
    } catch (error) {
      setError(error.response?.data?.message || 'Logout from all devices failed');
    }
  };

  // Function to toggle profile modal
  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  // Function to render cases section
  const renderCases = () => (
    // Existing implementation remains the same
    <div className="cases-section">
      <h2>My Cases</h2>
      
      {casesLoading ? (
        <div className="loading">Loading cases...</div>
      ) : cases.length === 0 ? (
        <div className="no-cases">
          You don't have any cases assigned yet.
        </div>
      ) : (
        <div className="cases-table-container">
          <table className="cases-table">
            <thead>
              <tr>
                <th>Case Number</th>
                <th>Case Type</th>
                <th>Court</th>
                <th>District</th>
                <th>Plaintiff</th>
                <th>Respondent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.map(legalCase => (
                <tr key={legalCase._id}>
                  <td>{legalCase.case_num}</td>
                  <td>{legalCase.case_type}</td>
                  <td>{legalCase.court}</td>
                  <td>{legalCase.district}</td>
                  <td>{legalCase.plaintiff_details?.name || 'N/A'}</td>
                  <td>{legalCase.respondent_details?.name || 'N/A'}</td>
                  <td>
                    <span className={`status-badge status-${legalCase.status?.toLowerCase()}`}>
                      {legalCase.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => {
                          setActiveSection('hearings');
                          setSearchCaseNum(legalCase.case_num);
                        }}
                        className="action-button"
                      >
                        View Hearings
                      </button>
                      <button 
                        onClick={() => {
                          setActiveSection('documents');
                          fetchDocuments(legalCase.case_num);
                        }}
                        className="action-button"
                      >
                        Manage Documents
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Function to render hearings section
  const renderHearings = () => (
    // Existing implementation remains the same
    <div className="hearings-section">
      <h2>Search Case Hearings</h2>
      
      <form onSubmit={handleHearingSearch} className="hearing-search-form">
        <div className="form-group">
          <label htmlFor="caseNumber">Case Number</label>
          <input
            type="text"
            id="caseNumber"
            value={searchCaseNum}
            onChange={(e) => setSearchCaseNum(e.target.value)}
            placeholder="Enter Case Number"
            required
          />
        </div>
        <button type="submit" className="search-button">
          Search Hearings
        </button>
      </form>
      
      {hearingsError && (
        <div className="error-message">{hearingsError}</div>
      )}
      
      {hearingsLoading ? (
        <div className="loading">Loading hearings...</div>
      ) : searchedHearings && (
        <div className="hearings-list">
          {searchedHearings.length === 0 ? (
            <div className="no-hearings">
              No hearings found for this case number.
            </div>
          ) : (
            searchedHearings.map((hearing, index) => (
              <div key={index} className="hearing-card">
                <div className="hearing-header">
                  <h3>Hearing #{index + 1}</h3>
                  <span className={`status ${hearing.hearing_type?.toLowerCase()}`}>
                    {hearing.hearing_type}
                  </span>
                </div>
                <div className="hearing-details">
                  <div className="detail-row">
                    <span className="label">Hearing Date:</span>
                    <span className="value">
                      {hearing.hearing_date ? new Date(hearing.hearing_date).toLocaleDateString() : 'Not specified'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Hearing Type:</span>
                    <span className="value">{hearing.hearing_type || 'Not specified'}</span>
                  </div>
                  {hearing.remarks && (
                    <div className="detail-row">
                      <span className="label">Remarks:</span>
                      <span className="value">{hearing.remarks}</span>
                    </div>
                  )}
                  {hearing.next_hearing_date && (
                    <div className="detail-row">
                      <span className="label">Next Hearing Date:</span>
                      <span className="value">
                        {new Date(hearing.next_hearing_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {/* Attachments Section */}
                  {hearing.attachments && hearing.attachments.length > 0 && (
                    <div className="attachments-section">
                      <h4>Attachments</h4>
                      <ul className="attachment-list">
                        {hearing.attachments.map((attachment, i) => (
                          <li key={i} className="attachment-item">
                            <div className="attachment-info">
                              <span className="attachment-name">{attachment.originalname}</span>
                              <span className="attachment-size">
                                {(attachment.size / 1024).toFixed(2)} KB
                              </span>
                            </div>
                            <button 
                              onClick={() => downloadAttachment(attachment.filename, attachment.originalname)}
                              className="download-button"
                            >
                              Download
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  // Function to render documents section
  const renderDocuments = () => (
    // Existing implementation remains the same
    <div className="documents-section">
      <h2>Case Documents</h2>
      
      {/* Case Selection */}
      <div className="case-selector">
        <select 
          onChange={(e) => {
            const caseNum = e.target.value;
            if (caseNum) {
              fetchDocuments(caseNum);
            } else {
              setSelectedCaseForDocuments(null);
              setDocuments([]);
            }
          }}
          value={selectedCaseForDocuments?.case_num || ''}
        >
          <option value="">-- Select a Case --</option>
          {cases.map(legalCase => (
            <option key={legalCase._id} value={legalCase.case_num}>
              {legalCase.case_num} - {legalCase.case_type}
            </option>
          ))}
        </select>
      </div>
      
      {/* Document Upload Form */}
      {selectedCaseForDocuments && (
        <div className="document-upload-form">
          <h3>Upload New Document</h3>
          <form onSubmit={handleDocumentUpload}>
            <div className="form-group">
              <label htmlFor="document-type">Document Type *</label>
              <select
                id="document-type"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                required
              >
                <option value="">-- Select Document Type --</option>
                <option value="Petition">Petition</option>
                <option value="Affidavit">Affidavit</option>
                <option value="Evidence">Evidence</option>
                <option value="Court Order">Court Order</option>
                <option value="Judgment">Judgment</option>
                <option value="Application">Application</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="document-description">Description</label>
              <textarea
                id="document-description"
                value={documentDescription}
                onChange={(e) => setDocumentDescription(e.target.value)}
                placeholder="Enter document description"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="document-file">File *</label>
              <input
                type="file"
                id="document-file"
                onChange={handleFileChange}
                required
              />
            </div>
            
            {documentError && <div className="error-message">{documentError}</div>}
            {documentSuccess && <div className="success-message">{documentSuccess}</div>}
            
            <button type="submit" className="submit-button">
              Upload Document
            </button>
          </form>
        </div>
      )}
      
      {/* Documents List */}
      {selectedCaseForDocuments && (
        <div className="documents-list">
          <h3>Case Documents</h3>
          
          {documentsLoading ? (
            <div className="loading">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="no-documents">
              No documents found for this case.
            </div>
          ) : (
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Filename</th>
                  <th>Description</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => (
                  <tr key={document.document_id}>
                    <td>{document.document_type}</td>
                    <td>{document.file_name}</td>
                    <td>{document.description || 'N/A'}</td>
                    <td>{new Date(document.uploaded_date).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => downloadDocument(document.document_id, document.file_name)}
                        className="download-button"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="adv-loader__container">
        <div className="adv-loader__spinner">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="adv-error__container">
        <div className="adv-error__message">{error}</div>
      </div>
    );
  }

  return (
    <div className="adv-dashboard">
      <header className="adv-dashboard__header">
        <div className="logo-section">
                    <div className="emblem-logo">
                      <div className="emblem-image"><img src={emblem} alt="Aaditiya Tyagi" ></img></div>
                    </div>
                    <div className="justice-logo">
                      <div className="justice-image"><img src={logo} alt="Aaditiya Tyagi" ></img></div>
                    </div>
                    <div className="header-title">
                      <h1>Welcome To Advocate Dashboard</h1>
                    </div>
                  </div>
        <div className="adv-dashboard__header-actions">
          <div className="adv-dashboard__auth-actions">
            <button 
              className="adv-dashboard__logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
            <button 
              className="adv-dashboard__logout-all-btn"
              onClick={() => setShowLogoutConfirm(true)}
            >
              Logout All Devices
            </button>
          </div>
          <div 
            className="adv-dashboard__profile-trigger"
            onClick={toggleProfile}
          >
            {profilePicture ? (
              <div className="adv-dashboard__avatar adv-dashboard__avatar--with-img">
                <img 
                  src={profilePicture} 
                  alt={profile?.name || 'Advocate'} 
                  className="adv-dashboard__profile-img"
                />
              </div>
            ) : (
              <div className="adv-dashboard__avatar">
                {profile?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </header>

      {showLogoutConfirm && (
        <div className="adv-modal__overlay">
          <div className="adv-modal__container adv-modal__container--logout">
            <h3 className="adv-modal__title">Confirm Logout from All Devices</h3>
            <p className="adv-modal__text">Please enter your password to confirm:</p>
            <input
              type="password"
              value={logoutPassword}
              onChange={(e) => setLogoutPassword(e.target.value)}
              placeholder="Enter your password"
              className="adv-modal__input"
              />
              <div className="adv-modal__actions">
                <button 
                  onClick={handleLogoutAll}
                  className="adv-modal__btn adv-modal__btn--confirm"
                >
                  Confirm Logout
                </button>
                <button 
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    setLogoutPassword('');
                  }}
                  className="adv-modal__btn adv-modal__btn--cancel"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
  
        {isProfileOpen && (
          <div className="adv-modal__overlay">
            <div className="adv-modal__container adv-modal__container--profile">
              <button
                className="adv-modal__close-btn"
                onClick={toggleProfile}
              >
                ×
              </button>
              <div className="adv-profile__content">
                {/* Profile Picture Section */}
                <div className="adv-profile__picture-section">
                  {profilePicture ? (
                    <div className="adv-profile__avatar adv-profile__avatar--with-img">
                      <img 
                        src={profilePicture} 
                        alt={profile?.name || 'Advocate'} 
                        className="adv-profile__img"
                      />
                    </div>
                  ) : (
                    <div className="adv-profile__avatar">
                      {profile?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  {/* Hidden file input for profile picture */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleProfilePictureChange}
                  />
                  
                  <button 
                    className="adv-profile__picture-btn"
                    onClick={handleUploadButtonClick}
                    disabled={uploadingPicture}
                  >
                    {uploadingPicture ? 'Uploading...' : 'Change Photo'}
                  </button>
                  
                  {pictureError && (
                    <div className="adv-profile__picture-error">
                      {pictureError}
                    </div>
                  )}
                </div>
                
                <h2 className="adv-profile__name">{profile?.name}</h2>
                <h4 className="adv-profile__id">{profile?.advocate_id}</h4>
                <p className="adv-profile__email">{profile?.email}</p>
                <p className="adv-profile__district">District: {profile?.district}</p>
                <div className="adv-profile__details">
                  <div className="adv-profile__detail-item">
                    <span className="adv-profile__detail-label">Enrollment No:</span>
                    <strong className="adv-profile__detail-value">{profile?.enrollment_no}</strong>
                  </div>
                  <div className="adv-profile__detail-item">
                    <span className="adv-profile__detail-label">Status:</span>
                    <strong className="adv-profile__detail-value">{profile?.status}</strong>
                  </div>
                  <div className="adv-profile__detail-item">
                    <span className="adv-profile__detail-label">Practice Area:</span>
                    <strong className="adv-profile__detail-value">
                      {profile?.practice_details?.district_court ? 'District Court' : 'Not Specified'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
  
        <div className="adv-dashboard__layout">
          <aside className="adv-dashboard__sidebar">
            <nav className="adv-dashboard__nav">
              <button 
                className={`adv-dashboard__nav-btn ${activeSection === 'cases' ? 'active' : ''}`}
                onClick={() => setActiveSection('cases')}
              >
                Cases
              </button>
              <button 
                className={`adv-dashboard__nav-btn ${activeSection === 'hearings' ? 'active' : ''}`}
                onClick={() => setActiveSection('hearings')}
              >
                Hearings
              </button>
              <button 
                className={`adv-dashboard__nav-btn ${activeSection === 'documents' ? 'active' : ''}`}
                onClick={() => setActiveSection('documents')}
              >
                Documents
              </button>
              <Link to="/noticeboard" className="adv-dashboard__nav-link">
                Notice Board
              </Link>
              <Link to="/usercalendar" className="adv-dashboard__nav-link">
                Court Calendar
              </Link>
              <Link to="/advocatecaseassign" className="adv-dashboard__nav-link">
                Case Join Request
              </Link>
              <Link to="/advocatefilecase" className="adv-dashboard__nav-link">
                File a Case
              </Link>
              <Link to="/advocatemeeting" className="adv-dashboard__nav-link">
                Scheduled Meetings
              </Link>
            </nav>
          </aside>
  
          <main className="adv-dashboard__main">
            {activeSection === 'cases' && (
              <>
                <section className="adv-dashboard__stats">
                  <div className="adv-dashboard__stat-card">
                    <h3 className="adv-dashboard__stat-title">Total Cases</h3>
                    <p className="adv-dashboard__stat-value">{cases.length}</p>
                  </div>
                  <div className="adv-dashboard__stat-card">
                    <h3 className="adv-dashboard__stat-title">Pending Cases</h3>
                    <p className="adv-dashboard__stat-value">
                      {cases.filter(c => c.status === 'Pending').length}
                    </p>
                  </div>
                  <div className="adv-dashboard__stat-card">
                    <h3 className="adv-dashboard__stat-title">Active Cases</h3>
                    <p className="adv-dashboard__stat-value">
                      {cases.filter(c => c.status === 'Active').length}
                    </p>
                  </div>
                </section>
                {renderCases()}
              </>
            )}
            
            {activeSection === 'hearings' && renderHearings()}
            
            {activeSection === 'documents' && renderDocuments()}
          </main>
        </div>
      </div>
    );
  };
  
  export default AdvocateDashboard;