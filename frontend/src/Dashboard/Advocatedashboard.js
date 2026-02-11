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
  const [selectedHearing, setSelectedHearing] = useState(null);
const [isHearingDetailsOpen, setIsHearingDetailsOpen] = useState(false);
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
  // Add these new state variables after existing document states
const [documentRequests, setDocumentRequests] = useState([]);
const [requestsLoading, setRequestsLoading] = useState(false);
const [selectedDocumentRequest, setSelectedDocumentRequest] = useState(null);
const [uploadingRequestedDoc, setUploadingRequestedDoc] = useState(false);
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
// Add this useEffect after existing useEffects
// Replace the existing useEffect for fetching document requests with this:
useEffect(() => {
  const fetchDocumentRequests = async () => {
    setRequestsLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Changed endpoint from '/api/my-document-requests' to advocate-specific route
      const response = await axios.get('http://localhost:5000/api/advocate/my-document-requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocumentRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching document requests:', error);
    } finally {
      setRequestsLoading(false);
    }
  };

  if (activeSection === 'documents') {
    fetchDocumentRequests();
  }
}, [activeSection]);
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
// Add this function after handleDocumentUpload
// Also update the refresh call inside handleRequestedDocumentUpload:
const handleRequestedDocumentUpload = async (e, documentId, caseNum) => {
  e.preventDefault();
  setUploadingRequestedDoc(true);
  setDocumentError('');
  setDocumentSuccess('');

  if (!documentFile) {
    setDocumentError('Please select a file to upload');
    setUploadingRequestedDoc(false);
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', documentFile);

    await axios.post(
      `http://localhost:5000/api/case/${caseNum}/upload-requested-document/${documentId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    setDocumentSuccess('Requested document uploaded successfully. Pending admin verification.');
    setDocumentFile(null);
    setSelectedDocumentRequest(null);
    document.getElementById('advocat-requested-doc-file-input').value = '';
    
    // Refresh document requests - CHANGED THIS LINE
    const response = await axios.get('http://localhost:5000/api/advocate/my-document-requests', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setDocumentRequests(response.data.requests || []);
    
  } catch (error) {
    setDocumentError(error.response?.data?.message || 'Failed to upload requested document');
  } finally {
    setUploadingRequestedDoc(false);
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
  const printHearingOrder = () => {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  const orderContent = document.querySelector('.hearing-order-sheet');
  if (!orderContent) {
    alert('Order content not found');
    printWindow.close();
    return;
  }
  const printDocument = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Order Sheet</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Times New Roman', Times, serif; 
            padding: 20px; 
            background: white;
          }
          .hearing-order-sheet {
            max-width: 800px; 
            margin: 0 auto; 
            padding: 40px; 
            background-color: #fff;
            color: #000;
          }
          .order-header {
            text-align: center;
            margin-bottom: 20px;
          }
          .order-header h1 {
            font-size: 24px;
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 10px;
          }
          .order-meta {
            margin-bottom: 20px;
          }
          .order-meta table {
            width: 100%;
            border-collapse: collapse;
          }
          .order-meta td {
            padding: 8px 0;
            vertical-align: top;
          }
          .order-meta .label {
            font-weight: bold;
            width: 200px;
          }
          .order-content {
            margin: 30px 0;
            text-align: justify;
            line-height: 1.8;
            font-size: 14px;
          }
          .order-content p {
            margin-bottom: 12px;
          }
          .order-signature {
            margin-top: 60px;
            text-align: right;
          }
          .signature-box {
            display: inline-block;
            min-width: 250px;
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #000;
            margin-bottom: 5px;
            padding-top: 40px;
          }
          .signature-details {
            font-size: 12px;
            margin-top: 10px;
            text-align: left;
            padding-left: 10px;
          }
          .digital-signature-box {
            margin-top: 40px;
            border: 1px solid #000;
            padding: 15px;
            background: #f9f9f9;
          }
          .digital-signature-box h4 {
            font-size: 14px;
            margin-bottom: 10px;
            text-decoration: underline;
          }
          .digital-signature-box p {
            font-size: 12px;
            margin-bottom: 5px;
          }
          @media print {
            body { padding: 0; }
            .hearing-order-sheet { border: none; box-shadow: none; }
            @page { size: A4; margin: 1cm; }
          }
        </style>
      </head>
      <body>
        ${orderContent.outerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
    </html>
  `;
  printWindow.document.open();
  printWindow.document.write(printDocument);
  printWindow.document.close();
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
    
  <div className="litigantdash-hearings-main-section">
    <h2>Search Case Hearings</h2>
    <form onSubmit={handleHearingSearch} className="litigantdash-hearing-search-form-container">
      <div className="litigantdash-form-group-item">
        <label htmlFor="advocat-case-number-input" className="litigantdash-form-label">
          Case Number
        </label>
        <input
          type="text"
          id="advocat-case-number-input"
          value={searchCaseNum}
          onChange={(e) => setSearchCaseNum(e.target.value)}
          placeholder="Enter Case Number"
          className="litigantdash-form-input-field"
          required
        />
      </div>
      <button type="submit" className="litigantdash-search-submit-btn">
        Search Hearings
      </button>
    </form>
    {hearingsError && <div className="litigantdash-error-alert-message">{hearingsError}</div>}
    {hearingsLoading ? (
      <div className="litigantdash-loading-spinner">Loading hearings...</div>
    ) : (
      searchedHearings && (
        <div className="litigantdash-hearings-list-container">
          {searchedHearings.length === 0 ? (
            <div className="litigantdash-no-hearings-message">
              No hearings found for this case number.
            </div>
          ) : (
            searchedHearings.map((hearing, index) => (
              <div key={index} className="litigantdash-hearing-card-box">
                <div className="litigantdash-hearing-card-header">
                  <h3>Hearing #{index + 1}</h3>
                  <span className={`litigantdash-status-badge ${hearing.hearing_type?.toLowerCase()}`}>
                    {hearing.hearing_type}
                  </span>
                </div>

                <div className="litigantdash-hearing-card-details">
                  <div className="litigantdash-detail-row-item">
                    <span className="litigantdash-detail-label-text">Hearing Date:</span>
                    <span className="litigantdash-detail-value-text">
                      {hearing.hearing_date
                        ? new Date(hearing.hearing_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        : 'Not specified'}
                    </span>
                  </div>

                  <div className="litigantdash-detail-row-item">
                    <span className="litigantdash-detail-label-text">Hearing Type:</span>
                    <span className="litigantdash-detail-value-text">
                      {hearing.hearing_type || 'Not specified'}
                    </span>
                  </div>

                  {hearing.next_hearing_date && (
                    <div className="litigantdash-detail-row-item">
                      <span className="litigantdash-detail-label-text">Next Hearing Date:</span>
                      <span className="litigantdash-detail-value-text">
                        {new Date(hearing.next_hearing_date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}

                  <div className="litigantdash-case-card-actions" style={{marginTop: '16px'}}>
                    <button
                      className="litigantdash-view-details-button"
                      onClick={() => {
                        setSelectedHearing(hearing);
                        setIsHearingDetailsOpen(true);
                      }}
                    >
                      Check Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )
    )}

    {isHearingDetailsOpen && selectedHearing && (
      <div
        className="litigantdash-case-details-overlay-backdrop"
        onClick={(e) => {
          if (e.target.className === 'litigantdash-case-details-overlay-backdrop') {
            setIsHearingDetailsOpen(false);
          }
        }}
      >
        <div className="litigantdash-case-details-modal-wrapper">
          <div className="litigantdash-modal-header-bar">
            <h2>Hearing Order Details</h2>
            <div className="litigantdash-header-right-actions">
              <button className="litigantdash-print-receipt-button" onClick={printHearingOrder}>
                Print Order
              </button>
              <button className="litigantdash-close-modal-button" onClick={() => setIsHearingDetailsOpen(false)}>
                ×
              </button>
            </div>
          </div>
          <div className="litigantdash-modal-content-scrollable-area">
            <div className="litigantdash-modal-content-panel">
              <div className="hearing-order-sheet">
                <div className="order-header">
                  <p style={{fontSize: '11px', marginBottom: '5px'}}>Schedule VII, Form No.127</p>
                  <p style={{fontSize: '11px', marginBottom: '15px'}}>High Court Criminal Form No (H) 106</p>
                  <h1>ORDER SHEET</h1>
                </div>
                {(() => {
                  const currentCase = cases.find(c => c.case_num === searchCaseNum) || {};
                  const officeDetails = currentCase.for_office_use_only || {};
                  const plaintiffName = currentCase.plaintiff_details?.name || 'Petitioner';
                  const respondentName = currentCase.respondent_details?.name || 'Respondent';
                  const plaintiffAdvocate = currentCase.plaintiff_details?.advocate || '';
                  const respondentAdvocate = currentCase.respondent_details?.advocate || '';
                  const district = currentCase.district || '';
                  const court = currentCase.court || '';
                  
                  return (
                    <>
                      <div className="order-header">
                        <h2 style={{fontSize: '16px', fontWeight: 'bold', textAlign: 'center', marginBottom: '10px'}}>
                          OFFICE OF THE DISTRICT & SESSIONS JUDGE, {district.toUpperCase()}
                        </h2>
                        <p style={{fontSize: '14px', textAlign: 'right', marginBottom: '10px', fontWeight: 'bold'}}>
                          IN THE COURT OF: {officeDetails.court_allotted || court}
                        </p>
                        <h3 style={{fontSize: '14px', textAlign: 'center', marginBottom: '15px', fontWeight: 'bold'}}>
                          {plaintiffName} v. {respondentName}
                        </h3>
                        <p style={{fontSize: '13px', textAlign: 'left', marginBottom: '5px'}}>
                          <strong>Case No.:</strong> {searchCaseNum}
                        </p>
                        <p style={{fontSize: '13px', textAlign: 'left', marginBottom: '20px'}}>
                          <strong>Case Type:</strong> {currentCase.case_type || 'N/A'}
                        </p>
                        <h1 style={{fontSize: '18px', textAlign: 'center', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '20px'}}>
                          ORDER SHEET / PROCEEDINGS
                        </h1>
                      </div>

                      {(plaintiffAdvocate || respondentAdvocate) && (
                        <div style={{fontSize: '12px', marginBottom: '15px', padding: '10px', background: '#f5f5f5'}}>
                          {plaintiffAdvocate && <p><strong>Present for Petitioner:</strong> {plaintiffAdvocate}</p>}
                          {respondentAdvocate && <p><strong>Present for Respondent:</strong> {respondentAdvocate}</p>}
                        </div>
                      )}
                    </>
                  );
                })()}
                <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '20px', border: '1px solid #000'}}>
                  <thead>
                    <tr>
                      <th style={{border: '1px solid #000', padding: '8px', textAlign: 'center', width: '50px', fontWeight: 'bold'}}>S. No.</th>
                      <th style={{border: '1px solid #000', padding: '8px', textAlign: 'center', width: '120px', fontWeight: 'bold'}}>Date of Order</th>
                      <th style={{border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold'}}>ORDER / PROCEEDINGS</th>
                      <th style={{border: '1px solid #000', padding: '8px', textAlign: 'center', width: '150px', fontWeight: 'bold'}}>Signature of Court</th>
                      <th style={{border: '1px solid #000', padding: '8px', textAlign: 'center', width: '120px', fontWeight: 'bold'}}>Office Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchedHearings && searchedHearings.map((hearing, idx) => (
                      <tr key={idx}>
                        <td style={{border: '1px solid #000', padding: '8px', verticalAlign: 'top', textAlign: 'center'}}>
                          {idx + 1}
                        </td>
                        <td style={{border: '1px solid #000', padding: '8px', verticalAlign: 'top', textAlign: 'center'}}>
                          {hearing.hearing_date
                            ? new Date(hearing.hearing_date).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })
                            : ''}
                        </td>
                        <td style={{border: '1px solid #000', padding: '12px', verticalAlign: 'top'}}>
                          <div 
                            className="order-content" 
                            dangerouslySetInnerHTML={{ __html: hearing.remarks || hearing.remarks_plain_text || 'No order recorded' }}
                          />
                          {hearing.next_hearing_date && (
                            <p style={{marginTop: '15px', fontWeight: 'bold'}}>
                              Next Hearing: {new Date(hearing.next_hearing_date).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </p>
                          )}
                        </td>
                        <td style={{border: '1px solid #000', padding: '8px', verticalAlign: 'top', textAlign: 'center'}}>
                          {hearing.digital_signature && hearing.digital_signature.is_signed ? (
                            <div style={{fontSize: '11px', textAlign: 'center'}}>
                              <div style={{fontWeight: 'bold', marginBottom: '5px'}}>
                                {hearing.digital_signature.signed_by_name}
                              </div>
                              <div style={{fontSize: '9px', fontStyle: 'italic'}}>
                                Digitally signed
                              </div>
                              <div style={{fontSize: '8px', marginTop: '3px'}}>
                                {hearing.digital_signature.signature_timestamp 
                                  ? new Date(hearing.digital_signature.signature_timestamp).toLocaleDateString('en-GB')
                                  : ''}
                              </div>
                            </div>
                          ) : (
                            <div style={{height: '60px'}}></div>
                          )}
                        </td>
                        <td style={{border: '1px solid #000', padding: '8px', verticalAlign: 'top', fontSize: '11px'}}>
                          {/* Office action space */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{marginTop: '40px', textAlign: 'right', paddingRight: '50px'}}>
                  <p style={{fontSize: '13px', marginBottom: '60px'}}>
                    <strong>By Order of Court</strong>
                  </p>
                  <div style={{borderTop: '1px solid #000', width: '250px', marginLeft: 'auto', paddingTop: '5px'}}>
                    <p style={{fontSize: '12px', textAlign: 'center', fontWeight: 'bold'}}>
                      {selectedHearing?.digital_signature?.signed_by_name || 'Presiding Judge'}
                    </p>
                    <p style={{fontSize: '11px', textAlign: 'center'}}>
                      {(() => {
                        const currentCase = cases.find(c => c.case_num === searchCaseNum) || {};
                        return currentCase.for_office_use_only?.court_allotted || currentCase.court || '';
                      })()}
                    </p>
                  </div>
                </div>
                {searchedHearings && searchedHearings.some(h => h.digital_signature?.is_signed) && (
                  <div className="digital-signature-box">
                    <h4>DIGITAL SIGNATURE VERIFICATION</h4>
                    {searchedHearings.filter(h => h.digital_signature?.is_signed).map((hearing, idx) => (
                      <div key={idx} style={{marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #ddd'}}>
                        <p><strong>Order #{idx + 1}:</strong></p>
                        <p><strong>Digitally signed by:</strong> {hearing.digital_signature.signed_by_name}</p>
                        <p><strong>DN:</strong> cn={hearing.digital_signature.signed_by_name}, o=JUDICIAL, ou={hearing.digital_signature.signed_by_role?.toUpperCase()}, c=IN</p>
                        <p><strong>Date:</strong> {hearing.digital_signature.signature_timestamp 
                          ? new Date(hearing.digital_signature.signature_timestamp).toLocaleString('en-GB', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false
                            }).replace(',', ' at')
                          : 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedHearing.attachments && selectedHearing.attachments.length > 0 && (
                  <div style={{marginTop: '30px', padding: '15px', border: '1px solid #ddd', background: '#f9f9f9'}}>
                    <h4 style={{marginBottom: '10px', fontSize: '14px'}}>Attachments</h4>
                    <ul style={{listStyle: 'none', padding: 0}}>
                      {selectedHearing.attachments.map((attachment, i) => (
                        <li key={i} style={{marginBottom: '8px', fontSize: '12px'}}>
                          <button
                            onClick={() => downloadAttachment(attachment.filename, attachment.originalname)}
                            style={{
                              background: '#0f172a',
                              color: '#fff',
                              border: 'none',
                              padding: '6px 12px',
                              cursor: 'pointer',
                              fontSize: '11px'
                            }}
                          >
                            Download: {attachment.originalname} ({(attachment.size / 1024).toFixed(2)} KB)
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div style={{marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                  <div style={{width: '200px', height: '100px', border: '1px dashed #999', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#999'}}>
                    Court Seal
                  </div>
                  <div style={{fontSize: '11px', textAlign: 'right'}}>
                    <p><strong>Office/Registry Note:</strong></p>
                    <p style={{marginTop: '5px'}}>Copy to Registry for filing</p>
                    <p style={{marginTop: '30px'}}>__________________</p>
                    <p>Office Stamp & Date</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

const renderDocuments = () => (
  <div className="advocat-documents-main-section">
    <h2 className="advocat-section-heading">Case Documents</h2>
    
    {/* Document Requests Section */}
    <div className="litigantdash-document-requests-section">
      <h3>Pending Document Requests from Court</h3>
      {requestsLoading ? (
        <div className="litigantdash-loading-spinner">Loading requests...</div>
      ) : !documentRequests || documentRequests.length === 0 ? (
        <div className="litigantdash-no-requests-message">
          No pending document requests from the court.
        </div>
      ) : (
        <div className="litigantdash-requests-grid">
          {documentRequests.filter(req => req && req.document_id).map((request) => (
            <div 
              key={request.document_id} 
              className={`litigantdash-request-card ${
                request.verification_status === 'rejected' ? 'rejected' : 
                request.verification_status === 'verified' ? 'verified' :
                request.verification_status === 'uploaded_pending_review' ? 'pending-review' :
                'pending-upload'
              }`}
            >
              <div className="litigantdash-request-card-header">
                <h4>{request.document_type || 'Unknown Document'}</h4>
                <span className={`litigantdash-request-status-badge ${request.verification_status || 'pending'}`}>
                  {(request.verification_status || 'pending').replace('_', ' ').toUpperCase()}
                </span>
              </div>
              
              <div className="litigantdash-request-card-body">
                <div className="litigantdash-request-detail-row">
                  <span className="litigantdash-label">Case Number:</span>
                  <span className="litigantdash-value">{request.case_num || 'N/A'}</span>
                </div>
                <div className="litigantdash-request-detail-row">
                  <span className="litigantdash-label">Case Type:</span>
                  <span className="litigantdash-value">{request.case_type || 'N/A'}</span>
                </div>
                {request.description && (
                  <div className="litigantdash-request-detail-row">
                    <span className="litigantdash-label">Description:</span>
                    <span className="litigantdash-value">{request.description}</span>
                  </div>
                )}
                <div className="litigantdash-request-detail-row">
                  <span className="litigantdash-label">Requested On:</span>
                  <span className="litigantdash-value">
                    {request.request_date ? new Date(request.request_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="litigantdash-request-detail-row">
                  <span className="litigantdash-label">Deadline:</span>
                  <span className="litigantdash-value litigantdash-deadline">
                    {request.submission_deadline ? new Date(request.submission_deadline).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                
                {request.verification_status === 'rejected' && request.rejection_reason && (
                  <div className="litigantdash-rejection-notice">
                    <strong>Rejection Reason:</strong> {request.rejection_reason}
                  </div>
                )}
                
                {request.verification_status === 'verified' && (
                  <div className="litigantdash-verified-notice">
                    ✓ Document verified and signed by court on{' '}
                    {request.verification_date ? new Date(request.verification_date).toLocaleDateString() : 'N/A'}
                  </div>
                )}
                
                {(request.verification_status === 'pending_upload' || 
                  request.verification_status === 'rejected') && (
                  <div className="litigantdash-upload-action-section">
                    {selectedDocumentRequest?.document_id === request.document_id ? (
                      <form 
                        onSubmit={(e) => handleRequestedDocumentUpload(e, request.document_id, request.case_num)}
                        className="litigantdash-inline-upload-form"
                      >
                        <input
                          type="file"
                          id="advocat-requested-doc-file-input"
                          onChange={handleFileChange}
                          required
                          className="litigantdash-file-input-field"
                        />
                        <div className="litigantdash-upload-buttons-group">
                          <button 
                            type="submit" 
                            className="litigantdash-upload-submit-button"
                            disabled={uploadingRequestedDoc}
                          >
                            {uploadingRequestedDoc ? 'Uploading...' : 'Upload'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDocumentRequest(null);
                              setDocumentFile(null);
                            }}
                            className="litigantdash-upload-cancel-button"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setSelectedDocumentRequest(request)}
                        className="litigantdash-upload-trigger-button"
                      >
                        {request.verification_status === 'rejected' ? 'Re-upload Document' : 'Upload Document'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* SEPARATOR */}
    <hr style={{margin: '40px 0', border: 'none', borderTop: '2px solid #e5e7eb'}} />

    {/* EXISTING DOCUMENTS SECTION - CASE SELECTOR */}
    <h3 style={{marginBottom: '20px'}}>Upload & View Case Documents</h3>
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
  {documents.map((document) => {
    // Ensure all fields exist before rendering
    if (!document || !document.document_id) return null;
    
    return (
      <tr key={document.document_id}>
        <td>{document.document_type || 'N/A'}</td>
        <td>{document.file_name || 'No file'}</td>
        <td>{document.description || 'N/A'}</td>
        <td>
          {document.uploaded_date 
            ? new Date(document.uploaded_date).toLocaleDateString()
            : 'N/A'}
        </td>
        <td>
          {document.file_name ? (
            <button
              onClick={() =>
                downloadDocument(document.document_id, document.file_name)
              }
              className="advocat-download-action-btn"
            >
              Download
            </button>
          ) : (
            <span style={{color: '#999'}}>N/A</span>
          )}
        </td>
      </tr>
    );
  })}
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