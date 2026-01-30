import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LogOut, FileText, Calendar, Database, Info, Book, Users, Video, X } from 'lucide-react';
import '../ComponentsCSS/LitigantDashboardStyles.css';
import emblem from '../images/aadiimage4.svg';
import logo from '../images/aadiimage4.png';
import stamp from '../images/aadiimage8.png';

// Import components
import NoticeBoard from '../Components/NoticeBoard';
import UserCalendar from '../Components/UserCalendar';
import LitigantMeeting from '../Components/Litigantmeeting';
import LitigantCaseAssign from '../Components/litigantcaseassign';
import UploadVideoPlead from '../Components/UploadVideo';
import LegalAssistantChatbot from '../Components/LegalAssistantChatbot';
import NyaaySaathi from '../Components/nyaaysaathi';
const LitigantDashboard = () => {
  // Profile and Auth State
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutPassword, setLogoutPassword] = useState('');

  // Navigation State - Persist active section in localStorage
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem('litigant_active_section') || 'dashboard';
  });

  // Cases State
  const [cases, setCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewMode, setViewMode] = useState('details');

  // Hearings State
  const [searchCaseNum, setSearchCaseNum] = useState('');
  const [searchedHearings, setSearchedHearings] = useState(null);
  const [hearingsLoading, setHearingsLoading] = useState(false);
  const [hearingsError, setHearingsError] = useState(null);
  const [allHearings, setAllHearings] = useState([]);

  // Documents State
  const [documents, setDocuments] = useState([]);
  const [selectedCaseForDocuments, setSelectedCaseForDocuments] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [documentError, setDocumentError] = useState('');
  const [documentSuccess, setDocumentSuccess] = useState('');
  const [documentsLoading, setDocumentsLoading] = useState(false);

  // Form State
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const navigate = useNavigate();

  const initialFormState = {
    court: 'District & Sessions Court',
    case_type: 'Civil',
    plaintiff_details: {
      party_id: '',
      name: '',
      father_mother_husband: '',
      address: '',
      pin: '',
      sex: '',
      age: '',
      caste: '',
      nationality: 'Indian',
      if_other_mention: '',
      occupation: '',
      email: '',
      phone: '',
      mobile: '',
      fax: '',
      subject: '',
      advocate_id: '',
      advocate: '',
    },
    respondent_details: {
      party_id: '',
      name: '',
      father_mother_husband: '',
      address: '',
      pin: '',
      sex: '',
      age: '',
      caste: '',
      nationality: 'Indian',
      if_other_mention: '',
      occupation: '',
      email: '',
      phone: '',
      mobile: '',
      fax: '',
      subject: '',
      advocate_id: '',
      advocate: '',
    },
    police_station_details: {
      police_station: '',
      fir_no: '',
      fir_year: new Date().getFullYear(),
      date_of_offence: '',
    },
    lower_court_details: {
      court_name: '',
      case_no: '',
      decision_date: '',
    },
    main_matter_details: {
      case_type: '',
      case_no: '',
      year: new Date().getFullYear(),
    },
  };

  const [formData, setFormData] = useState(initialFormState);

  // Persist active section to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('litigant_active_section', activeSection);
  }, [activeSection]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/litilogin');
          throw new Error('No authentication token found');
        }
        const response = await axios.get('http://localhost:5000/api/litigant/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(response.data.litigant);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        setLoading(false);
        if (err.response?.status === 401) navigate('/litilogin');
      }
    };
    fetchProfile();
  }, [navigate]);

  // Fetch cases
  useEffect(() => {
    const fetchCases = async () => {
      setCasesLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/cases/litigant', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCases(response.data.cases || []);
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to fetch cases');
      } finally {
        setCasesLoading(false);
      }
    };
    if (activeSection === 'dashboard') {
      fetchCases();
    }
  }, [activeSection]);

  // Fetch hearings
  useEffect(() => {
    const fetchAllHearings = async () => {
      setHearingsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const hearingPromises = cases.map((legalCase) =>
          axios.get(`http://localhost:5000/api/case/${legalCase.case_num}/hearings`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        );
        const responses = await Promise.all(hearingPromises);
        const allHearingsData = responses.reduce((acc, response, index) => {
          const caseHearings = response.data.hearings.map((hearing) => ({
            ...hearing,
            case_num: cases[index].case_num,
            case_type: cases[index].case_type,
          }));
          return [...acc, ...caseHearings];
        }, []);
        const sortedHearings = allHearingsData.sort(
          (a, b) => new Date(b.hearing_date) - new Date(a.hearing_date)
        );
        setAllHearings(sortedHearings);
        setHearingsError(null);
      } catch (error) {
        setHearingsError(error.response?.data?.message || 'Failed to fetch hearings');
      } finally {
        setHearingsLoading(false);
      }
    };

    if (activeSection === 'hearings' && cases.length > 0) {
      fetchAllHearings();
    }
  }, [activeSection, cases]);

  const handleHearingSearch = async (e) => {
    e.preventDefault();
    setHearingsLoading(true);
    setHearingsError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/case/${searchCaseNum}/hearings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSearchedHearings(response.data.hearings);
    } catch (error) {
      setHearingsError(error.response?.data?.message || 'Failed to fetch hearings');
    } finally {
      setHearingsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/litigant/logout',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.removeItem('token');
      localStorage.removeItem('litigant_active_section');
      navigate('/litilogin');
    } catch (error) {
      setError(error.response?.data?.message || 'Logout failed');
    }
  };

  const handleLogoutAll = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/litigant/logout-all',
        { password: logoutPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.removeItem('token');
      localStorage.removeItem('litigant_active_section');
      setShowLogoutConfirm(false);
      navigate('/litilogin');
    } catch (error) {
      setError(error.response?.data?.message || 'Logout from all devices failed');
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNavigation = (section) => {
    setActiveSection(section);
    setIsSidebarOpen(false);
  };

  const handleTopLevelChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === 'case_type' && value === 'Civil') {
        delete newData.police_station_details;
      }
      return newData;
    });
  };

  const handleNestedChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    try {
      const token = localStorage.getItem('token');
      const dataToSubmit = { ...formData };
      if (formData.case_type === 'Civil') {
        delete dataToSubmit.police_station_details;
      }
      const response = await axios.post(
        'http://localhost:5000/api/filecase/litigant',
        dataToSubmit,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFormSuccess(`Case filed successfully! Case Number: ${response.data.case_num}`);
      setFormData(initialFormState);
      setActiveSection('dashboard');
    } catch (error) {
      setFormError(error.response?.data?.message || 'Failed to file case');
    }
  };

  const fetchDocuments = async (caseNum) => {
    setDocumentsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/cases/litigant', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const caseData = response.data.cases.find((c) => c.case_num === caseNum);
      if (caseData) {
        setDocuments(caseData.documents || []);
        setSelectedCaseForDocuments(caseData);
        setDocumentError('');
      } else {
        setDocumentError('Case not found');
        setDocuments([]);
      }
    } catch (error) {
      setDocumentError(error.response?.data?.message || 'Failed to fetch documents');
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setDocumentFile(e.target.files[0]);
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    setDocumentError('');
    setDocumentSuccess('');
    if (!documentFile) {
      setDocumentError('Please select a file to upload');
      return;
    }
    if (!documentType) {
      setDocumentError('Document type is required');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', documentFile);
      formData.append('document_type', documentType);
      formData.append('description', documentDescription);
      await axios.post(
        `http://localhost:5000/api/case/${selectedCaseForDocuments.case_num}/document`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setDocumentSuccess('Document uploaded successfully');
      fetchDocuments(selectedCaseForDocuments.case_num);
      setDocumentFile(null);
      setDocumentType('');
      setDocumentDescription('');
      document.getElementById('litigantdoc-upload-file-input').value = '';
    } catch (error) {
      setDocumentError(error.response?.data?.message || 'Failed to upload document');
    }
  };

  const downloadDocument = async (documentId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/document/${documentId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download the document');
    }
  };

  const downloadAttachment = async (filename, originalname) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/files/${filename}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalname);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download the file');
    }
  };

  const printReceipt = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const receiptContent = document.querySelector('.lit-case-filing-receipt');
    if (!receiptContent) {
      alert('Receipt content not found');
      printWindow.close();
      return;
    }
    const printDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Case Filing Receipt</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Times New Roman', Times, serif; padding: 20px; }
            .lit-case-filing-receipt {
              max-width: 800px; margin: 0 auto; padding: 40px 50px; background-color: #fff;
              color: #222; border: 1px solid #999; position: relative; line-height: 1.5;
            }
            .lit-case-filing-receipt::before {
              content: ""; position: absolute; top: 5px; left: 5px; right: 5px; bottom: 5px;
              border: 2px double #8b0000; pointer-events: none;
            }
            .lit-receipt-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #8b0000; padding-bottom: 20px; }
            .lit-receipt-logo { display: flex; justify-content: center; align-items: center; margin-bottom: 15px; }
            .lit-govt-emblem { width: 80px; height: 80px; margin-right: 20px; }
            .lit-govt-emblem img { width: 100%; height: 100%; object-fit: contain; }
            .lit-receipt-title h2 { font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; color: #8b0000; }
            .lit-receipt-title h3 { font-size: 20px; margin: 5px 0; font-weight: bold; }
            .lit-receipt-title p { font-size: 16px; margin: 5px 0; }
            .lit-receipt-heading { font-size: 22px; font-weight: bold; margin: 20px 0 15px; text-align: center; text-transform: uppercase; }
            .lit-receipt-heading::after { content: ""; display: block; width: 200px; height: 2px; background-color: #8b0000; margin: 10px auto; }
            .lit-receipt-number { display: flex; justify-content: space-between; margin: 20px 0; font-size: 15px; }
            .lit-receipt-content { font-size: 15px; }
            .lit-case-filing-details { display: flex; justify-content: space-between; margin-bottom: 20px; background-color: #f0f0f0; padding: 10px 15px; border-left: 4px solid #8b0000; }
            .lit-party-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .lit-applicant-details, .lit-respondent-details { width: 48%; padding: 15px; background-color: #f5f5f5; border: 1px solid #ddd; }
            .lit-applicant-details h3, .lit-respondent-details h3 { font-size: 16px; margin: 0 0 10px; color: #8b0000; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .lit-receipt-body { margin: 20px 0; text-align: justify; line-height: 1.6; }
            .lit-receipt-notes { margin-top: 30px; }
            .lit-receipt-notes h3 { font-size: 16px; margin-bottom: 10px; color: #8b0000; }
            .lit-receipt-notes ol { margin-left: 20px; margin-bottom: 30px; }
            .lit-receipt-notes ol li { margin-bottom: 8px; }
            .lit-receipt-footer { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; }
            .lit-court-seal { width: 120px; height: 120px; }
            .lit-court-seal img { width: 100%; height: 100%; object-fit: contain; opacity: 0.8; }
            .lit-signatory-section { width: 200px; text-align: center; }
            .lit-signature-line { border-bottom: 1px solid #000; margin-bottom: 10px; height: 40px; }
            .lit-signatory { font-weight: bold; margin: 0; }
            @media print { body { padding: 0; } .lit-case-filing-receipt { border: none; box-shadow: none; } @page { size: A4; margin: 1cm; } }
          </style>
        </head>
        <body>
          ${receiptContent.outerHTML}
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

  // Header Component
  const DashboardHeader = () => (
    <header className="litigantdash-main-header-container">
      <div className="litigantdash-header-left-section">
        <button className="litigantdash-sidebar-hamburger-toggle" onClick={toggleSidebar}>
          ☰
        </button>
        <div className="litigantdash-emblem-container">
          <img src={emblem} alt="Emblem" />
        </div>
        <div className="litigantdash-justice-logo-container">
          <img src={logo} alt="Logo" />
        </div>
        <h1 className="litigantdash-page-title-text">Litigant Dashboard</h1>
      </div>
      <div className="litigantdash-header-right-section">
        <div className="litigantdash-logout-buttons-group">
          <button className="litigantdash-single-logout-button" onClick={handleLogout}>
            <LogOut className="litigantdash-logout-icon-svg" />
            Logout
          </button>
          <button className="litigantdash-all-devices-logout-button"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <LogOut className="litigantdash-logout-icon-svg" />
            Logout All Devices
          </button>
        </div>
        <div
          className="litigantdash-profile-avatar-trigger"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
        >
          <div className="litigantdash-user-avatar-circle">
            {profile?.full_name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );

  const renderDashboard = () => (
    <div className="litigantdash-dashboard-main-section">
      <section className="litigantdash-cases-list-section">
        <h2>Your Cases</h2>
        {loading ? (
          <div className="litigantdash-loading-spinner">Loading cases...</div>
        ) : error ? (
          <div className="litigantdash-error-alert-message">{error}</div>
        ) : cases.length === 0 ? (
          <div className="litigantdash-no-cases-message">No cases found. File a new case to get started.</div>
        ) : (
          <div className="litigantdash-cases-grid-container">
            {cases.map((legalCase) => (
              <div key={legalCase._id} className="litigantdash-case-card-box">
                <div className="litigantdash-case-card-header">
                  <h3>{legalCase.case_num}</h3>
                  <span className={`litigantdash-status-badge ${legalCase.status}`}>{legalCase.status}</span>
                </div>
                <div className="litigantdash-case-card-details">
                  <p><strong>Type:</strong> {legalCase.case_type}</p>
                  <p><strong>Court:</strong> {legalCase.court}</p>
                  <p><strong>Filed:</strong> {new Date(legalCase.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="litigantdash-case-card-actions">
                  <button
                    className="litigantdash-view-details-button"
                    onClick={() => {
                      setSelectedCase(legalCase);
                      setIsDetailsOpen(true);
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {isDetailsOpen && selectedCase && (
          <div
            className="litigantdash-case-details-overlay-backdrop"
            onClick={(e) => {
              if (e.target.className === 'litigantdash-case-details-overlay-backdrop') {
                setIsDetailsOpen(false);
              }
            }}
          >
            <div className="litigantdash-case-details-modal-wrapper">
              <div className="litigantdash-modal-header-bar">
                <div className="litigantdash-header-left-info">
                  <h2>Case: {selectedCase.case_num}</h2>
                </div>
                <div className="litigantdash-details-view-tabs">
                  <button
                    className={viewMode === 'details' ? 'litigantdash-active-tab-button' : ''}
                    onClick={() => setViewMode('details')}
                  >
                    Case Details
                  </button>
                  <button
                    className={viewMode === 'receipt' ? 'litigantdash-active-tab-button' : ''}
                    onClick={() => setViewMode('receipt')}
                  >
                    Case Filing Receipt
                  </button>
                </div>
                <div className="litigantdash-header-right-actions">
                  <button className="litigantdash-print-receipt-button" onClick={printReceipt}>
                    Print Receipt
                  </button>
                  <button className="litigantdash-close-modal-button" onClick={() => setIsDetailsOpen(false)}>
                    ×
                  </button>
                </div>
              </div>
              <div className="litigantdash-modal-content-scrollable-area">
                <div
                  className="litigantdash-modal-content-panel"
                  style={{ display: viewMode === 'details' ? 'block' : 'none' }}
                >
                  <div className="litigantdash-case-details-content-wrapper">
                    <div className="litigantdash-case-status-info-banner">
                      <div className="litigantdash-status-info-wrapper">
                        <span className={`litigantdash-status-label ${selectedCase.status?.toLowerCase()}`}>
                          {selectedCase.status || 'Pending'}
                        </span>
                        <span className="litigantdash-filing-date-label">
                          Filed: {selectedCase.createdAt && new Date(selectedCase.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="litigantdash-case-details-grid-layout">
                      <div className="litigantdash-detail-group-section">
                        <h3>Basic Information</h3>
                        <div className="litigantdash-detail-item-row">
                          <span className="litigantdash-detail-label-text">Case Type:</span>
                          <span className="litigantdash-detail-value-text">{selectedCase.case_type}</span>
                        </div>
                        <div className="litigantdash-detail-item-row">
                          <span className="litigantdash-detail-label-text">Court:</span>
                          <span className="litigantdash-detail-value-text">{selectedCase.court}</span>
                        </div>
                        <div className="litigantdash-detail-item-row">
                          <span className="litigantdash-detail-label-text">Filed Date:</span>
                          <span className="litigantdash-detail-value-text">
                            {selectedCase.createdAt && new Date(selectedCase.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="litigantdash-detail-group-section">
                        <h3>Plaintiff Details</h3>
                        <div className="litigantdash-detail-item-row">
                          <span className="litigantdash-detail-label-text">Name:</span>
                          <span className="litigantdash-detail-value-text">{selectedCase.plaintiff_details?.name}</span>
                        </div>
                        <div className="litigantdash-detail-item-row">
                          <span className="litigantdash-detail-label-text">Contact:</span>
                          <span className="litigantdash-detail-value-text">{selectedCase.plaintiff_details?.mobile}</span>
                        </div>
                        <div className="litigantdash-detail-item-row">
                          <span className="litigantdash-detail-label-text">Address:</span>
                          <span className="litigantdash-detail-value-text">{selectedCase.plaintiff_details?.address}</span>
                        </div>
                      </div>
                      <div className="litigantdash-detail-group-section">
                        <h3>Respondent Details</h3>
                        <div className="litigantdash-detail-item-row">
                          <span className="litigantdash-detail-label-text">Name:</span>
                          <span className="litigantdash-detail-value-text">{selectedCase.respondent_details?.name}</span>
                        </div>
                        <div className="litigantdash-detail-item-row">
                          <span className="litigantdash-detail-label-text">Contact:</span>
                          <span className="litigantdash-detail-value-text">{selectedCase.respondent_details?.mobile}</span>
                        </div>
                        <div className="litigantdash-detail-item-row">
                          <span className="litigantdash-detail-label-text">Address:</span>
                          <span className="litigantdash-detail-value-text">{selectedCase.respondent_details?.address}</span>
                        </div>
                      </div>
                      {selectedCase.police_station_details && (
                        <div className="litigantdash-detail-group-section">
                          <h3>Police Station Details</h3>
                          <div className="litigantdash-detail-item-row">
                            <span className="litigantdash-detail-label-text">Station:</span>
                            <span className="litigantdash-detail-value-text">{selectedCase.police_station_details.police_station}</span>
                          </div>
                          <div className="litigantdash-detail-item-row">
                            <span className="litigantdash-detail-label-text">FIR Number:</span>
                            <span className="litigantdash-detail-value-text">{selectedCase.police_station_details.fir_no}</span>
                          </div>
                          <div className="litigantdash-detail-item-row">
                            <span className="litigantdash-detail-label-text">FIR Year:</span>
                            <span className="litigantdash-detail-value-text">{selectedCase.police_station_details.fir_year}</span>
                          </div>
                        </div>
                      )}
                      <div className="litigantdash-detail-group-section">
                        <h3>Lower Court Details</h3>
                        <div className="litigantdash-detail-item-row">
                          <span className="litigantdash-detail-label-text">Court Name:</span>
                          <span className="litigantdash-detail-value-text">{selectedCase.lower_court_details?.court_name}</span>
                        </div>
                        <div className="litigantdash-detail-item-row">
                          <span className="litigantdash-detail-label-text">Case Number:</span>
                          <span className="litigantdash-detail-value-text">{selectedCase.case_num}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="litigantdash-modal-content-panel"
                  style={{ display: viewMode === 'receipt' ? 'block' : 'none' }}
                >
                  <div className="lit-case-filing-receipt">
                    <div className="lit-receipt-header">
                      <div className="lit-receipt-logo">
                        <div className="lit-govt-emblem">
                          <img src={emblem} alt="Emblem" />
                        </div>
                        <div className="lit-receipt-title">
                          <h2>Judicial Courts of India</h2>
                          <h3>{selectedCase.court || 'District Court'}</h3>
                          <p>{selectedCase.for_office_use_only?.court_allotted || 'Not allotted yet'}</p>
                        </div>
                      </div>
                      <h2 className="lit-receipt-heading">Case Filing Receipt</h2>
                      <div className="lit-receipt-number">
                        <p><strong>CBR Number:</strong> {selectedCase.cbr_number || selectedCase.case_num}</p>
                        <p><strong>Filing Date:</strong> {selectedCase.createdAt && new Date(selectedCase.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="lit-receipt-content">
                      <div className="lit-case-filing-details">
                        <p><strong>Case Type:</strong> {selectedCase.case_type || 'CIVIL CASE'}</p>
                        <p><strong>Court:</strong> {selectedCase.court}</p>
                      </div>
                      <div className="lit-party-details">
                        <div className="lit-applicant-details">
                          <h3>Plaintiff Details:</h3>
                          <p>{selectedCase.plaintiff_details?.name}</p>
                          <p>{selectedCase.plaintiff_details?.address}</p>
                          <p>Contact: {selectedCase.plaintiff_details?.mobile}</p>
                        </div>
                        <div className="lit-respondent-details">
                          <h3>Respondent Details:</h3>
                          <p>{selectedCase.respondent_details?.name}</p>
                          <p>{selectedCase.respondent_details?.address}</p>
                          <p>Contact: {selectedCase.respondent_details?.mobile}</p>
                        </div>
                      </div>
                      <div className="lit-receipt-body">
                        <p>
                          This is to acknowledge receipt of case filing documents for case number {selectedCase.case_num}
                          dated {selectedCase.createdAt && new Date(selectedCase.createdAt).toLocaleDateString()}
                          filed by {selectedCase.plaintiff_details?.name} against {selectedCase.respondent_details?.name}
                          related to {selectedCase.case_subject || selectedCase.case_type}
                          along with the applicable filing fee of ₹{selectedCase.filing_fee || '1,000'}.
                        </p>
                      </div>
                      <div className="lit-receipt-notes">
                        <h3>Important Information:</h3>
                        <ol>
                          <li>Please quote the case number in all future correspondence.</li>
                          <li>The first hearing date will be communicated separately through official channels.</li>
                          <li>Any changes to contact information must be promptly communicated to the court.</li>
                          <li>All subsequent filings related to this case must reference this case number.</li>
                        </ol>
                        <div className="lit-receipt-footer">
                          <div className="lit-court-seal">
                            <img src={stamp} alt="Court Seal" />
                          </div>
                          <div className="lit-signatory-section">
                            <div className="lit-signature-line"></div>
                            <p className="lit-signatory">Court Registrar</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
  const renderFileCase = () => (
    <div className="litigantdash-file-case-main-section">
      <h2>File New Case</h2>
      <form onSubmit={handleFormSubmit} className="litigantdash-case-filing-form-container">
        <div className="litigantdash-form-section-block">
          <h3>Basic Case Information</h3>
          <div className="litigantdash-form-row-container">
            <div className="litigantdash-form-group-item">
              <label>Court</label>
              <select
                value={formData.court}
                onChange={(e) => handleTopLevelChange('court', e.target.value)}
                required
              >
                <option value="District & Sessions Court">District & Sessions Court</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="litigantdash-form-group-item">
              <label>Case Type</label>
              <select
                value={formData.case_type}
                onChange={(e) => handleTopLevelChange('case_type', e.target.value)}
                required
              >
                <option value="Civil">Civil</option>
                <option value="Criminal">Criminal</option>
              </select>
            </div>
          </div>
        </div>
        <div className="litigantdash-form-section-block">
          <h3>Plaintiff Details</h3>
          <div className="litigantdash-form-grid-layout">
            <div className="litigantdash-form-group-item">
              <label>Name</label>
              <input
                type="text"
                value={formData.plaintiff_details.name}
                onChange={(e) => handleNestedChange('plaintiff_details', 'name', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Father/Mother/Husband</label>
              <input
                type="text"
                value={formData.plaintiff_details.father_mother_husband}
                onChange={(e) =>
                  handleNestedChange('plaintiff_details', 'father_mother_husband', e.target.value)
                }
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Address</label>
              <input
                type="text"
                value={formData.plaintiff_details.address}
                onChange={(e) => handleNestedChange('plaintiff_details', 'address', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>PIN Code</label>
              <input
                type="text"
                value={formData.plaintiff_details.pin}
                onChange={(e) => handleNestedChange('plaintiff_details', 'pin', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Sex</label>
              <select
                value={formData.plaintiff_details.sex}
                onChange={(e) => handleNestedChange('plaintiff_details', 'sex', e.target.value)}
                required
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="litigantdash-form-group-item">
              <label>Age</label>
              <input
                type="number"
                value={formData.plaintiff_details.age}
                onChange={(e) => handleNestedChange('plaintiff_details', 'age', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Caste</label>
              <input
                type="text"
                value={formData.plaintiff_details.caste}
                onChange={(e) => handleNestedChange('plaintiff_details', 'caste', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Nationality</label>
              <select
                value={formData.plaintiff_details.nationality}
                onChange={(e) => handleNestedChange('plaintiff_details', 'nationality', e.target.value)}
                required
              >
                <option value="Indian">Indian</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {formData.plaintiff_details.nationality === 'Other' && (
              <div className="litigantdash-form-group-item">
                <label>Specify Nationality</label>
                <input
                  type="text"
                  value={formData.plaintiff_details.if_other_mention}
                  onChange={(e) =>
                    handleNestedChange('plaintiff_details', 'if_other_mention', e.target.value)
                  }
                  required
                />
              </div>
            )}
            <div className="litigantdash-form-group-item">
              <label>Occupation</label>
              <input
                type="text"
                value={formData.plaintiff_details.occupation}
                onChange={(e) => handleNestedChange('plaintiff_details', 'occupation', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Email</label>
              <input
                type="email"
                value={formData.plaintiff_details.email}
                onChange={(e) => handleNestedChange('plaintiff_details', 'email', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Phone</label>
              <input
                type="text"
                value={formData.plaintiff_details.phone}
                onChange={(e) => handleNestedChange('plaintiff_details', 'phone', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Mobile</label>
              <input
                type="text"
                value={formData.plaintiff_details.mobile}
                onChange={(e) => handleNestedChange('plaintiff_details', 'mobile', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Fax</label>
              <input
                type="text"
                value={formData.plaintiff_details.fax}
                onChange={(e) => handleNestedChange('plaintiff_details', 'fax', e.target.value)}
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Subject</label>
              <input
                type="text"
                value={formData.plaintiff_details.subject}
                onChange={(e) => handleNestedChange('plaintiff_details', 'subject', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Advocate ID</label>
              <input
                type="text"
                value={formData.plaintiff_details.advocate_id}
                onChange={(e) => handleNestedChange('plaintiff_details', 'advocate_id', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Advocate Name</label>
              <input
                type="text"
                value={formData.plaintiff_details.advocate}
                onChange={(e) => handleNestedChange('plaintiff_details', 'advocate', e.target.value)}
                required
              />
            </div>
          </div>
        </div>
        <div className="litigantdash-form-section-block">
          <h3>Respondent Details</h3>
          <div className="litigantdash-form-grid-layout">
            <div className="litigantdash-form-group-item">
              <label>Party ID</label>
              <input
                type="text"
                value={formData.respondent_details.party_id}
                onChange={(e) => handleNestedChange('respondent_details', 'party_id', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Name</label>
              <input
                type="text"
                value={formData.respondent_details.name}
                onChange={(e) => handleNestedChange('respondent_details', 'name', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Father/Mother/Husband</label>
              <input
                type="text"
                value={formData.respondent_details.father_mother_husband}
                onChange={(e) =>
                  handleNestedChange('respondent_details', 'father_mother_husband', e.target.value)
                }
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Address</label>
              <input
                type="text"
                value={formData.respondent_details.address}
                onChange={(e) => handleNestedChange('respondent_details', 'address', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>PIN Code</label>
              <input
                type="text"
                value={formData.respondent_details.pin}
                onChange={(e) => handleNestedChange('respondent_details', 'pin', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Sex</label>
              <select
                value={formData.respondent_details.sex}
                onChange={(e) => handleNestedChange('respondent_details', 'sex', e.target.value)}
                required
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="litigantdash-form-group-item">
              <label>Age</label>
              <input
                type="number"
                value={formData.respondent_details.age}
                onChange={(e) => handleNestedChange('respondent_details', 'age', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Caste</label>
              <input
                type="text"
                value={formData.respondent_details.caste}
                onChange={(e) => handleNestedChange('respondent_details', 'caste', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Nationality</label>
              <select
                value={formData.respondent_details.nationality}
                onChange={(e) => handleNestedChange('respondent_details', 'nationality', e.target.value)}
                required
              >
                <option value="Indian">Indian</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {formData.respondent_details.nationality === 'Other' && (
              <div className="litigantdash-form-group-item">
                <label>Specify Nationality</label>
                <input
                  type="text"
                  value={formData.respondent_details.if_other_mention}
                  onChange={(e) =>
                    handleNestedChange('respondent_details', 'if_other_mention', e.target.value)
                  }
                  required
                />
              </div>
            )}
            <div className="litigantdash-form-group-item">
              <label>Occupation</label>
              <input
                type="text"
                value={formData.respondent_details.occupation}
                onChange={(e) => handleNestedChange('respondent_details', 'occupation', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Email</label>
              <input
                type="email"
                value={formData.respondent_details.email}
                onChange={(e) => handleNestedChange('respondent_details', 'email', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Phone</label>
              <input
                type="text"
                value={formData.respondent_details.phone}
                onChange={(e) => handleNestedChange('respondent_details', 'phone', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Mobile</label>
              <input
                type="text"
                value={formData.respondent_details.mobile}
                onChange={(e) => handleNestedChange('respondent_details', 'mobile', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Fax</label>
              <input
                type="text"
                value={formData.respondent_details.fax}
                onChange={(e) => handleNestedChange('respondent_details', 'fax', e.target.value)}
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Subject</label>
              <input
                type="text"
                value={formData.respondent_details.subject}
                onChange={(e) => handleNestedChange('respondent_details', 'subject', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Advocate ID</label>
              <input
                type="text"
                value={formData.respondent_details.advocate_id}
                onChange={(e) => handleNestedChange('respondent_details', 'advocate_id', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Advocate Name</label>
              <input
                type="text"
                value={formData.respondent_details.advocate}
                onChange={(e) => handleNestedChange('respondent_details', 'advocate', e.target.value)}
                required
              />
            </div>
          </div>
        </div>
        {formData.case_type === 'Criminal' && (
          <div className="litigantdash-form-section-block">
            <h3>Police Station Details</h3>
            <div className="litigantdash-form-grid-layout">
              <div className="litigantdash-form-group-item">
                <label>Police Station</label>
                <input
                  type="text"
                  value={formData.police_station_details.police_station}
                  onChange={(e) =>
                    handleNestedChange('police_station_details', 'police_station', e.target.value)
                  }
                  required
                />
              </div>
              <div className="litigantdash-form-group-item">
                <label>FIR Number</label>
                <input
                  type="text"
                  value={formData.police_station_details.fir_no}
                  onChange={(e) => handleNestedChange('police_station_details', 'fir_no', e.target.value)}
                  required
                />
              </div>
              <div className="litigantdash-form-group-item">
                <label>FIR Year</label>
                <input
                  type="number"
                  value={formData.police_station_details.fir_year}
                  onChange={(e) => handleNestedChange('police_station_details', 'fir_year', e.target.value)}
                  required
                />
              </div>
              <div className="litigantdash-form-group-item">
                <label>Date of Offence</label>
                <input
                  type="date"
                  value={formData.police_station_details.date_of_offence}
                  onChange={(e) =>
                    handleNestedChange('police_station_details', 'date_of_offence', e.target.value)
                  }
                  required
                />
              </div>
            </div>
          </div>
        )}
        <div className="litigantdash-form-section-block">
          <h3>Lower Court Details</h3>
          <div className="litigantdash-form-grid-layout">
            <div className="litigantdash-form-group-item">
              <label>Court Name</label>
              <input
                type="text"
                value={formData.lower_court_details.court_name}
                onChange={(e) => handleNestedChange('lower_court_details', 'court_name', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Case Number</label>
              <input
                type="text"
                value={formData.lower_court_details.case_no}
                onChange={(e) => handleNestedChange('lower_court_details', 'case_no', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Decision Date</label>
              <input
                type="date"
                value={formData.lower_court_details.decision_date}
                onChange={(e) => handleNestedChange('lower_court_details', 'decision_date', e.target.value)}
                required
              />
            </div>
          </div>
        </div>
        <div className="litigantdash-form-section-block">
          <h3>Main Matter Details</h3>
          <div className="litigantdash-form-grid-layout">
            <div className="litigantdash-form-group-item">
              <label>Case Type</label>
              <input
                type="text"
                value={formData.main_matter_details.case_type}
                onChange={(e) => handleNestedChange('main_matter_details', 'case_type', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Case Number</label>
              <input
                type="text"
                value={formData.main_matter_details.case_no}
                onChange={(e) => handleNestedChange('main_matter_details', 'case_no', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Year</label>
              <input
                type="number"
                value={formData.main_matter_details.year}
                onChange={(e) => handleNestedChange('main_matter_details', 'year', e.target.value)}
                required
              />
            </div>
          </div>
        </div>
        {formError && <div className="litigantdash-error-alert-message">{formError}</div>}
        {formSuccess && <div className="litigantdash-success-alert-message">{formSuccess}</div>}
        <div className="litigantdash-form-actions-buttons">
          <button type="submit" className="litigantdash-submit-form-button">
            File Case
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('dashboard')}
            className="litigantdash-cancel-form-button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
  const renderHearings = () => (
    <div className="litigantdash-hearings-main-section">
      <h2>Search Case Hearings</h2>
      <form onSubmit={handleHearingSearch} className="litigantdash-hearing-search-form-container">
        <div className="litigantdash-form-group-item">
          <label htmlFor="caseNumberInput">Case Number</label>
          <input
            type="text"
            id="caseNumberInput"
            value={searchCaseNum}
            onChange={(e) => setSearchCaseNum(e.target.value)}
            placeholder="Enter Case Number"
            required
          />
        </div>
        <button type="submit" className="litigantdash-search-hearings-button">
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
              <div className="litigantdash-no-hearings-message">No hearings found for this case number.</div>
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
                          ? new Date(hearing.hearing_date).toLocaleDateString()
                          : 'Not specified'}
                      </span>
                    </div>

                    <div className="litigantdash-detail-row-item">
                      <span className="litigantdash-detail-label-text">Hearing Type:</span>
                      <span className="litigantdash-detail-value-text">
                        {hearing.hearing_type || 'Not specified'}
                      </span>
                    </div>

                    {hearing.remarks && (
                      <div className="litigantdash-detail-row-item">
                        <span className="litigantdash-detail-label-text">Remarks:</span>
                        <span className="litigantdash-detail-value-text">{hearing.remarks}</span>
                      </div>
                    )}

                    {hearing.next_hearing_date && (
                      <div className="litigantdash-detail-row-item">
                        <span className="litigantdash-detail-label-text">Next Hearing Date:</span>
                        <span className="litigantdash-detail-value-text">
                          {new Date(hearing.next_hearing_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {hearing.attachments && hearing.attachments.length > 0 && (
                      <div className="litigantdash-attachments-section-container">
                        <h4>Attachments</h4>
                        <ul className="litigantdash-attachment-list-items">
                          {hearing.attachments.map((attachment, i) => (
                            <li key={i} className="litigantdash-attachment-item-box">
                              <div className="litigantdash-attachment-info-details">
                                <span className="litigantdash-attachment-name-text">
                                  {attachment.originalname}
                                </span>
                                <span className="litigantdash-attachment-size-text">
                                  {(attachment.size / 1024).toFixed(2)} KB
                                </span>
                              </div>

                              <button
                                onClick={() => downloadAttachment(attachment.filename, attachment.originalname)}
                                className="litigantdash-download-attachment-button"
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
    <div className="litigantdash-documents-main-section">
      <h2>Case Documents</h2>
      <div className="litigantdash-case-selector-dropdown">
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
        <div className="litigantdash-document-upload-form-container">
          <h3>Upload New Document</h3>
          <form onSubmit={handleDocumentUpload}>
            <div className="litigantdash-form-group-item">
              <label htmlFor="documentTypeSelect">Document Type *</label>
              <select
                id="documentTypeSelect"
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
            <div className="litigantdash-form-group-item">
              <label htmlFor="documentDescriptionTextarea">Description</label>
              <textarea
                id="documentDescriptionTextarea"
                value={documentDescription}
                onChange={(e) => setDocumentDescription(e.target.value)}
                placeholder="Enter document description"
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label htmlFor="litigantdoc-upload-file-input">File *</label>
              <input
                type="file"
                id="litigantdoc-upload-file-input"
                onChange={handleFileChange}
                required
              />
            </div>
            {documentError && <div className="litigantdash-error-alert-message">{documentError}</div>}
            {documentSuccess && <div className="litigantdash-success-alert-message">{documentSuccess}</div>}
            <button type="submit" className="litigantdash-submit-form-button">
              Upload Document
            </button>
          </form>
        </div>
      )}
      {selectedCaseForDocuments && (
        <div className="litigantdash-documents-list-container">
          <h3>Case Documents</h3>
          {documentsLoading ? (
            <div className="litigantdash-loading-spinner">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="litigantdash-no-documents-message">No documents found for this case.</div>
          ) : (
            <table className="litigantdash-documents-table-grid">
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
                        className="litigantdash-download-attachment-button"
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
      case 'dashboard':
        return renderDashboard();
      case 'filecase':
        return renderFileCase();
      case 'hearings':
        return renderHearings();
      case 'documents':
        return renderDocuments();
      case 'noticeboard':
        return <NoticeBoard />;
      case 'calendar':
        return <UserCalendar />;
      case 'videoplead':
        return <UploadVideoPlead />;
      case 'meetings':
        return <LitigantMeeting />;
      case 'caseassign':
        return <LitigantCaseAssign />;
      case 'nyaaysaathi':
        return <NyaaySaathi />;
      default:
        return <div>Select an option from the sidebar</div>;
    }
  };
  if (loading) {
    return (
      <div className="litigantdash-loading-container-fullscreen">
        <div className="litigantdash-loading-spinner">Loading...</div>
      </div>
    );
  }
  return (
    <div className="litigantdash-wrapper-main-container">
      <DashboardHeader />
      {isSidebarOpen && (
        <div
          className="litigantdash-sidebar-overlay-backdrop"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <div className="litigantdash-content-layout-container">
        <aside className={`litigantdash-sidebar-navigation ${isSidebarOpen ? 'litigantdash-sidebar-active' : ''}`}>
          <nav className="litigantdash-nav-menu-list">
            <button
              className={`litigantdash-nav-menu-button ${activeSection === 'dashboard' ? 'litigantdash-nav-active' : ''}`}
              onClick={() => handleNavigation('dashboard')}
            >
              <Database className="litigantdash-nav-icon-svg" />
              Dashboard
            </button>
            <button
              className={`litigantdash-nav-menu-button ${activeSection === 'filecase' ? 'litigantdash-nav-active' : ''}`}
              onClick={() => handleNavigation('filecase')}
            >
              <FileText className="litigantdash-nav-icon-svg" />
              File New Case
            </button>
            <button
              className={`litigantdash-nav-menu-button ${activeSection === 'hearings' ? 'litigantdash-nav-active' : ''}`}
              onClick={() => handleNavigation('hearings')}
            >
              <Calendar className="litigantdash-nav-icon-svg" />
              Hearings
            </button>
            <button
              className={`litigantdash-nav-menu-button ${activeSection === 'documents' ? 'litigantdash-nav-active' : ''}`}
              onClick={() => handleNavigation('documents')}
            >
              <FileText className="litigantdash-nav-icon-svg" />
              Documents
            </button>
            <button
              className={`litigantdash-nav-menu-button ${activeSection === 'noticeboard' ? 'litigantdash-nav-active' : ''}`}
              onClick={() => handleNavigation('noticeboard')}
            >
              <Info className="litigantdash-nav-icon-svg" />
              Notice Board
            </button>
            <button
              className={`litigantdash-nav-menu-button ${activeSection === 'calendar' ? 'litigantdash-nav-active' : ''}`}
              onClick={() => handleNavigation('calendar')}
            >
              <Calendar className="litigantdash-nav-icon-svg" />
              Court Calendar
            </button>
            <button
              className={`litigantdash-nav-menu-button ${activeSection === 'videoplead' ? 'litigantdash-nav-active' : ''}`}
              onClick={() => handleNavigation('videoplead')}
            >
              <Video className="litigantdash-nav-icon-svg" />
              Video Pleading
            </button>
            <button
              className={`litigantdash-nav-menu-button ${activeSection === 'meetings' ? 'litigantdash-nav-active' : ''}`}
              onClick={() => handleNavigation('meetings')}
            >
              <Users className="litigantdash-nav-icon-svg" />
              Scheduled Meetings
            </button>
            <button
              className={`litigantdash-nav-menu-button ${activeSection === 'caseassign' ? 'litigantdash-nav-active' : ''}`}
              onClick={() => handleNavigation('caseassign')}
            >
              <Book className="litigantdash-nav-icon-svg" />
              Find and Attach Advocate
            </button>
            <button
              className={`litigantdash-nav-menu-button ${activeSection === 'nyaaysaathi' ? 'litigantdash-nav-active' : ''}`}
              onClick={() => handleNavigation('nyaaysaathi')}
            >
              <Book className="litigantdash-nav-icon-svg" />
              Nyaay-Saathi
            </button>
          </nav>
        </aside>

        <main className="litigantdash-main-content-area">
          {renderContent()}
          <LegalAssistantChatbot />
        </main>
      </div>

      {isProfileOpen && (
        <div className="litigantdash-profile-modal-overlay">
          <div className="litigantdash-profile-modal-container">
            <button
              className="litigantdash-close-profile-button"
              onClick={() => setIsProfileOpen(false)}
            >
              ×
            </button>
            <div className="litigantdash-profile-content-wrapper">
              <div className="litigantdash-profile-avatar-large">
                {profile?.full_name?.charAt(0).toUpperCase()}
              </div>
              <h2 className="litigantdash-profile-name-heading">{profile?.full_name}</h2>
              <p className="litigantdash-profile-email-text">{profile?.contact?.email}</p>
              <p className="litigantdash-profile-type-text">Party Type: {profile?.party_type}</p>
              <div className="litigantdash-profile-details-grid">
                <div className="litigantdash-profile-detail-item-row">
                  <span className="litigantdash-profile-detail-label">Party ID:</span>
                  <strong className="litigantdash-profile-detail-value">{profile?.party_id}</strong>
                </div>
                <div className="litigantdash-profile-detail-item-row">
                  <span className="litigantdash-profile-detail-label">Status:</span>
                  <strong className="litigantdash-profile-detail-value">{profile?.status}</strong>
                </div>
                <div className="litigantdash-profile-detail-item-row">
                  <span className="litigantdash-profile-detail-label">Guardian Name:</span>
                  <strong className="litigantdash-profile-detail-value">{profile?.parentage}</strong>
                </div>
                <div className="litigantdash-profile-detail-item-row">
                  <span className="litigantdash-profile-detail-label">Contact:</span>
                  <strong className="litigantdash-profile-detail-value">{profile?.contact?.mobile}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="litigantdash-logout-confirm-overlay">
          <div className="litigantdash-logout-confirm-modal">
            <h3 className="litigantdash-logout-confirm-title">Confirm Logout from All Devices</h3>
            <p className="litigantdash-logout-confirm-text">Please enter your password to confirm:</p>
            <input
              type="password"
              value={logoutPassword}
              onChange={(e) => setLogoutPassword(e.target.value)}
              placeholder="Enter your password"
              className="litigantdash-password-input-field"
            />
            <div className="litigantdash-logout-confirm-actions">
              <button onClick={handleLogoutAll} className="litigantdash-confirm-logout-button">
                Confirm Logout
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  setLogoutPassword('');
                }}
                className="litigantdash-cancel-logout-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="litigantdash-error-notification-banner">
          <X className="litigantdash-error-icon-svg" />
          {error}
        </div>
      )}
    </div>
  );
};
export default LitigantDashboard;