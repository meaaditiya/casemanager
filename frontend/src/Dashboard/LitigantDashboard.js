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

const LitigantDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutPassword, setLogoutPassword] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [cases, setCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchCaseNum, setSearchCaseNum] = useState('');
  const [searchedHearings, setSearchedHearings] = useState(null);
  const [hearingsLoading, setHearingsLoading] = useState(false);
  const [hearingsError, setHearingsError] = useState(null);
  const [allHearings, setAllHearings] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedCaseForDocuments, setSelectedCaseForDocuments] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [documentError, setDocumentError] = useState('');
  const [documentSuccess, setDocumentSuccess] = useState('');
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('details');
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
      document.getElementById('document-file').value = '';
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
                // window.close();
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

  const renderDashboard = () => (
    <div className="lit-dashboard-section">
      <section className="lit-stats">
        <div className="lit-stat-card">
          <h3 className="lit-stat-title">Active Cases</h3>
          <p className="lit-stat-value">{cases.filter((c) => c.status === 'active').length}</p>
        </div>
        <div className="lit-stat-card">
          <h3 className="lit-stat-title">Upcoming Hearings</h3>
          <p className="lit-stat-value">0</p>
        </div>
        <div className="lit-stat-card">
          <h3 className="lit-stat-title">Pending Documents</h3>
          <p className="lit-stat-value">0</p>
        </div>
      </section>
      <section className="lit-cases-section">
        <h2>Your Cases</h2>
        {loading ? (
          <div className="lit-loading">Loading cases...</div>
        ) : error ? (
          <div className="lit-error-message">{error}</div>
        ) : cases.length === 0 ? (
          <div className="lit-no-cases">No cases found. File a new case to get started.</div>
        ) : (
          <div className="lit-cases-grid">
            {cases.map((legalCase) => (
              <div key={legalCase._id} className="lit-case-card">
                <div className="lit-case-header">
                  <h3>{legalCase.case_num}</h3>
                  <span className={`lit-status ${legalCase.status}`}>{legalCase.status}</span>
                </div>
                <div className="lit-case-details">
                  <p><strong>Type:</strong> {legalCase.case_type}</p>
                  <p><strong>Court:</strong> {legalCase.court}</p>
                  <p><strong>Filed:</strong> {new Date(legalCase.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="lit-case-actions">
                  <button
                    className="lit-view-details"
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
            className="lit-case-details-overlay"
            onClick={(e) => {
              if (e.target.className === 'lit-case-details-overlay') {
                setIsDetailsOpen(false);
              }
            }}
          >
            <div className="lit-case-details-modal">
              <div className="lit-modal-header">
                <div className="lit-header-left">
                  <h2>Case: {selectedCase.case_num}</h2>
                </div>
                <div className="lit-details-tabs">
                  <button
                    className={viewMode === 'details' ? 'lit-active-tab' : ''}
                    onClick={() => setViewMode('details')}
                  >
                    Case Details
                  </button>
                  <button
                    className={viewMode === 'receipt' ? 'lit-active-tab' : ''}
                    onClick={() => setViewMode('receipt')}
                  >
                    Case Filing Receipt
                  </button>
                </div>
                <div className="lit-header-right">
                  <button className="lit-print-button" onClick={printReceipt}>
                    Print Receipt
                  </button>
                  <button className="lit-close-modal" onClick={() => setIsDetailsOpen(false)}>
                    ×
                  </button>
                </div>
              </div>
              <div className="lit-modal-content-container">
                <div
                  className="lit-modal-content"
                  style={{ display: viewMode === 'details' ? 'block' : 'none' }}
                >
                  <div className="lit-case-details-content">
                    <div className="lit-case-status-banner">
                      <div className="lit-status-wrapper">
                        <span className={`lit-status-badge ${selectedCase.status?.toLowerCase()}`}>
                          {selectedCase.status || 'Pending'}
                        </span>
                        <span className="lit-filing-date">
                          Filed: {selectedCase.createdAt && new Date(selectedCase.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="lit-case-details-grid">
                      <div className="lit-detail-group">
                        <h3>Basic Information</h3>
                        <div className="lit-detail-item">
                          <span className="lit-detail-label">Case Type:</span>
                          <span className="lit-detail-value">{selectedCase.case_type}</span>
                        </div>
                        <div className="lit-detail-item">
                          <span className="lit-detail-label">Court:</span>
                          <span className="lit-detail-value">{selectedCase.court}</span>
                        </div>
                        <div className="lit-detail-item">
                          <span className="lit-detail-label">Filed Date:</span>
                          <span className="lit-detail-value">
                            {selectedCase.createdAt && new Date(selectedCase.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="lit-detail-group">
                        <h3>Plaintiff Details</h3>
                        <div className="lit-detail-item">
                          <span className="lit-detail-label">Name:</span>
                          <span className="lit-detail-value">{selectedCase.plaintiff_details?.name}</span>
                        </div>
                        <div className="lit-detail-item">
                          <span className="lit-detail-label">Contact:</span>
                          <span className="lit-detail-value">{selectedCase.plaintiff_details?.mobile}</span>
                        </div>
                        <div className="lit-detail-item">
                          <span className="lit-detail-label">Address:</span>
                          <span className="lit-detail-value">{selectedCase.plaintiff_details?.address}</span>
                        </div>
                      </div>
                      <div className="lit-detail-group">
                        <h3>Respondent Details</h3>
                        <div className="lit-detail-item">
                          <span className="lit-detail-label">Name:</span>
                          <span className="lit-detail-value">{selectedCase.respondent_details?.name}</span>
                        </div>
                        <div className="lit-detail-item">
                          <span className="lit-detail-label">Contact:</span>
                          <span className="lit-detail-value">{selectedCase.respondent_details?.mobile}</span>
                        </div>
                        <div className="lit-detail-item">
                          <span className="lit-detail-label">Address:</span>
                          <span className="lit-detail-value">{selectedCase.respondent_details?.address}</span>
                        </div>
                      </div>
                      {selectedCase.police_station_details && (
                        <div className="lit-detail-group">
                          <h3>Police Station Details</h3>
                          <div className="lit-detail-item">
                            <span className="lit-detail-label">Station:</span>
                            <span className="lit-detail-value">{selectedCase.police_station_details.police_station}</span>
                          </div>
                          <div className="lit-detail-item">
                            <span className="lit-detail-label">FIR Number:</span>
                            <span className="lit-detail-value">{selectedCase.police_station_details.fir_no}</span>
                          </div>
                          <div className="lit-detail-item">
                            <span className="lit-detail-label">FIR Year:</span>
                            <span className="lit-detail-value">{selectedCase.police_station_details.fir_year}</span>
                          </div>
                        </div>
                      )}
                      <div className="lit-detail-group">
                        <h3>Lower Court Details</h3>
                        <div className="lit-detail-item">
                          <span className="lit-detail-label">Court Name:</span>
                          <span className="lit-detail-value">{selectedCase.lower_court_details?.court_name}</span>
                        </div>
                        <div className="lit-detail-item">
                          <span className="lit-detail-label">Case Number:</span>
                          <span className="lit-detail-value">{selectedCase.case_num}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="lit-modal-content"
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
    <div className="lit-file-case-section">
      <h2>File New Case</h2>
      <form onSubmit={handleFormSubmit} className="lit-case-filing-form">
        <div className="lit-form-section">
          <h3>Basic Case Information</h3>
          <div className="lit-form-row">
            <div className="lit-form-group">
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
            <div className="lit-form-group">
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
        <div className="lit-form-section">
          <h3>Plaintiff Details</h3>
          <div className="lit-form-grid">
            <div className="lit-form-group">
              <label>Name</label>
              <input
                type="text"
                value={formData.plaintiff_details.name}
                onChange={(e) => handleNestedChange('plaintiff_details', 'name', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
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
            <div className="lit-form-group">
              <label>Address</label>
              <input
                type="text"
                value={formData.plaintiff_details.address}
                onChange={(e) => handleNestedChange('plaintiff_details', 'address', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
              <label>PIN Code</label>
              <input
                type="text"
                value={formData.plaintiff_details.pin}
                onChange={(e) => handleNestedChange('plaintiff_details', 'pin', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
              <label>Sex</label>
              <select
                value={formData.plaintiff_details.sex}
                onChange={(e) => handleNestedChange('plaintiff_details', 'sex', e.target.value)}
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="lit-form-group">
              <label>Age</label>
              <input
                type="number"
                value={formData.plaintiff_details.age}
                onChange={(e) => handleNestedChange('plaintiff_details', 'age', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
              <label>Caste</label>
              <input
                type="text"
                value={formData.plaintiff_details.caste}
                onChange={(e) => handleNestedChange('plaintiff_details', 'caste', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
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
              <div className="lit-form-group">
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
            <div className="lit-form-group">
              <label>Occupation</label>
              <input
                type="text"
                value={formData.plaintiff_details.occupation}
                onChange={(e) => handleNestedChange('plaintiff_details', 'occupation', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.plaintiff_details.email}
                onChange={(e) => handleNestedChange('plaintiff_details', 'email', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
              <label>Phone</label>
              <input
                type="text"
                value={formData.plaintiff_details.phone}
                onChange={(e) => handleNestedChange('plaintiff_details', 'phone', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
              <label>Mobile</label>
              <input
                type="text"
                value={formData.plaintiff_details.mobile}
                onChange={(e) => handleNestedChange('plaintiff_details', 'mobile', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
              <label>Fax</label>
              <input
                type="text"
                value={formData.plaintiff_details.fax}
                onChange={(e) => handleNestedChange('plaintiff_details', 'fax', e.target.value)}
              />
            </div>
            <div className="lit-form-group">
              <label>Subject</label>
              <input
                type="text"
                value={formData.plaintiff_details.subject}
                onChange={(e) => handleNestedChange('plaintiff_details', 'subject', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
              <label>Advocate ID</label>
              <input
                type="text"
                value={formData.plaintiff_details.advocate_id}
                onChange={(e) => handleNestedChange('plaintiff_details', 'advocate_id', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
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
        <div className="lit-form-section">
          <h3>Respondent Details</h3>
          <div className="lit-form-grid">
            <div className="lit-form-group">
              <label>Party ID</label>
              <input
                type="text"
                value={formData.respondent_details.party_id}
                onChange={(e) => handleNestedChange('respondent_details', 'party_id', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
              <label>Name</label>
              <input
                type="text"
                value={formData.respondent_details.name}
                onChange={(e) => handleNestedChange('respondent_details', 'name', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
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
            <div className="lit-form-group">
              <label>Address</label>
              <input
                type="text"
                value={formData.respondent_details.address}
                onChange={(e) => handleNestedChange('respondent_details', 'address', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
              <label>PIN Code</label>
              <input
                type="text"
                value={formData.respondent_details.pin}
                onChange={(e) => handleNestedChange('respondent_details', 'pin', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
              <label>Sex</label>
              <select
                value={formData.respondent_details.sex}
                onChange={(e) => handleNestedChange('respondent_details', 'sex', e.target.value)}
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="lit-form-group">
              <label>Age</label>
              <input
                type="number"
                value={formData.respondent_details.age}
                onChange={(e) => handleNestedChange('respondent_details', 'age', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
              <label>Caste</label>
              <input
                type="text"
                value={formData.respondent_details.caste}
                onChange={(e) => handleNestedChange('respondent_details', 'caste', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
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
              <div className="lit-form-group">
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
            <div className="lit-form-group">
              <label>Occupation</label>
              <input
                type="text"
                value={formData.respondent_details.occupation}
                onChange={(e) => handleNestedChange('respondent_details', 'occupation', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.respondent_details.email}
                onChange={(e) => handleNestedChange('respondent_details', 'email', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
              <label>Phone</label>
              <input
                type="text"
                value={formData.respondent_details.phone}
                onChange={(e) => handleNestedChange('respondent_details', 'phone', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
              <label>Mobile</label>
              <input
                type="text"
                value={formData.respondent_details.mobile}
                onChange={(e) => handleNestedChange('respondent_details', 'mobile', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
              <label>Fax</label>
              <input
                type="text"
                value={formData.respondent_details.fax}
                onChange={(e) => handleNestedChange('respondent_details', 'fax', e.target.value)}
              />
            </div>
            <div className="lit-form-group">
              <label>Subject</label>
              <input
                type="text"
                value={formData.respondent_details.subject}
                onChange={(e) => handleNestedChange('respondent_details', 'subject', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
              <label>Advocate ID</label>
              <input
                type="text"
                value={formData.respondent_details.advocate_id}
                onChange={(e) => handleNestedChange('respondent_details', 'advocate_id', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
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
          <div className="lit-form-section">
            <h3>Police Station Details</h3>
            <div className="lit-form-grid">
              <div className="lit-form-group">
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
              <div className="lit-form-group">
                <label>FIR Number</label>
                <input
                  type="text"
                  value={formData.police_station_details.fir_no}
                  onChange={(e) => handleNestedChange('police_station_details', 'fir_no', e.target.value)}
                  required
                />
              </div>
              <div className="lit-form-group">
                <label>FIR Year</label>
                <input
                  type="number"
                  value={formData.police_station_details.fir_year}
                  onChange={(e) => handleNestedChange('police_station_details', 'fir_year', e.target.value)}
                  required
                />
              </div>
              <div className="lit-form-group">
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
        <div className="lit-form-section">
          <h3>Lower Court Details</h3>
          <div className="lit-form-grid">
            <div className="lit-form-group">
              <label>Court Name</label>
              <input
                type="text"
                value={formData.lower_court_details.court_name}
                onChange={(e) => handleNestedChange('lower_court_details', 'court_name', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
              <label>Case Number</label>
              <input
                type="text"
                value={formData.lower_court_details.case_no}
                onChange={(e) => handleNestedChange('lower_court_details', 'case_no', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
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
        <div className="lit-form-section">
          <h3>Main Matter Details</h3>
          <div className="lit-form-grid">
            <div className="lit-form-group">
              <label>Case Type</label>
              <input
                type="text"
                value={formData.main_matter_details.case_type}
                onChange={(e) => handleNestedChange('main_matter_details', 'case_type', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
              <label>Case Number</label>
              <input
                type="text"
                value={formData.main_matter_details.case_no}
                onChange={(e) => handleNestedChange('main_matter_details', 'case_no', e.target.value)}
                required
              />
            </div>
            <div className="lit-form-group">
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
        {formError && <div className="lit-error-message">{formError}</div>}
        {formSuccess && <div className="lit-success-message">{formSuccess}</div>}
        <div className="lit-form-actions">
          <button type="submit" className="lit-submit-button">
            File Case
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('dashboard')}
            className="lit-cancel-button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  const renderHearings = () => (
    <div className="lit-hearings-section">
      <h2>Search Case Hearings</h2>
      <form onSubmit={handleHearingSearch} className="lit-hearing-search-form">
        <div className="lit-form-group">
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
        <button type="submit" className="lit-search-button">
          Search Hearings
        </button>
      </form>
      {hearingsError && <div className="lit-error-message">{hearingsError}</div>}
      {hearingsLoading ? (
        <div className="lit-loading">Loading hearings...</div>
      ) : (
        searchedHearings && (
          <div className="lit-hearings-list">
            {searchedHearings.length === 0 ? (
              <div className="lit-no-hearings">No hearings found for this case number.</div>
            ) : (
              searchedHearings.map((hearing, index) => (
                <div key={index} className="lit-hearing-card">
                  <div className="lit-hearing-header">
                    <h3>Hearing #{index + 1}</h3>
                    <span className={`lit-status ${hearing.hearing_type?.toLowerCase()}`}>
                      {hearing.hearing_type}
                    </span>
                  </div>
                  <div className="lit-hearing-details">
                    <div className="lit-detail-row">
                      <span className="lit-label">Hearing Date:</span>
                      <span className="lit-value">
                        {hearing.hearing_date
                          ? new Date(hearing.hearing_date).toLocaleDateString()
                          : 'Not specified'}
                      </span>
                    </div>
                    <div className="lit-detail-row">
                      <span className="lit-label">Hearing Type:</span>
                      <span className="lit-value">{hearing.hearing_type || 'Not specified'}</span>
                    </div>
                    {hearing.remarks && (
                      <div className="lit-detail-row">
                        <span className="lit-label">Remarks:</span>
                        <span className="lit-value">{hearing.remarks}</span>
                      </div>
                    )}
                    {hearing.next_hearing_date && (
                      <div className="lit-detail-row">
                        <span className="lit-label">Next Hearing Date:</span>
                        <span className="lit-value">
                          {new Date(hearing.next_hearing_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {hearing.attachments && hearing.attachments.length > 0 && (
                      <div className="lit-attachments-section">
                        <h4>Attachments</h4>
                        <ul className="lit-attachment-list">
                          {hearing.attachments.map((attachment, i) => (
                            <li key={i} className="lit-attachment-item">
                              <div className="lit-attachment-info">
                                <span className="lit-attachment-name">{attachment.originalname}</span>
                                <span className="lit-attachment-size">
                                  {(attachment.size / 1024).toFixed(2)} KB
                                </span>
                              </div>
                              <button
                                onClick={() => downloadAttachment(attachment.filename, attachment.originalname)}
                                className="lit-download-button"
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
    <div className="lit-documents-section">
      <h2>Case Documents</h2>
      <div className="lit-case-selector">
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
        <div className="lit-document-upload-form">
          <h3>Upload New Document</h3>
          <form onSubmit={handleDocumentUpload}>
            <div className="lit-form-group">
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
            <div className="lit-form-group">
              <label htmlFor="document-description">Description</label>
              <textarea
                id="document-description"
                value={documentDescription}
                onChange={(e) => setDocumentDescription(e.target.value)}
                placeholder="Enter document description"
              />
            </div>
            <div className="lit-form-group">
              <label htmlFor="document-file">File *</label>
              <input
                type="file"
                id="document-file"
                onChange={handleFileChange}
                required
              />
            </div>
            {documentError && <div className="lit-error-message">{documentError}</div>}
            {documentSuccess && <div className="lit-success-message">{documentSuccess}</div>}
            <button type="submit" className="lit-submit-button">
              Upload Document
            </button>
          </form>
        </div>
      )}
      {selectedCaseForDocuments && (
        <div className="lit-documents-list">
          <h3>Case Documents</h3>
          {documentsLoading ? (
            <div className="lit-loading">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="lit-no-documents">No documents found for this case.</div>
          ) : (
            <table className="lit-documents-table">
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
                        className="lit-download-button"
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
      default:
        return <div>Select an option from the sidebar</div>;
    }
  };

  if (loading) {
    return (
      <div className="lit-loading-container">
        <div className="lit-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="lit-dashboard">
    <header className="lit-header">
      <div className="lit-header-left">
        <button className="lit-sidebar-toggle" onClick={toggleSidebar}>
          ☰
        </button>
        <div className="lit-emblem-logo">
          <img src={emblem} alt="Emblem" />
        </div>
        <div className="lit-justice-logo">
          <img src={logo} alt="Logo" />
        </div>
        <h1 className="lit-title">Litigant Dashboard</h1>
      </div>
      <div className="lit-header-right">
        <div className="lit-logout-buttons">
          <button className="lit-logout-btn" onClick={handleLogout}>
            <LogOut className="lit-logout-icon" />
            Logout
          </button>
          <button className="lit-logout-all-btn"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <LogOut className="lit-logout-icon" />
            Logout All Devices
          </button>
        </div>
        <div
          className="lit-profile-toggle"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
        >
          <div className="lit-avatar">
            {profile?.full_name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>

    {isSidebarOpen && (
      <div
        className="lit-sidebar-overlay"
        onClick={() => setIsSidebarOpen(false)}
      ></div>
    )}

    <div className="lit-content">
      <aside className={`lit-sidebar ${isSidebarOpen ? 'active' : ''}`}>
        <nav className="lit-nav">
          <button
            className={`lit-nav-btn ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavigation('dashboard')}
          >
            <Database className="lit-nav-icon" />
            Dashboard
          </button>
          <button
            className={`lit-nav-btn ${activeSection === 'filecase' ? 'active' : ''}`}
            onClick={() => handleNavigation('filecase')}
          >
            <FileText className="lit-nav-icon" />
            File New Case
          </button>
          <button
            className={`lit-nav-btn ${activeSection === 'hearings' ? 'active' : ''}`}
            onClick={() => handleNavigation('hearings')}
          >
            <Calendar className="lit-nav-icon" />
            Hearings
          </button>
          <button
            className={`lit-nav-btn ${activeSection === 'documents' ? 'active' : ''}`}
            onClick={() => handleNavigation('documents')}
          >
            <FileText className="lit-nav-icon" />
            Documents
          </button>
          <button
            className={`lit-nav-btn ${activeSection === 'noticeboard' ? 'active' : ''}`}
            onClick={() => handleNavigation('noticeboard')}
          >
            <Info className="lit-nav-icon" />
            Notice Board
          </button>
          <button
            className={`lit-nav-btn ${activeSection === 'calendar' ? 'active' : ''}`}
            onClick={() => handleNavigation('calendar')}
          >
            <Calendar className="lit-nav-icon" />
            Court Calendar
          </button>
          <button
            className={`lit-nav-btn ${activeSection === 'videoplead' ? 'active' : ''}`}
            onClick={() => handleNavigation('videoplead')}
          >
            <Video className="lit-nav-icon" />
            Video Pleading Submission
          </button>
          <button
            className={`lit-nav-btn ${activeSection === 'meetings' ? 'active' : ''}`}
            onClick={() => handleNavigation('meetings')}
          >
            <Users className="lit-nav-icon" />
            Scheduled Meetings
          </button>
          <button
            className={`lit-nav-btn ${activeSection === 'caseassign' ? 'active' : ''}`}
            onClick={() => handleNavigation('caseassign')}
          >
            <Book className="lit-nav-icon" />
            Find and Attach Advocate
          </button>
        </nav>
      </aside>

      <main className="lit-main">
        {renderContent()}
        <LegalAssistantChatbot />
      </main>
    </div>

    {isProfileOpen && (
      <div className="lit-profile-overlay">
        <div className="lit-profile-modal">
          <button
            className="lit-close-profile"
            onClick={() => setIsProfileOpen(false)}
          >
            ×
          </button>
          <div className="lit-profile-content">
            <div className="lit-profile-avatar">
              {profile?.full_name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="lit-profile-name">{profile?.full_name}</h2>
            <p className="lit-profile-email">{profile?.contact?.email}</p>
            <p className="lit-profile-type">Party Type: {profile?.party_type}</p>
            <div className="lit-profile-details">
              <div className="lit-profile-detail-item">
                <span className="lit-profile-detail-label">Party ID:</span>
                <strong className="lit-profile-detail-value">{profile?.party_id}</strong>
              </div>
              <div className="lit-profile-detail-item">
                <span className="lit-profile-detail-label">Status:</span>
                <strong className="lit-profile-detail-value">{profile?.status}</strong>
              </div>
              <div className="lit-profile-detail-item">
                <span className="lit-profile-detail-label">Guardian Name:</span>
                <strong className="lit-profile-detail-value">{profile?.parentage}</strong>
              </div>
              <div className="lit-profile-detail-item">
                <span className="lit-profile-detail-label">Contact:</span>
                <strong className="lit-profile-detail-value">{profile?.contact?.mobile}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {showLogoutConfirm && (
      <div className="lit-logout-overlay">
        <div className="lit-logout-modal">
          <h3 className="lit-logout-title">Confirm Logout from All Devices</h3>
          <p className="lit-logout-text">Please enter your password to confirm:</p>
          <input
            type="password"
            value={logoutPassword}
            onChange={(e) => setLogoutPassword(e.target.value)}
            placeholder="Enter your password"
            className="lit-password-input"
          />
          <div className="lit-logout-actions">
            <button onClick={handleLogoutAll} className="lit-confirm-btn">
              Confirm Logout
            </button>
            <button
              onClick={() => {
                setShowLogoutConfirm(false);
                setLogoutPassword('');
              }}
              className="lit-cancel-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}

    {error && (
      <div className="lit-error-message">
        <X className="lit-error-icon" />
        {error}
      </div>
    )}
  </div>
    
  );
};

export default LitigantDashboard;