import React, { useState, useEffect, useRef } from 'react';
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

const AdvocateDashboard = () => {
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
  const [searchCaseNum, setSearchCaseNum] = useState('');
  const [searchedHearings, setSearchedHearings] = useState(null);
  const [hearingsLoading, setHearingsLoading] = useState(false);
  const [hearingsError, setHearingsError] = useState(null);
  const [selectedCaseForDocuments, setSelectedCaseForDocuments] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  const [documentError, setDocumentError] = useState(null);
  const [documentSuccess, setDocumentSuccess] = useState(null);
  const [activeSection, setActiveSection] = useState('cases');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
        const response = await axios.get('https://ecourt-yr51.onrender.com/api/advocate/profile', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setProfile(response.data.advocate);
        if (response.data.advocate.profilePicture) {
          setProfilePicture(
            `https://ecourt-yr51.onrender.com/api/advocate/profile-picture/${response.data.advocate.profilePicture}`
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

  const fetchCases = async () => {
    setCasesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://ecourt-yr51.onrender.com/api/cases/advocate', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setCases(response.data.cases || []);
    } catch (err) {
      console.error('Error fetching cases:', err);
    } finally {
      setCasesLoading(false);
    }
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current.click();
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
        'https://ecourt-yr51.onrender.com/api/advocate/profile-picture',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setProfilePicture(
        `https://ecourt-yr51.onrender.com/api/advocate/profile-picture/${
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
        `https://ecourt-yr51.onrender.com/api/case/${searchCaseNum}/hearings/advocate`,
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
        `https://ecourt-yr51.onrender.com/api/case/${caseNum}/documents/advocate`,
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
        `https://ecourt-yr51.onrender.com/api/case/${selectedCaseForDocuments.case_num}/document/advocate`,
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
      document.getElementById('document-file').value = '';
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
        `https://ecourt-yr51.onrender.com/api/document/${documentId}/download/advocate`,
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
      const response = await axios.get(`https://ecourt-yr51.onrender.com/api/files/${filename}`, {
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
        'https://ecourt-yr51.onrender.com/api/advocate/logout',
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      localStorage.removeItem('token');
      navigate('/advlogin');
    } catch (error) {
      setError(error.response?.data?.message || 'Logout failed');
    }
  };

  const handleLogoutAll = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'https://ecourt-yr51.onrender.com/api/advocate/logout-all',
        { password: logoutPassword },
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      localStorage.removeItem('token');
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
    <div className="adv-cases-section">
      <h2>My Cases</h2>
      {casesLoading ? (
        <div className="adv-loading">Loading cases...</div>
      ) : cases.length === 0 ? (
        <div className="adv-no-cases">You don't have any cases assigned yet.</div>
      ) : (
        <div className="adv-cases-table-container">
          <table className="adv-cases-table">
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
                      className={`adv-status-badge adv-status-${legalCase.status?.toLowerCase()}`}
                    >
                      {legalCase.status}
                    </span>
                  </td>
                  <td>
                    <div className="adv-action-buttons">
                      <button
                        onClick={() => {
                          setActiveSection('hearings');
                          setSearchCaseNum(legalCase.case_num);
                        }}
                        className="adv-action-button"
                      >
                        View Hearings
                      </button>
                      <button
                        onClick={() => {
                          setActiveSection('documents');
                          fetchDocuments(legalCase.case_num);
                        }}
                        className="adv-action-button"
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
    <div className="adv-hearings-section">
      <h2>Search Case Hearings</h2>
      <form onSubmit={handleHearingSearch} className="adv-hearing-search-form">
        <div className="adv-form-group">
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
        <button type="submit" className="adv-search-button">
          Search Hearings
        </button>
      </form>
      {hearingsError && <div className="adv-error-message">{hearingsError}</div>}
      {hearingsLoading ? (
        <div className="adv-loading">Loading hearings...</div>
      ) : (
        searchedHearings && (
          <div className="adv-hearings-list">
            {searchedHearings.length === 0 ? (
              <div className="adv-no-hearings">
                No hearings found for this case number.
              </div>
            ) : (
              searchedHearings.map((hearing, index) => (
                <div key={index} className="adv-hearing-card">
                  <div className="adv-hearing-header">
                    <h3>Hearing #{index + 1}</h3>
                    <span
                      className={`adv-status ${hearing.hearing_type?.toLowerCase()}`}
                    >
                      {hearing.hearing_type}
                    </span>
                  </div>
                  <div className="adv-hearing-details">
                    <div className="adv-detail-row">
                      <span className="adv-label">Hearing Date:</span>
                      <span className="adv-value">
                        {hearing.hearing_date
                          ? new Date(hearing.hearing_date).toLocaleDateString()
                          : 'Not specified'}
                      </span>
                    </div>
                    <div className="adv-detail-row">
                      <span className="adv-label">Hearing Type:</span>
                      <span className="adv-value">
                        {hearing.hearing_type || 'Not specified'}
                      </span>
                    </div>
                    {hearing.remarks && (
                      <div className="adv-detail-row">
                        <span className="adv-label">Remarks:</span>
                        <span className="adv-value">{hearing.remarks}</span>
                      </div>
                    )}
                    {hearing.next_hearing_date && (
                      <div className="adv-detail-row">
                        <span className="adv-label">Next Hearing Date:</span>
                        <span className="adv-value">
                          {new Date(hearing.next_hearing_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {hearing.attachments && hearing.attachments.length > 0 && (
                      <div className="adv-attachments-section">
                        <h4>Attachments</h4>
                        <ul className="adv-attachment-list">
                          {hearing.attachments.map((attachment, i) => (
                            <li key={i} className="adv-attachment-item">
                              <div className="adv-attachment-info">
                                <span className="adv-attachment-name">
                                  {attachment.originalname}
                                </span>
                                <span className="adv-attachment-size">
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
                                className="adv-download-button"
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
    <div className="adv-documents-section">
      <h2>Case Documents</h2>
      <div className="adv-case-selector">
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
          {cases.map((legalCase) => (
            <option key={legalCase._id} value={legalCase.case_num}>
              {legalCase.case_num} - {legalCase.case_type}
            </option>
          ))}
        </select>
      </div>
      {selectedCaseForDocuments && (
        <div className="adv-document-upload-form">
          <h3>Upload New Document</h3>
          <form onSubmit={handleDocumentUpload}>
            <div className="adv-form-group">
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
            <div className="adv-form-group">
              <label htmlFor="document-description">Description</label>
              <textarea
                id="document-description"
                value={documentDescription}
                onChange={(e) => setDocumentDescription(e.target.value)}
                placeholder="Enter document description"
              />
            </div>
            <div className="adv-form-group">
              <label htmlFor="document-file">File *</label>
              <input
                type="file"
                id="document-file"
                onChange={handleFileChange}
                required
              />
            </div>
            {documentError && <div className="adv-error-message">{documentError}</div>}
            {documentSuccess && (
              <div className="adv-success-message">{documentSuccess}</div>
            )}
            <button type="submit" className="adv-submit-button">
              Upload Document
            </button>
          </form>
        </div>
      )}
      {selectedCaseForDocuments && (
        <div className="adv-documents-list">
          <h3>Case Documents</h3>
          {documentsLoading ? (
            <div className="adv-loading">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="adv-no-documents">
              No documents found for this case.
            </div>
          ) : (
            <table className="adv-documents-table">
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
                        className="adv-download-button"
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
            <section className="adv-stats">
              <div className="adv-stat-card">
                <h3 className="adv-stat-title">Total Cases</h3>
                <p className="adv-stat-value">{cases.length}</p>
              </div>
              <div className="adv-stat-card">
                <h3 className="adv-stat-title">Pending Cases</h3>
                <p className="adv-stat-value">
                  {cases.filter((c) => c.status === 'Pending').length}
                </p>
              </div>
              <div className="adv-stat-card">
                <h3 className="adv-stat-title">Active Cases</h3>
                <p className="adv-stat-value">
                  {cases.filter((c) => c.status === 'Active').length}
                </p>
              </div>
            </section>
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
        return <div>Select an option from the sidebar</div>;
    }
  };

  if (loading) {
    return (
      <div className="adv-loading-container">
        <div className="adv-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="adv-dashboard">
      <header className="adv-header">
        <div className="adv-header-left">
          <button className="adv-sidebar-toggle" onClick={toggleSidebar}>
            ☰
          </button>
          <div className="adv-emblem-logo">
            <img src={emblem} alt="Aaditiya Tyagi" />
          </div>
          <div className="adv-justice-logo">
            <img src={logo} alt="Aaditiya Tyagi" />
          </div>
          <h1 className="adv-title">Advocate Dashboard</h1>
        </div>
        <div className="adv-header-right">
          <div className="adv-logout-buttons">
            <button className="adv-logout-btn" onClick={handleLogout}>
              <LogOut className="adv-logout-icon" />
              Logout
            </button>
            <button
              className="adv-logout-all-btn"
              onClick={() => setShowLogoutConfirm(true)}
            >
              <LogOut className="adv-logout-icon" />
              Logout All Devices
            </button>
          </div>
          <div className="adv-profile-toggle" onClick={toggleProfile}>
            {profilePicture ? (
              <div className="adv-avatar adv-avatar--with-img">
                <img
                  src={profilePicture}
                  alt={profile?.name || 'Advocate'}
                  className="adv-profile-img"
                />
              </div>
            ) : (
              <div className="adv-avatar">
                {profile?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </header>

      {isSidebarOpen && (
        <div
          className="adv-sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <div className="adv-content">
        <aside className={`adv-sidebar ${isSidebarOpen ? 'active' : ''}`}>
          <nav className="adv-nav">
            <button
              className={`adv-nav-btn ${activeSection === 'cases' ? 'active' : ''}`}
              onClick={() => handleNavigation('cases')}
            >
              <Database className="adv-nav-icon" />
              Cases
            </button>
            <button
              className={`adv-nav-btn ${activeSection === 'hearings' ? 'active' : ''}`}
              onClick={() => handleNavigation('hearings')}
            >
              <Calendar className="adv-nav-icon" />
              Hearings
            </button>
            <button
              className={`adv-nav-btn ${activeSection === 'documents' ? 'active' : ''}`}
              onClick={() => handleNavigation('documents')}
            >
              <FileText className="adv-nav-icon" />
              Documents
            </button>
            <button
              className={`adv-nav-btn ${activeSection === 'noticeboard' ? 'active' : ''}`}
              onClick={() => handleNavigation('noticeboard')}
            >
              <Info className="adv-nav-icon" />
              Notice Board
            </button>
            <button
              className={`adv-nav-btn ${activeSection === 'calendar' ? 'active' : ''}`}
              onClick={() => handleNavigation('calendar')}
            >
              <Calendar className="adv-nav-icon" />
              Court Calendar
            </button>
            <button
              className={`adv-nav-btn ${activeSection === 'caseassign' ? 'active' : ''}`}
              onClick={() => handleNavigation('caseassign')}
            >
              <Book className="adv-nav-icon" />
              Case Join Request
            </button>
            <button
              className={`adv-nav-btn ${activeSection === 'filecase' ? 'active' : ''}`}
              onClick={() => handleNavigation('filecase')}
            >
              <FileText className="adv-nav-icon" />
              File a Case
            </button>
            <button
              className={`adv-nav-btn ${activeSection === 'meetings' ? 'active' : ''}`}
              onClick={() => handleNavigation('meetings')}
            >
              <Users className="adv-nav-icon" />
              Scheduled Meetings
            </button>
          </nav>
        </aside>

        <main className="adv-main">{renderContent()}</main>
      </div>

      {isProfileOpen && (
        <div className="adv-profile-overlay">
          <div className="adv-profile-modal">
            <button className="adv-close-profile" onClick={toggleProfile}>
              ×
            </button>
            <div className="adv-profile-content">
              <div className="adv-profile-picture-section">
                {profilePicture ? (
                  <div className="adv-profile-avatar adv-profile-avatar--with-img">
                    <img
                      src={profilePicture}
                      alt={profile?.name || 'Advocate'}
                      className="adv-profile-img"
                    />
                  </div>
                ) : (
                  <div className="adv-profile-avatar">
                    {profile?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleProfilePictureChange}
                />
                <button
                  className="adv-profile-picture-btn"
                  onClick={handleUploadButtonClick}
                  disabled={uploadingPicture}
                >
                  {uploadingPicture ? 'Uploading...' : 'Change Photo'}
                </button>
                {pictureError && (
                  <div className="adv-profile-picture-error">{pictureError}</div>
                )}
              </div>
              <h2 className="adv-profile-name">{profile?.name}</h2>
              <h4 className="adv-profile-id">{profile?.advocate_id}</h4>
              <p className="adv-profile-email">{profile?.email}</p>
              <p className="adv-profile-district">District: {profile?.district}</p>
              <div className="adv-profile-details">
                <div className="adv-profile-detail-item">
                  <span className="adv-profile-detail-label">Enrollment No:</span>
                  <strong className="adv-profile-detail-value">
                    {profile?.enrollment_no}
                  </strong>
                </div>
                <div className="adv-profile-detail-item">
                  <span className="adv-profile-detail-label">Status:</span>
                  <strong className="adv-profile-detail-value">
                    {profile?.status}
                  </strong>
                </div>
                <div className="adv-profile-detail-item">
                  <span className="adv-profile-detail-label">Practice Area:</span>
                  <strong className="adv-profile-detail-value">
                    {profile?.practice_details?.district_court
                      ? 'District Court'
                      : 'Not Specified'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="adv-logout-overlay">
          <div className="adv-logout-modal">
            <h3 className="adv-logout-title">Confirm Logout from All Devices</h3>
            <p className="adv-logout-text">Please enter your password to confirm:</p>
            <input
              type="password"
              value={logoutPassword}
              onChange={(e) => setLogoutPassword(e.target.value)}
              placeholder="Enter your password"
              className="adv-password-input"
            />
            <div className="adv-logout-actions">
              <button onClick={handleLogoutAll} className="adv-confirm-btn">
                Confirm Logout
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  setLogoutPassword('');
                }}
                className="adv-cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="adv-error-message">
          <X className="adv-error-icon" />
          {error}
        </div>
      )}
    </div>
  );
};

export default AdvocateDashboard;