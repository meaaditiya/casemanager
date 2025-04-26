import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate ,Link} from 'react-router-dom';
import '../ComponentsCSS/LitigantDashboardStyles.css';
import emblem from '../images/aadiimage4.svg'
import stamp from '../images/aadiimage8.png'
import LegalAssistantChatbot from '../Components/LegalAssistantChatbot';
import NavigationBar from '../Components/NavigationBar';
import logo from "../images/aadiimage4.png";
const LitigantDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutPassword, setLogoutPassword] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [hearings, setHearings] = useState([]);
const [hearingsLoading, setHearingsLoading] = useState(false);
const [hearingsError, setHearingsError] = useState(null);
const [allHearings, setAllHearings] = useState([]);
const [searchCaseNum, setSearchCaseNum] = useState('');
const [searchedHearings, setSearchedHearings] = useState(null);
const [documents, setDocuments] = useState([]);
const [selectedCaseForDocuments, setSelectedCaseForDocuments] = useState(null);
const [documentFile, setDocumentFile] = useState(null);
const [documentType, setDocumentType] = useState('');
const [documentDescription, setDocumentDescription] = useState('');
const [documentError, setDocumentError] = useState('');
const [documentSuccess, setDocumentSuccess] = useState('');
const [documentsLoading, setDocumentsLoading] = useState(false);
const [viewMode, setViewMode] = useState('details');
const [openCaseId, setOpenCaseId] = useState(null);
const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

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
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);
  useEffect(() => {
    const fetchCases = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                'http://localhost:5000/api/cases/litigant',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setCases(response.data.cases);
        } catch (error) {
            console.error('Error fetching cases:', error);
            setError(error.response?.data?.message || 'Failed to fetch cases');
        }
    };

    if (activeSection === 'dashboard') {
        fetchCases();
    }
}, [activeSection]); // Refetch when section changes
useEffect(() => {
  const fetchAllHearings = async () => {
    setHearingsLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Fetch hearings for all cases
      const hearingPromises = cases.map(legalCase =>
        axios.get(
          `http://localhost:5000/api/case/${legalCase.case_num}/hearings`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
      
      const responses = await Promise.all(hearingPromises);
      const allHearingsData = responses.reduce((acc, response, index) => {
        const caseHearings = response.data.hearings.map(hearing => ({
          ...hearing,
          case_num: cases[index].case_num,
          case_type: cases[index].case_type
        }));
        return [...acc, ...caseHearings];
      }, []);
      
      // Sort hearings by date
      const sortedHearings = allHearingsData.sort((a, b) =>
        new Date(b.hearing_date) - new Date(a.hearing_date)
      );
      
      setAllHearings(sortedHearings);
      setHearingsError(null);
    } catch (error) {
      setHearingsError(error.response?.data?.message || 'Failed to fetch hearings');
    } finally {
      setHearingsLoading(false);
    }
  };
  
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

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
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
      if (err.response?.status === 401) navigate('/login');
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/litigant/logout',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      localStorage.removeItem('token');
      setShowLogoutConfirm(false);
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Logout from all devices failed');
    }
  };

  const handleTopLevelChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Reset police details when switching to Civil
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

      // Remove police_station_details for civil cases
      if (formData.case_type === 'Civil') {
        delete dataToSubmit.police_station_details;
      }

      // Log the JSON data being sent
      console.log('Submitting Case Data:', JSON.stringify(dataToSubmit, null, 2));

      const response = await axios.post(
        'http://localhost:5000/api/filecase/litigant',
        dataToSubmit,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setFormSuccess(`Case filed successfully! Case Number: ${response.data.case_num}`);
      setFormData(initialFormState);
      setActiveSection('dashboard');
    } catch (error) {
      setFormError(error.response?.data?.message || 'Failed to file case');
    }
  };
  const downloadAttachment = async (filename, originalname) => {
    try {
      const token = localStorage.getItem('token');
      
      // Make request with authentication token
      const response = await axios.get(
        `http://localhost:5000/api/files/${filename}`, 
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob' // Important for file downloads
        }
      );
      
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalname); // Use original filename
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download the file');
    }
  };
 
const fetchDocuments = async (caseNum) => {
  setDocumentsLoading(true);
  try {
    const token = localStorage.getItem('token');
    // Use the litigant cases endpoint to get all cases
    const response = await axios.get(
      'http://localhost:5000/api/cases/litigant',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Find the specific case from the cases array
    const caseData = response.data.cases.find(c => c.case_num === caseNum);
    
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
    
    const response = await axios.post(
      `http://localhost:5000/api/case/${selectedCaseForDocuments.case_num}/document`,
      formData,
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    setDocumentSuccess('Document uploaded successfully');
    
    // Refresh the documents list
    fetchDocuments(selectedCaseForDocuments.case_num);
    
    // Reset form
    setDocumentFile(null);
    setDocumentType('');
    setDocumentDescription('');
    
    // Reset the file input
    const fileInput = document.getElementById('document-file');
    if (fileInput) fileInput.value = '';
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
        responseType: 'blob' // Important for file downloads
      }
    );
    
    // Create a blob URL and trigger download
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

// Make sure to have this function to fetch all cases
const fetchCases = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      'http://localhost:5000/api/cases/litigant',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setCases(response.data.cases || []);
  } catch (error) {
    console.error('Failed to fetch cases:', error);
  }
};
useEffect(() => {
  fetchCases();
}, []);
  const renderDocuments = () => (
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
  const renderHearings = () => (
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
  const renderCaseForm = () => (
    <form onSubmit={handleFormSubmit} className="case-filing-form">
      <div className="form-section">
        <h3>Basic Case Information</h3>
        <div className="form-row">
          <div className="form-group">
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
          <div className="form-group">
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

      <div className="form-section">
        <h3>Plaintiff Details</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.plaintiff_details.name}
              onChange={(e) => handleNestedChange('plaintiff_details', 'name', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
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
          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              value={formData.plaintiff_details.address}
              onChange={(e) => handleNestedChange('plaintiff_details', 'address', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>PIN Code</label>
            <input
              type="text"
              value={formData.plaintiff_details.pin}
              onChange={(e) => handleNestedChange('plaintiff_details', 'pin', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
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
          <div className="form-group">
            <label>Age</label>
            <input
              type="number"
              value={formData.plaintiff_details.age}
              onChange={(e) => handleNestedChange('plaintiff_details', 'age', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Caste</label>
            <input
              type="text"
              value={formData.plaintiff_details.caste}
              onChange={(e) => handleNestedChange('plaintiff_details', 'caste', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Nationality</label>
            <select
              value={formData.plaintiff_details.nationality}
              onChange={(e) =>
                handleNestedChange('plaintiff_details', 'nationality', e.target.value)
              }
              required
            >
              <option value="Indian">Indian</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {formData.plaintiff_details.nationality === 'Other' && (
            <div className="form-group">
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
          <div className="form-group">
            <label>Occupation</label>
            <input
              type="text"
              value={formData.plaintiff_details.occupation}
              onChange={(e) =>
                handleNestedChange('plaintiff_details', 'occupation', e.target.value)
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.plaintiff_details.email}
              onChange={(e) => handleNestedChange('plaintiff_details', 'email', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="text"
              value={formData.plaintiff_details.phone}
              onChange={(e) => handleNestedChange('plaintiff_details', 'phone', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Mobile</label>
            <input
              type="text"
              value={formData.plaintiff_details.mobile}
              onChange={(e) => handleNestedChange('plaintiff_details', 'mobile', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Fax</label>
            <input
              type="text"
              value={formData.plaintiff_details.fax}
              onChange={(e) => handleNestedChange('plaintiff_details', 'fax', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Subject</label>
            <input
              type="text"
              value={formData.plaintiff_details.subject}
              onChange={(e) => handleNestedChange('plaintiff_details', 'subject', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Advocate ID</label>
            <input
              type="text"
              value={formData.plaintiff_details.advocate_id}
              onChange={(e) =>
                handleNestedChange('plaintiff_details', 'advocate_id', e.target.value)
              }
              required
            />
          </div>
          <div className="form-group">
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

      <div className="form-section">
        <h3>Respondent Details</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Party ID</label>
            <input
              type="text"
              value={formData.respondent_details.party_id}
              onChange={(e) => handleNestedChange('respondent_details', 'party_id', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.respondent_details.name}
              onChange={(e) => handleNestedChange('respondent_details', 'name', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
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
          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              value={formData.respondent_details.address}
              onChange={(e) => handleNestedChange('respondent_details', 'address', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>PIN Code</label>
            <input
              type="text"
              value={formData.respondent_details.pin}
              onChange={(e) => handleNestedChange('respondent_details', 'pin', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
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
          <div className="form-group">
            <label>Age</label>
            <input
              type="number"
              value={formData.respondent_details.age}
              onChange={(e) => handleNestedChange('respondent_details', 'age', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Caste</label>
            <input
              type="text"
              value={formData.respondent_details.caste}
              onChange={(e) => handleNestedChange('respondent_details', 'caste', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Nationality</label>
            <select
              value={formData.respondent_details.nationality}
              onChange={(e) =>
                handleNestedChange('respondent_details', 'nationality', e.target.value)
              }
              required
            >
              <option value="Indian">Indian</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {formData.respondent_details.nationality === 'Other' && (
            <div className="form-group">
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
          <div className="form-group">
            <label>Occupation</label>
            <input
              type="text"
              value={formData.respondent_details.occupation}
              onChange={(e) =>
                handleNestedChange('respondent_details', 'occupation', e.target.value)
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.respondent_details.email}
              onChange={(e) => handleNestedChange('respondent_details', 'email', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="text"
              value={formData.respondent_details.phone}
              onChange={(e) => handleNestedChange('respondent_details', 'phone', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Mobile</label>
            <input
              type="text"
              value={formData.respondent_details.mobile}
              onChange={(e) => handleNestedChange('respondent_details', 'mobile', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Fax</label>
            <input
              type="text"
              value={formData.respondent_details.fax}
              onChange={(e) => handleNestedChange('respondent_details', 'fax', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Subject</label>
            <input
              type="text"
              value={formData.respondent_details.subject}
              onChange={(e) => handleNestedChange('respondent_details', 'subject', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Advocate ID</label>
            <input
              type="text"
              value={formData.respondent_details.advocate_id}
              onChange={(e) =>
                handleNestedChange('respondent_details', 'advocate_id', e.target.value)
              }
              required
            />
          </div>
          <div className="form-group">
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

      {/* Police Station Details (Only for Criminal Cases) */}
      {formData.case_type === 'Criminal' && (
        <div className="form-section">
          <h3>Police Station Details</h3>
          <div className="form-grid">
            <div className="form-group">
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
            <div className="form-group">
              <label>FIR Number</label>
              <input
                type="text"
                value={formData.police_station_details.fir_no}
                onChange={(e) =>
                  handleNestedChange('police_station_details', 'fir_no', e.target.value)
                }
                required
              />
            </div>
            <div className="form-group">
              <label>FIR Year</label>
              <input
                type="number"
                value={formData.police_station_details.fir_year}
                onChange={(e) =>
                  handleNestedChange('police_station_details', 'fir_year', e.target.value)
                }
                required
              />
            </div>
            <div className="form-group">
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

      {/* Lower Court Details */}
      <div className="form-section">
        <h3>Lower Court Details</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Court Name</label>
            <input
              type="text"
              value={formData.lower_court_details.court_name}
              onChange={(e) =>
                handleNestedChange('lower_court_details', 'court_name', e.target.value)
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Case Number</label>
            <input
              type="text"
              value={formData.lower_court_details.case_no}
              onChange={(e) =>
                handleNestedChange('lower_court_details', 'case_no', e.target.value)
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Decision Date</label>
            <input
              type="date"
              value={formData.lower_court_details.decision_date}
              onChange={(e) =>
                handleNestedChange('lower_court_details', 'decision_date', e.target.value)
              }
              required
            />
          </div>
        </div>
      </div>

      {/* Main Matter Details */}
      <div className="form-section">
        <h3>Main Matter Details</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Case Type</label>
            <input
              type="text"
              value={formData.main_matter_details.case_type}
              onChange={(e) =>
                handleNestedChange('main_matter_details', 'case_type', e.target.value)
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Case Number</label>
            <input
              type="text"
              value={formData.main_matter_details.case_no}
              onChange={(e) =>
                handleNestedChange('main_matter_details', 'case_no', e.target.value)
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Year</label>
            <input
              type="number"
              value={formData.main_matter_details.year}
              onChange={(e) =>
                handleNestedChange('main_matter_details', 'year', e.target.value)
              }
              required
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      {formError && <div className="error-message">{formError}</div>}
      {formSuccess && <div className="success-message">{formSuccess}</div>}

      <div className="form-actions">
        <button type="submit" className="submit-button">
          File Case
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('dashboard')}
          className="cancel-button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
  // Loading and Error States
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
      </div>
    );
  }
// Function to print only the receipt
const printReceipt = () => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  // Get the receipt content
  const receiptContent = document.querySelector('.case-filing-receipt');
  
  if (!receiptContent) {
    alert('Receipt content not found');
    printWindow.close();
    return;
  }
  
  // Create HTML for the print window
  const printDocument = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Case Filing Receipt</title>
        <style>
          /* Reset and base styles */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Times New Roman', Times, serif;
            background-color: white;
            color: #222;
            padding: 20px;
          }
          
          /* Copy of our receipt styles to ensure consistent appearance */
          .case-filing-receipt {
            font-family: 'Times New Roman', Times, serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 50px;
            background-color: #fff;
            color: #222;
            border: 1px solid #999;
            position: relative;
            line-height: 1.5;
          }
          
          .case-filing-receipt::before {
            content: "";
            position: absolute;
            top: 5px;
            left: 5px;
            right: 5px;
            bottom: 5px;
            border: 2px double #8b0000;
            pointer-events: none;
          }
          
          /* Header Styles */
          .receipt-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #8b0000;
            padding-bottom: 20px;
          }
          
          .receipt-logo {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 15px;
          }
          
          .govt-emblem {
            width: 80px;
            height: 80px;
            margin-right: 20px;
          }
          
          .govt-emblem img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          
          .receipt-title {
            text-align: center;
          }
          
          .receipt-title h2 {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
            color: #8b0000;
          }
          
          .receipt-title h3 {
            font-size: 20px;
            margin: 5px 0;
            font-weight: bold;
          }
          
          .receipt-title p {
            font-size: 16px;
            margin: 5px 0;
          }
          
          .receipt-heading {
            font-size: 22px;
            font-weight: bold;
            margin: 20px 0 15px;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 1px;
            position: relative;
          }
          
          .receipt-heading::after {
            content: "";
            display: block;
            width: 200px;
            height: 2px;
            background-color: #8b0000;
            margin: 10px auto;
          }
          
          .receipt-number {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
            font-size: 15px;
          }
          
          .receipt-number p {
            margin: 5px 0;
          }
          
          /* Content Styles */
          .receipt-content {
            font-size: 15px;
          }
          
          .case-filing-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            background-color: #f0f0f0;
            padding: 10px 15px;
            border-left: 4px solid #8b0000;
          }
          
          .party-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          
          .applicant-details, .respondent-details {
            width: 48%;
            padding: 15px;
            background-color: #f5f5f5;
            border: 1px solid #ddd;
          }
          
          .applicant-details h3, .respondent-details h3 {
            font-size: 16px;
            margin-top: 0;
            margin-bottom: 10px;
            color: #8b0000;
            font-weight: bold;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
          }
          
          .receipt-body {
            margin: 20px 0;
            text-align: justify;
            line-height: 1.6;
          }
          
          .receipt-notes {
            margin-top: 30px;
          }
          
          .receipt-notes h3 {
            font-size: 16px;
            margin-bottom: 10px;
            color: #8b0000;
          }
          
          .receipt-notes ol {
            margin-left: 20px;
            margin-bottom: 30px;
          }
          
          .receipt-notes ol li {
            margin-bottom: 8px;
          }
          
          /* Footer Styles */
          .receipt-footer {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
          }
          
          .court-seal {
            width: 120px;
            height: 120px;
          }
          
          .court-seal img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            opacity: 0.8;
          }
          
          .signatory-section {
            width: 200px;
            text-align: center;
          }
          
          .signature-line {
            border-bottom: 1px solid #000;
            margin-bottom: 10px;
            height: 40px;
          }
          
          .signatory {
            font-weight: bold;
            margin: 0;
          }
          
          /* Override any floating UI elements that aren't part of the receipt */
          .modal-header, .case-details-overlay, .modal-content-container, .close-modal, .details-tabs {
            display: none !important;
          }
          
          /* Print-specific adjustments */
          @media print {
            body {
              padding: 0;
            }
            
            .case-filing-receipt {
              border: none;
              box-shadow: none;
            }
            
            @page {
              size: A4;
              margin: 1cm;
            }
          }
        </style>
      </head>
      <body>
        ${receiptContent.outerHTML}
        <script>
          // Auto print once loaded
          window.onload = function() {
            setTimeout(function() {
              window.print();
              // Optional: Close the window after printing
              // window.close();
            }, 500);
          }
        </script>
      </body>
    </html>
  `;
  
  // Write to the new window
  printWindow.document.open();
  printWindow.document.write(printDocument);
  printWindow.document.close();
};


  // Main Dashboard Render
  return (
    <div className="litigant-dashboard">
     <header className="dashboard-header">
  <div className="header-left">
     <div className="emblem-logo">
                          <div className="emblem-image"><img src={emblem} alt="Aaditiya Tyagi" ></img></div>
                        </div>
    <h1>Welcome To Litigant Dashboard</h1>
  </div>
  <div className="header-right">
    <div className="logout-buttons">
      <button className="logout-button" onClick={() => setShowLogoutConfirmation(true)}>
        Logout
      </button>
      {/* Logout Confirmation Popup */}
      {showLogoutConfirmation && (
        <div className="logout-overlay">
          <div className="logout-confirmation">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div className="logout-actions">
              <button
                className="cancel-button"
                onClick={() => setShowLogoutConfirmation(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      <button
        className="logout-all-button"
        onClick={() => setShowLogoutConfirm(true)}
      >
        Logout All Devices
      </button>
    </div>
    <div
      className="profile-toggle"
      onClick={() => setIsProfileOpen(!isProfileOpen)}
    >
      <div className="profile-avatar">
        {profile?.full_name?.charAt(0).toUpperCase()}
      </div>
    </div>
  </div>
</header>
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="logout-confirm-overlay">
          <div className="logout-confirm-modal">
            <h3>Confirm Logout from All Devices</h3>
            <p>Please enter your password to confirm:</p>
            <input
              type="password"
              value={logoutPassword}
              onChange={(e) => setLogoutPassword(e.target.value)}
              placeholder="Enter your password"
              className="password-input"
            />
            <div className="logout-confirm-buttons">
              <button onClick={handleLogoutAll} className="confirm-button">
                Confirm Logout
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  setLogoutPassword('');
                }}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {isProfileOpen && (
        <div className="profile-overlay">
          <div className="profile-modal">
            <button
              className="close-profile"
              onClick={() => setIsProfileOpen(false)}
            >
              ×
            </button>
            <div className="profile-content">
              <div className="profile-avatar large">
                {profile?.full_name?.charAt(0).toUpperCase()}
              </div>
              <h2>{profile?.full_name}</h2>
              <p>{profile?.contact?.email}</p>
              <p>Party Type: {profile?.party_type}</p>
              <div className="profile-details">
                <div className="detail-item">
                  <span>Party ID:</span>
                  <strong>{profile?.party_id}</strong>
                </div>
                <div className="detail-item">
                  <span>Status:</span>
                  <strong>{profile?.status}</strong>
                </div>
                <div className="detail-item">
                  <span>Guardian Name:</span>
                  <strong>{profile?.parentage}</strong>
                </div>
                <div className="detail-item">
                  <span>Contact:</span>
                  <strong>{profile?.contact?.mobile}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      <div className="dashboard-content">
        <div className="sidebar">
          <nav>
            <button
              className={`nav-button ${
                activeSection === 'dashboard' ? 'active' : ''
              }`}
              onClick={() => setActiveSection('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`nav-button ${
                activeSection === 'file-case' ? 'active' : ''
              }`}
              onClick={() => setActiveSection('file-case')}
            >
              File New Case
            </button>
            <button
    className={`nav-button ${activeSection === 'hearings' ? 'active' : ''}`}
    onClick={() => setActiveSection('hearings')}
>
    Hearings
</button>
<button 
  className={`nav-button ${activeSection === 'documents' ? 'active' : ''}`}
  onClick={() => setActiveSection('documents')}
>
  Documents
</button>
            <Link to="/noticeboard" className="clerk-nav-btn">
                            Notice Board
              </Link>
              <Link to="/usercalendar" className="clerk-nav-btn">
                            Court Calendar
              </Link>
              <Link to="/uploadvideoplead" className="clerk-nav-btn">
                            Video Pleading Submission
              </Link>
              <Link to="/litigantmeeting" className="clerk-nav-btn">
                            Scheduled Meetings
              </Link>
              <Link to="/litigantcaseassign" className="clerk-nav-btn">
                            Find and attach advocate
              </Link>
              {/* Update this button in your sidebar */}

            <button className="nav-button">Notifications</button>
          </nav>
        </div>

        <main className="main-content">
        {activeSection === 'documents' ? (
  renderDocuments()
) : null}
          {activeSection === 'dashboard' ? (
            <>
              <section className="quick-stats">
                <div className="stat-card">
                  <h3>Active Cases</h3>
                  <p>{cases.filter(c => c.status === 'active').length}</p>
                </div>
                <div className="stat-card">
                  <h3>Upcoming Hearings</h3>
                  <p>0</p> {/* You can implement this later */}
                </div>
                <div className="stat-card">
                  <h3>Pending Documents</h3>
                  <p>0</p> {/* You can implement this later */}
                </div>
              </section>
              <section className="cases-section">
  <div className="cases-header">
    <h2>Your Cases</h2>
  </div>

  {loading ? (
    <div className="loading">Loading cases...</div>
  ) : error ? (
    <div className="error-message">{error}</div>
  ) : cases.length === 0 ? (
    <div className="no-cases">
      No cases found. File a new case to get started.
    </div>
  ) : (
    <div className="cases-grid">
      {cases.map((legalCase) => (
        <div key={legalCase._id} className="case-card">
          <div className="case-header">
            <h3>{legalCase.case_num}</h3>
            <span className={`status ${legalCase.status}`}>
              {legalCase.status}
            </span>
          </div>
          <div className="case-details">
            <p><strong>Type:</strong> {legalCase.case_type}</p>
            <p><strong>Court:</strong> {legalCase.court}</p>
            <p><strong>Filed:</strong> 
              {new Date(legalCase.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="case-actions">
            <button
              className="view-details"
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

  {/* Case Details Modal - Moved outside of map loop */}
  {isDetailsOpen && selectedCase && (
    <div className="case-details-overlay" onClick={(e) => {
      // Close modal only when clicking on the overlay, not its children
      if (e.target.className === 'case-details-overlay') {
        setIsDetailsOpen(false);
      }
    }}>
      <div className="case-details-modal">
        <div className="modal-header">
          <div className="header-left">
            <h2>Case: {selectedCase.case_num}</h2>
          </div>
          
          {/* Tab navigation */}
          <div className="details-tabs">
            <button 
              className={viewMode === 'details' ? 'active-tab' : ''}
              onClick={() => setViewMode('details')}
            >
              Case Details
            </button>
            <button 
              className={viewMode === 'receipt' ? 'active-tab' : ''}
              onClick={() => setViewMode('receipt')}
            >
              Case Filing Receipt
            </button>
          </div>
          
          <div className="header-right">
          <button
  className="print-button"
  onClick={printReceipt}
>
  Print Receipt
</button>
            <button
              className="close-modal"
              onClick={() => setIsDetailsOpen(false)}
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Content container */}
        <div className="modal-content-container">
          {/* Case details view */}
          <div 
            className="modal-content"
            style={{ display: viewMode === 'details' ? 'block' : 'none' }}
          >
            <div className="case-details-content">
              <div className="case-status-banner">
                <div className="status-wrapper">
                  <span className={`status-badge ${selectedCase.status?.toLowerCase()}`}>
                    {selectedCase.status || 'Pending'}
                  </span>
                  <span className="filing-date">
                    Filed: {selectedCase.createdAt && new Date(selectedCase.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="case-details-grid">
                <div className="detail-group">
                  <h3>Basic Information</h3>
                  <div className="detail-item">
                    <span className="detail-label">Case Type:</span>
                    <span className="detail-value">{selectedCase.case_type}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Court:</span>
                    <span className="detail-value">{selectedCase.court}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Filed Date:</span>
                    <span className="detail-value">
                      {selectedCase.createdAt && new Date(selectedCase.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="detail-group">
                  <h3>Plaintiff Details</h3>
                  <div className="detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedCase.plaintiff_details?.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Contact:</span>
                    <span className="detail-value">{selectedCase.plaintiff_details?.mobile}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{selectedCase.plaintiff_details?.address}</span>
                  </div>
                </div>
                
                <div className="detail-group">
                  <h3>Respondent Details</h3>
                  <div className="detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedCase.respondent_details?.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Contact:</span>
                    <span className="detail-value">{selectedCase.respondent_details?.mobile}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{selectedCase.respondent_details?.address}</span>
                  </div>
                </div>
                
                {selectedCase.police_station_details && (
                  <div className="detail-group">
                    <h3>Police Station Details</h3>
                    <div className="detail-item">
                      <span className="detail-label">Station:</span>
                      <span className="detail-value">{selectedCase.police_station_details.police_station}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">FIR Number:</span>
                      <span className="detail-value">{selectedCase.police_station_details.fir_no}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">FIR Year:</span>
                      <span className="detail-value">{selectedCase.police_station_details.fir_year}</span>
                    </div>
                  </div>
                )}
                
                <div className="detail-group">
                  <h3>Lower Court Details</h3>
                  <div className="detail-item">
                    <span className="detail-label">Court Name:</span>
                    <span className="detail-value">{selectedCase.lower_court_details?.court_name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Case Number:</span>
                    <span className="detail-value">{selectedCase.case_num}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Case Filing Receipt view */}
          <div 
            className="modal-content"
            style={{ display: viewMode === 'receipt' ? 'block' : 'none' }}
          >
            <div className="case-filing-receipt">
              <div className="receipt-header">
                <div className="receipt-logo">
                  <div className="govt-emblem">
                    <img src={emblem} alt="Ankit Chaudhary" className="team-profile-image" />
                  </div>
                  <div className="receipt-title">
                    <h2>Judicial Courts of India</h2>
                    <h3>{selectedCase.court || "District Court"}</h3>
                    <p>
                     {selectedCase.for_office_use_only?.court_allotted|| "not alloted yet"}

                    </p>
                  </div>
                </div>
                
                <h2 className="receipt-heading">Case Filing Receipt</h2>
                
                <div className="receipt-number">
                  <p><strong>CBR Number:</strong> {selectedCase.cbr_number || selectedCase.case_num}</p>
                  <p><strong>Filing Date:</strong> {selectedCase.createdAt && new Date(selectedCase.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="receipt-content">
                <div className="case-filing-details">
                  <p><strong>Case Type:</strong> {selectedCase.case_type || 'CIVIL CASE'}</p>
                  <p><strong>Court:</strong> {selectedCase.court}</p>
                </div>
                
                <div className="party-details">
                  <div className="applicant-details">
                    <h3>Plaintiff Details:</h3>
                    <p>{selectedCase.plaintiff_details?.name}</p>
                    <p>{selectedCase.plaintiff_details?.address}</p>
                    <p>Contact: {selectedCase.plaintiff_details?.mobile}</p>
                  </div>
                  
                  <div className="respondent-details">
                    <h3>Respondent Details:</h3>
                    <p>{selectedCase.respondent_details?.name}</p>
                    <p>{selectedCase.respondent_details?.address}</p>
                    <p>Contact: {selectedCase.respondent_details?.mobile}</p>
                  </div>
                </div>
                
                <div className="receipt-body">
                  <p>
                    This is to acknowledge receipt of case filing documents for case number {selectedCase.case_num} 
                    dated {selectedCase.createdAt && new Date(selectedCase.createdAt).toLocaleDateString()} 
                    filed by {selectedCase.plaintiff_details?.name} against {selectedCase.respondent_details?.name} 
                    related to {selectedCase.case_subject || selectedCase.case_type} 
                    along with the applicable filing fee of ₹{selectedCase.filing_fee || '1,000'}.
                  </p>
                </div>
                
                <div className="receipt-notes">
                  <h3>Important Information:</h3>
                  <ol>
                    <li>
                      Please quote the case number in all future correspondence.
                    </li>
                    <li>
                      The first hearing date will be communicated separately through official channels.
                    </li>
                    <li>
                      Any changes to contact information must be promptly communicated to the court.
                    </li>
                    <li>
                      All subsequent filings related to this case must reference this case number.
                    </li>
                  </ol>
                  
                  <div className="receipt-footer">
                    <div className="court-seal">
                    <div className="govt-emblem">
                    <img src={stamp} alt="Ankit Chaudhary" className="team-profile-image" />
                  </div>
                    </div>
                    <div className="signatory-section">
                      <div className="signature-line"></div>
                      <p className="signatory">Court Registrar</p>
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

          
            </>
          ) : activeSection === 'file-case' ? (
        renderCaseForm()
    ) : activeSection === 'hearings' ? (
        renderHearings()
    ) : null}
    
    <LegalAssistantChatbot />
        </main>
        
      </div>
    </div>
  );
};

export default LitigantDashboard;