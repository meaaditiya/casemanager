import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LogOut, FileText, Calendar, Database, Info, Book, Users, X } from 'lucide-react';
import '../ComponentsCSS/AdvocateDashboard.css';
import emblem from '../images/aadiimage4.svg';
import logo from '../images/aadiimage4.png';

// Import components
import NoticeBoard from '../Components/NoticeBoard';
import UserCalendar from '../Components/UserCalendar';
import AdvocateMeeting from '../Components/Advocatemeeting';
import AdvocateCaseAssign from '../Components/Advocatecaseassign';
import AdvocateFileCase from '../Components/Advocatefilecase';

// Constants
const STORAGE_KEYS = {
  ACTIVE_SECTION: 'advocat_active_section',
  SEARCH_CASE_NUM: 'advocat_search_case_num',
  SELECTED_CASE: 'advocat_selected_case'
};

// Header Component
const DashboardHeader = ({ 
  profile, 
  profilePicture, 
  onToggleSidebar, 
  onToggleProfile, 
  onLogout, 
  onLogoutAll 
}) => (
  <header className="advocat-header-container">
    <div className="advocat-header-left-section">
      <button className="advocat-sidebar-toggle-btn" onClick={onToggleSidebar}>
        ☰
      </button>
      <div className="advocat-emblem-wrapper">
        <img src={emblem} alt="Emblem" className="advocat-emblem-img" />
      </div>
      <div className="advocat-logo-wrapper">
        <img src={logo} alt="Logo" className="advocat-logo-img" />
      </div>
      <h1 className="advocat-header-title">Advocate Dashboard</h1>
    </div>
    <div className="advocat-header-right-section">
      <div className="advocat-logout-buttons-group">
        <button className="advocat-logout-single-btn" onClick={onLogout}>
          <LogOut className="advocat-logout-icon-svg" />
          Logout
        </button>
        <button className="advocat-logout-all-devices-btn" onClick={onLogoutAll}>
          <LogOut className="advocat-logout-icon-svg" />
          Logout All Devices
        </button>
      </div>
      <div className="advocat-profile-avatar-trigger" onClick={onToggleProfile}>
        {profilePicture ? (
          <div className="advocat-avatar-container advocat-avatar-with-image">
            <img
              src={profilePicture}
              alt={profile?.name || 'Advocate'}
              className="advocat-avatar-image"
            />
          </div>
        ) : (
          <div className="advocat-avatar-container advocat-avatar-initials">
            {profile?.name?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  </header>
);

// Sidebar Component
const DashboardSidebar = ({ activeSection, onNavigate, isSidebarOpen }) => {
  const navItems = [
    { id: 'cases', label: 'Cases', icon: Database },
    { id: 'hearings', label: 'Hearings', icon: Calendar },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'noticeboard', label: 'Notice Board', icon: Info },
    { id: 'calendar', label: 'Court Calendar', icon: Calendar },
    { id: 'caseassign', label: 'Case Join Request', icon: Book },
    { id: 'filecase', label: 'File a Case', icon: FileText },
    { id: 'meetings', label: 'Scheduled Meetings', icon: Users }
  ];

  return (
    <aside className={`advocat-sidebar-container ${isSidebarOpen ? 'advocat-sidebar-active' : ''}`}>
      <nav className="advocat-navigation-menu">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`advocat-nav-button ${activeSection === id ? 'advocat-nav-button-active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <Icon className="advocat-nav-icon-svg" />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

// Profile Modal Component
const ProfileModal = ({ 
  profile, 
  profilePicture, 
  onClose, 
  onUploadPicture, 
  uploadingPicture, 
  pictureError,
  fileInputRef 
}) => (
  <div className="advocat-profile-overlay-backdrop">
    <div className="advocat-profile-modal-container">
      <button className="advocat-profile-close-btn" onClick={onClose}>
        ×
      </button>
      <div className="advocat-profile-content-wrapper">
        <div className="advocat-profile-picture-section">
          {profilePicture ? (
            <div className="advocat-profile-avatar-large advocat-profile-avatar-with-img">
              <img
                src={profilePicture}
                alt={profile?.name || 'Advocate'}
                className="advocat-profile-image-large"
              />
            </div>
          ) : (
            <div className="advocat-profile-avatar-large advocat-profile-avatar-initials-large">
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/jpeg,image/png,image/gif"
            onChange={onUploadPicture}
          />
          <button
            className="advocat-profile-change-photo-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPicture}
          >
            {uploadingPicture ? 'Uploading...' : 'Change Photo'}
          </button>
          {pictureError && (
            <div className="advocat-profile-picture-error-msg">{pictureError}</div>
          )}
        </div>
        <h2 className="advocat-profile-name-heading">{profile?.name}</h2>
        <h4 className="advocat-profile-id-text">{profile?.advocate_id}</h4>
        <p className="advocat-profile-email-text">{profile?.email}</p>
        <p className="advocat-profile-district-text">District: {profile?.district}</p>
        <div className="advocat-profile-details-grid">
          <div className="advocat-profile-detail-row">
            <span className="advocat-profile-detail-label">Enrollment No:</span>
            <strong className="advocat-profile-detail-value">
              {profile?.enrollment_no}
            </strong>
          </div>
          <div className="advocat-profile-detail-row">
            <span className="advocat-profile-detail-label">Status:</span>
            <strong className="advocat-profile-detail-value">
              {profile?.status}
            </strong>
          </div>
          <div className="advocat-profile-detail-row">
            <span className="advocat-profile-detail-label">Practice Area:</span>
            <strong className="advocat-profile-detail-value">
              {profile?.practice_details?.district_court ? 'District Court' : 'Not Specified'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Logout Confirmation Modal Component
const LogoutConfirmModal = ({ 
  onConfirm, 
  onCancel, 
  password, 
  onPasswordChange 
}) => (
  <div className="advocat-logout-overlay-backdrop">
    <div className="advocat-logout-modal-container">
      <h3 className="advocat-logout-modal-title">Confirm Logout from All Devices</h3>
      <p className="advocat-logout-modal-text">Please enter your password to confirm:</p>
      <input
        type="password"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        placeholder="Enter your password"
        className="advocat-password-input-field"
      />
      <div className="advocat-logout-actions-group">
        <button onClick={onConfirm} className="advocat-confirm-logout-btn">
          Confirm Logout
        </button>
        <button onClick={onCancel} className="advocat-cancel-logout-btn">
          Cancel
        </button>
      </div>
    </div>
  </div>
);

// Stats Section Component
const StatsSection = ({ cases }) => (
  <section className="advocat-stats-section">
    <div className="advocat-stat-card-item">
      <h3 className="advocat-stat-title-text">Total Cases</h3>
      <p className="advocat-stat-value-number">{cases.length}</p>
    </div>
    <div className="advocat-stat-card-item">
      <h3 className="advocat-stat-title-text">Pending Cases</h3>
      <p className="advocat-stat-value-number">
        {cases.filter((c) => c.status === 'Pending').length}
      </p>
    </div>
    <div className="advocat-stat-card-item">
      <h3 className="advocat-stat-title-text">Active Cases</h3>
      <p className="advocat-stat-value-number">
        {cases.filter((c) => c.status === 'Active').length}
      </p>
    </div>
  </section>
);

// Main Component
const AdvocateDashboard = () => {
  // State Management
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutPassword, setLogoutPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [pictureError, setPictureError] = useState(null);
  const fileInputRef = useRef(null);
  const [cases, setCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(false);
  
  // Persistent state - restored from sessionStorage on refresh
  const [searchCaseNum, setSearchCaseNum] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEYS.SEARCH_CASE_NUM) || '';
  });
  const [activeSection, setActiveSection] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEYS.ACTIVE_SECTION) || 'cases';
  });
  const [selectedCaseForDocuments, setSelectedCaseForDocuments] = useState(() => {
    const saved = sessionStorage.getItem(STORAGE_KEYS.SELECTED_CASE);
    return saved ? JSON.parse(saved) : null;
  });
  
  const [searchedHearings, setSearchedHearings] = useState(null);
  const [hearingsLoading, setHearingsLoading] = useState(false);
  const [hearingsError, setHearingsError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  const [documentError, setDocumentError] = useState(null);
  const [documentSuccess, setDocumentSuccess] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Persist state changes to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.ACTIVE_SECTION, activeSection);
  }, [activeSection]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.SEARCH_CASE_NUM, searchCaseNum);
  }, [searchCaseNum]);

  useEffect(() => {
    if (selectedCaseForDocuments) {
      sessionStorage.setItem(STORAGE_KEYS.SELECTED_CASE, JSON.stringify(selectedCaseForDocuments));
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.SELECTED_CASE);
    }
  }, [selectedCaseForDocuments]);

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
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setProfile(response.data.advocate);
        if (response.data.advocate.profilePicture) {
          setProfilePicture(
            `http://localhost:5000/api/advocate/profile-picture/${response.data.advocate.profilePicture}`
          );
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

  // Restore documents if a case was selected before refresh
  useEffect(() => {
    if (!loading && selectedCaseForDocuments && cases.length > 0) {
      fetchDocuments(selectedCaseForDocuments.case_num);
    }
  }, [loading, cases]);

  const fetchCases = async () => {
    setCasesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/cases/advocate', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setCases(response.data.cases || []);
    } catch (err) {
      console.error('Error fetching cases:', err);
    } finally {
      setCasesLoading(false);
    }
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!validImageTypes.includes(file.type)) {
      setPictureError('Please select a valid image file (JPG, PNG, GIF)');
      return;
    }
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
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setProfilePicture(
        `http://localhost:5000/api/advocate/profile-picture/${
          response.data.profilePicture.filename
        }?${new Date().getTime()}`
      );
    } catch (err) {
      setPictureError(err.response?.data?.message || 'Error uploading profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleHearingSearch = async (e) => {
    e.preventDefault();
    setHearingsLoading(true);
    setHearingsError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/case/${searchCaseNum}/hearings/advocate`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      setSearchedHearings(response.data.hearings || []);
      setHearingsLoading(false);
    } catch (err) {
      setHearingsError(err.response?.data?.message || 'Error fetching hearings');
      setHearingsLoading(false);
    }
  };

  const fetchDocuments = async (caseNum) => {
    setDocumentsLoading(true);
    setDocumentError(null);
    try {
      const token = localStorage.getItem('token');
      const caseResponse = await axios.get(
        `http://localhost:5000/api/case/${caseNum}/documents/advocate`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      const selectedCase = cases.find((c) => c.case_num === caseNum);
      setSelectedCaseForDocuments(selectedCase);
      setDocuments(caseResponse.data.documents || []);
    } catch (err) {
      setDocumentError(err.response?.data?.message || 'Error fetching documents');
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setDocumentFile(e.target.files[0]);
  };

  const handleDocumentUpload = async (e) => {
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
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setDocumentSuccess('Document uploaded successfully');
      fetchDocuments(selectedCaseForDocuments.case_num);
      setDocumentType('');
      setDocumentDescription('');
      setDocumentFile(null);
      document.getElementById('advocat-document-file-input').value = '';
    } catch (err) {
      setDocumentError(err.response?.data?.message || 'Error uploading document');
    } finally {
      setDocumentsLoading(false);
    }
  };

  const downloadDocument = async (documentId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/document/${documentId}/download/advocate`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'blob',
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Error downloading document:', err);
    }
  };

  const downloadAttachment = async (filename, originalname) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/files/${filename}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalname);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Error downloading attachment:', err);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/advocate/logout',
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      localStorage.removeItem('token');
      sessionStorage.clear();
      navigate('/advlogin');
    } catch (error) {
      setError(error.response?.data?.message || 'Logout failed');
    }
  };

  const handleLogoutAll = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/advocate/logout-all',
        { password: logoutPassword },
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      localStorage.removeItem('token');
      sessionStorage.clear();
      setShowLogoutConfirm(false);
      navigate('/advlogin');
    } catch (error) {
      setError(error.response?.data?.message || 'Logout from all devices failed');
    }
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNavigation = (section) => {
    setActiveSection(section);
    setIsSidebarOpen(false);
  };

  const renderCases = () => (
    <div className="advocat-cases-main-section">
      <h2 className="advocat-section-heading">My Cases</h2>
      {casesLoading ? (
        <div className="advocat-loading-spinner">Loading cases...</div>
      ) : cases.length === 0 ? (
        <div className="advocat-no-data-message">You don't have any cases assigned yet.</div>
      ) : (
        <div className="advocat-cases-table-wrapper">
          <table className="advocat-cases-data-table">
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
              {cases.map((legalCase) => (
                <tr key={legalCase._id}>
                  <td>{legalCase.case_num}</td>
                  <td>{legalCase.case_type}</td>
                  <td>{legalCase.court}</td>
                  <td>{legalCase.district}</td>
                  <td>{legalCase.plaintiff_details?.name || 'N/A'}</td>
                  <td>{legalCase.respondent_details?.name || 'N/A'}</td>
                  <td>
                    <span
                      className={`advocat-status-badge advocat-status-${legalCase.status?.toLowerCase()}`}
                    >
                      {legalCase.status}
                    </span>
                  </td>
                  <td>
                    <div className="advocat-action-buttons-wrapper">
                      <button
                        onClick={() => {
                          setActiveSection('hearings');
                          setSearchCaseNum(legalCase.case_num);
                        }}
                        className="advocat-action-btn advocat-action-btn-primary"
                      >
                        View Hearings
                      </button>
                      <button
                        onClick={() => {
                          setActiveSection('documents');
                          fetchDocuments(legalCase.case_num);
                        }}
                        className="advocat-action-btn advocat-action-btn-secondary"
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

  const renderHearings = () => (
    <div className="advocat-hearings-main-section">
      <h2 className="advocat-section-heading">Search Case Hearings</h2>
      <form onSubmit={handleHearingSearch} className="advocat-hearing-search-form-wrapper">
        <div className="advocat-form-group-container">
          <label htmlFor="advocat-case-number-input" className="advocat-form-label">
            Case Number
          </label>
          <input
            type="text"
            id="advocat-case-number-input"
            value={searchCaseNum}
            onChange={(e) => setSearchCaseNum(e.target.value)}
            placeholder="Enter Case Number"
            className="advocat-form-input-field"
            required
          />
        </div>
        <button type="submit" className="advocat-search-submit-btn">
          Search Hearings
        </button>
      </form>
      {hearingsError && <div className="advocat-error-message-box">{hearingsError}</div>}
      {hearingsLoading ? (
        <div className="advocat-loading-spinner">Loading hearings...</div>
      ) : (
        searchedHearings && (
          <div className="advocat-hearings-list-container">
            {searchedHearings.length === 0 ? (
              <div className="advocat-no-data-message">
                No hearings found for this case number.
              </div>
            ) : (
              searchedHearings.map((hearing, index) => (
                <div key={index} className="advocat-hearing-card-item">
                  <div className="advocat-hearing-card-header">
                    <h3 className="advocat-hearing-card-title">Hearing #{index + 1}</h3>
                    <span
                      className={`advocat-hearing-type-badge advocat-hearing-type-${hearing.hearing_type?.toLowerCase()}`}
                    >
                      {hearing.hearing_type}
                    </span>
                  </div>
                  <div className="advocat-hearing-details-grid">
                    <div className="advocat-detail-row-item">
                      <span className="advocat-detail-label-text">Hearing Date:</span>
                      <span className="advocat-detail-value-text">
                        {hearing.hearing_date
                          ? new Date(hearing.hearing_date).toLocaleDateString()
                          : 'Not specified'}
                      </span>
                    </div>
                    <div className="advocat-detail-row-item">
                      <span className="advocat-detail-label-text">Hearing Type:</span>
                      <span className="advocat-detail-value-text">
                        {hearing.hearing_type || 'Not specified'}
                      </span>
                    </div>
                    {hearing.remarks && (
                      <div className="advocat-detail-row-item">
                        <span className="advocat-detail-label-text">Remarks:</span>
                        <span className="advocat-detail-value-text">{hearing.remarks}</span>
                      </div>
                    )}
                    {hearing.next_hearing_date && (
                      <div className="advocat-detail-row-item">
                        <span className="advocat-detail-label-text">Next Hearing Date:</span>
                        <span className="advocat-detail-value-text">
                          {new Date(hearing.next_hearing_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {hearing.attachments && hearing.attachments.length > 0 && (
                      <div className="advocat-attachments-section-wrapper">
                        <h4 className="advocat-attachments-heading">Attachments</h4>
                        <ul className="advocat-attachment-list-group">
                          {hearing.attachments.map((attachment, i) => (
                            <li key={i} className="advocat-attachment-list-item">
                              <div className="advocat-attachment-info-block">
                                <span className="advocat-attachment-filename">
                                  {attachment.originalname}
                                </span>
                                <span className="advocat-attachment-filesize">
                                  {(attachment.size / 1024).toFixed(2)} KB
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  downloadAttachment(
                                    attachment.filename,
                                    attachment.originalname
                                  )
                                }
                                className="advocat-download-action-btn"
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
        )
      )}
    </div>
  );

  const renderDocuments = () => (
    <div className="advocat-documents-main-section">
      <h2 className="advocat-section-heading">Case Documents</h2>
      <div className="advocat-case-selector-wrapper">
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
          className="advocat-case-select-dropdown"
        >
          <option value="">-- Select a Case --</option>
          {cases.map((legalCase) => (
            <option key={legalCase._id} value={legalCase.case_num}>
              {legalCase.case_num} - {legalCase.case_type}
            </option>
          ))}
        </select>
      </div>
      {selectedCaseForDocuments && (
        <div className="advocat-document-upload-form-wrapper">
          <h3 className="advocat-subsection-heading">Upload New Document</h3>
          <form onSubmit={handleDocumentUpload} className="advocat-document-form-container">
            <div className="advocat-form-group-container">
              <label htmlFor="advocat-document-type-select" className="advocat-form-label">
                Document Type *
              </label>
              <select
                id="advocat-document-type-select"
                value={documentType}
onChange={(e) => setDocumentType(e.target.value)}
className="advocat-form-select-field"
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
<div className="advocat-form-group-container">
<label htmlFor="advocat-document-description-textarea" className="advocat-form-label">
Description
</label>
<textarea
id="advocat-document-description-textarea"
value={documentDescription}
onChange={(e) => setDocumentDescription(e.target.value)}
placeholder="Enter document description"
className="advocat-form-textarea-field"
/>
</div>
<div className="advocat-form-group-container">
<label htmlFor="advocat-document-file-input" className="advocat-form-label">
File *
</label>
<input
             type="file"
             id="advocat-document-file-input"
             onChange={handleFileChange}
             className="advocat-form-file-input"
             required
           />
</div>
{documentError && <div className="advocat-error-message-box">{documentError}</div>}
{documentSuccess && (
<div className="advocat-success-message-box">{documentSuccess}</div>
)}
<button type="submit" className="advocat-submit-upload-btn">
Upload Document
</button>
</form>
</div>
)}
{selectedCaseForDocuments && (
<div className="advocat-documents-list-wrapper">
<h3 className="advocat-subsection-heading">Case Documents</h3>
{documentsLoading ? (
<div className="advocat-loading-spinner">Loading documents...</div>
) : documents.length === 0 ? (
<div className="advocat-no-data-message">
No documents found for this case.
</div>
) : (
<table className="advocat-documents-data-table">
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
onClick={() =>
downloadDocument(document.document_id, document.file_name)
}
className="advocat-download-action-btn"
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
const renderContent = () => {
switch (activeSection) {
case 'cases':
return (
<>
<StatsSection cases={cases} />
{renderCases()}
</>
);
case 'hearings':
return renderHearings();
case 'documents':
return renderDocuments();
case 'noticeboard':
return <NoticeBoard />;
case 'calendar':
return <UserCalendar />;
case 'caseassign':
return <AdvocateCaseAssign />;
case 'filecase':
return <AdvocateFileCase />;
case 'meetings':
return <AdvocateMeeting />;
default:
return <div className="advocat-no-data-message">Select an option from the sidebar</div>;
}
};
if (loading) {
return (
<div className="advocat-loading-container-fullscreen">
<div className="advocat-loading-spinner">Loading...</div>
</div>
);
}
return (
<div className="advocat-dashboard-wrapper">
<DashboardHeader
profile={profile}
profilePicture={profilePicture}
onToggleSidebar={toggleSidebar}
onToggleProfile={toggleProfile}
onLogout={handleLogout}
onLogoutAll={() => setShowLogoutConfirm(true)}
/>
  {isSidebarOpen && (
    <div
      className="advocat-sidebar-overlay-backdrop"
      onClick={() => setIsSidebarOpen(false)}
    ></div>
  )}

  <div className="advocat-content-layout">
    <DashboardSidebar
      activeSection={activeSection}
      onNavigate={handleNavigation}
      isSidebarOpen={isSidebarOpen}
    />

    <main className="advocat-main-content-area">{renderContent()}</main>
  </div>

  {isProfileOpen && (
    <ProfileModal
      profile={profile}
      profilePicture={profilePicture}
      onClose={toggleProfile}
      onUploadPicture={handleProfilePictureChange}
      uploadingPicture={uploadingPicture}
      pictureError={pictureError}
      fileInputRef={fileInputRef}
    />
  )}

  {showLogoutConfirm && (
    <LogoutConfirmModal
      onConfirm={handleLogoutAll}
      onCancel={() => {
        setShowLogoutConfirm(false);
        setLogoutPassword('');
      }}
      password={logoutPassword}
      onPasswordChange={setLogoutPassword}
    />
  )}

  {error && (
    <div className="advocat-error-toast-notification">
      <X className="advocat-error-icon-svg" />
      {error}
    </div>
  )}
</div>
);
};
export default AdvocateDashboard;