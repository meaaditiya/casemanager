import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../ComponentsCSS/admincase.css';

const CourtAdminCase = () => {
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCases, setTotalCases] = useState(0);

  const [newHearing, setNewHearing] = useState({
    hearing_date: '',
    hearing_type: 'Initial',
    remarks: '',
    next_hearing_date: '',
  });

  const [newDocument, setNewDocument] = useState({
    document_type: '',
    description: '',
    file: null,
  });

  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    remarks: '',
  });

  const statusOptions = [
    'Filed',
    'Pending',
    'Under Investigation',
    'Hearing in Progress',
    'Awaiting Judgment',
    'Disposed',
    'Appealed',
  ];

  const hearingTypes = ['Initial', 'Intermediate', 'Final', 'Adjournment'];

  // Fetch all cases assigned to court admin
  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error('Authentication token not found. Please login again.');
        }

        const response = await axios.get('http://localhost:5000/api/cases/courtadmin', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        setCases(response.data.cases);
        setFilteredCases(response.data.cases);
        setTotalCases(response.data.cases.length);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching cases:', err);
        if (err.response && err.response.status === 403) {
          setError('Access denied: Only court administrators can view this data');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 3000);
        } else if (err.response && err.response.status === 401) {
          setError('Authentication failed. Please login again.');
          localStorage.removeItem('token');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else {
          setError(err.response?.data?.message || 'Failed to fetch cases');
        }
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  // Filter cases based on search term and status
  useEffect(() => {
    let result = [...cases];

    if (searchTerm) {
      result = result.filter(
        (caseItem) =>
          caseItem.case_num.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (caseItem.petitioner_name &&
            caseItem.petitioner_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (caseItem.respondent_name &&
            caseItem.respondent_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((caseItem) => caseItem.status === statusFilter);
    }

    setFilteredCases(result);
  }, [searchTerm, statusFilter, cases]);

  // Handle case selection
  const handleCaseSelect = (caseData) => {
    setSelectedCase(caseData);
    setActiveTab('overview');
    setStatusUpdate({
      status: caseData.status,
      remarks: '',
    });
    setHearings(caseData.hearings || []);
    setNewHearing({
      hearing_date: '',
      hearing_type: 'Initial',
      remarks: '',
      next_hearing_date: '',
    });
    setNewDocument({
      document_type: '',
      description: '',
      file: null,
    });
  };

  const handleAddHearing = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append('hearing_date', newHearing.hearing_date);
      formData.append('hearing_type', newHearing.hearing_type);
      formData.append('remarks', newHearing.remarks);

      if (newHearing.next_hearing_date) {
        formData.append('next_hearing_date', newHearing.next_hearing_date);
      }

      const fileInput = document.getElementById('courtadmin-hearing-attachments');
      if (fileInput && fileInput.files.length > 0) {
        for (let i = 0; i < fileInput.files.length; i++) {
          formData.append('attachments', fileInput.files[i]);
        }
      }

      const response = await axios.post(
        `http://localhost:5000/api/case/${selectedCase.case_num}/hearing/courtadmin`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const updatedCase = {
        ...selectedCase,
        hearings: [...(selectedCase.hearings || []), response.data.hearing],
      };

      setCases(cases.map((c) => (c.case_num === selectedCase.case_num ? updatedCase : c)));
      setFilteredCases(
        filteredCases.map((c) => (c.case_num === selectedCase.case_num ? updatedCase : c))
      );
      setSelectedCase(updatedCase);
      setHearings(updatedCase.hearings);

      setNewHearing({
        hearing_date: '',
        hearing_type: 'Initial',
        remarks: '',
        next_hearing_date: '',
      });

      alert('Hearing added successfully!');
    } catch (err) {
      console.error('Error adding hearing:', err);
      setError(err.response?.data?.message || 'Failed to add hearing');
    }
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();

    try {
      if (!newDocument.file) {
        alert('Please select a file to upload');
        return;
      }

      if (!newDocument.document_type) {
        alert('Document type is required');
        return;
      }

      const formData = new FormData();
      formData.append('document_type', newDocument.document_type);
      formData.append('description', newDocument.description);
      formData.append('file', newDocument.file);

      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (userData.id) {
        formData.append('uploaded_by', userData.id);
      }

      const response = await axios.post(
        `http://localhost:5000/api/case/${selectedCase.case_num}/document/courtadmin`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const newDocumentData = response.data.document;
      if (!newDocumentData.document_id && newDocumentData._id) {
        newDocumentData.document_id = newDocumentData._id;
      }

      const updatedCase = {
        ...selectedCase,
        documents: selectedCase.documents
          ? [...selectedCase.documents, newDocumentData]
          : [newDocumentData],
      };

      setCases(cases.map((c) => (c.case_num === selectedCase.case_num ? updatedCase : c)));
      setFilteredCases(
        filteredCases.map((c) => (c.case_num === selectedCase.case_num ? updatedCase : c))
      );
      setSelectedCase(updatedCase);

      setNewDocument({
        document_type: '',
        description: '',
        file: null,
      });

      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';

      alert('Document uploaded successfully!');
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err.response?.data?.message || 'Failed to upload document');
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();

    try {
      await axios.patch(
        `http://localhost:5000/api/case/${selectedCase.case_num}/status/courtadmin`,
        statusUpdate,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const updatedCase = {
        ...selectedCase,
        status: statusUpdate.status,
        status_history: [
          ...(selectedCase.status_history || []),
          {
            status: statusUpdate.status,
            remarks: statusUpdate.remarks,
            updated_at: new Date().toISOString(),
            updated_by: JSON.parse(localStorage.getItem('user') || '{}').name || 'Unknown',
            updated_by_type: 'Court Admin',
          },
        ],
      };

      setCases(cases.map((c) => (c.case_num === selectedCase.case_num ? updatedCase : c)));
      setFilteredCases(
        filteredCases.map((c) => (c.case_num === selectedCase.case_num ? updatedCase : c))
      );
      setSelectedCase(updatedCase);

      setStatusUpdate({
        status: statusUpdate.status,
        remarks: '',
      });

      alert('Status updated successfully!');
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDownloadAttachment = async (filename) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios({
        method: 'GET',
        url: `http://localhost:5000/api/files/${filename}`,
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filenameFromHeader = filename;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filenameFromHeader = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
        }
      }

      link.setAttribute('download', filenameFromHeader);
      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (err) {
      console.error('Error downloading attachment:', err);
      setError('Failed to download attachment');
    }
  };

  const handleDownloadDocument = async (documentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios({
        method: 'GET',
        url: `http://localhost:5000/api/documents/${documentId}/download/courtadmin`,
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = 'document';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (err) {
      console.error('Error downloading document:', err);
      setError('Failed to download document');
    }
  };

  const handleFileSelect = (e) => {
    setNewDocument({
      ...newDocument,
      file: e.target.files[0],
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Filed':
        return 'courtadmin__status--filed';
      case 'Pending':
        return 'courtadmin__status--pending';
      case 'Under Investigation':
        return 'courtadmin__status--investigation';
      case 'Hearing in Progress':
        return 'courtadmin__status--hearing';
      case 'Awaiting Judgment':
        return 'courtadmin__status--awaiting';
      case 'Disposed':
        return 'courtadmin__status--disposed';
      case 'Appealed':
        return 'courtadmin__status--appealed';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && !selectedCase) {
    return (
      <div className="courtadmin__loading-container">
        <div className="courtadmin__spinner"></div>
        <p className="courtadmin__loading-text">Loading cases...</p>
      </div>
    );
  }

  return (
    <div className="judicial-mgmt__container">
      <div className="judicial-mgmt__header">
        <h1 className="judicial-mgmt__title">Court Administration Panel</h1>
        <div className="judicial-mgmt__stats">
          <div className="judicial-mgmt__stat-item">
            <span className="judicial-mgmt__stat-value">{totalCases}</span>
            <span className="judicial-mgmt__stat-label">Total Cases</span>
          </div>
          <div className="judicial-mgmt__stat-item">
            <span className="judicial-mgmt__stat-value">
              {cases.filter((c) => c.status === 'Hearing in Progress').length}
            </span>
            <span className="judicial-mgmt__stat-label">Active Hearings</span>
          </div>
          <div className="judicial-mgmt__stat-item">
            <span className="judicial-mgmt__stat-value">
              {cases.filter((c) => c.status === 'Disposed').length}
            </span>
            <span className="judicial-mgmt__stat-label">Disposed</span>
          </div>
        </div>
      </div>

      <div className="judicial-mgmt__content">
        <div className="judicial-mgmt__sidebar">
          <div className="judicial-mgmt__search-filter">
            <input
              type="text"
              placeholder="Search cases..."
              className="judicial-mgmt__search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="judicial-mgmt__status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="judicial-mgmt__cases-list">
            <h2 className="judicial-mgmt__section-title">Case List</h2>
            {filteredCases.length === 0 ? (
              <p className="judicial-mgmt__no-cases">No cases match your criteria</p>
            ) : (
              filteredCases.map((caseItem) => (
                <div
                  key={caseItem._id}
                  className={`judicial-mgmt__case-item ${
                    selectedCase && selectedCase._id === caseItem._id
                      ? 'judicial-mgmt__case-item--active'
                      : ''
                  }`}
                  onClick={() => handleCaseSelect(caseItem)}
                >
                  <div className="judicial-mgmt__case-item-header">
                    <span className="judicial-mgmt__case-num">{caseItem.case_num}</span>
                    <span className={`judicial-mgmt__case-status ${getStatusClass(caseItem.status)}`}>
                      {caseItem.status}
                    </span>
                  </div>
                  <div className="judicial-mgmt__case-item-content">
                    <p className="judicial-mgmt__case-parties">
                      <span className="judicial-mgmt__petitioner">
                        {caseItem.plaintiff_details.name || 'Unknown Petitioner'}
                      </span>
                      <span className="judicial-mgmt__vs">vs</span>
                      <span className="judicial-mgmt__respondent">
                        {caseItem.respondent_details.name || 'Unknown Respondent'}
                      </span>
                    </p>
                    <p className="judicial-mgmt__case-filed">Filed: {formatDate(caseItem.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="judicial-mgmt__main-content">
          {selectedCase ? (
            <>
              <div className="judicial-mgmt__case-header">
                <div className="judicial-mgmt__case-info">
                  <h2 className="judicial-mgmt__case-title">
                    Case {selectedCase.case_num}
                    <span className={`judicial-mgmt__case-badge ${getStatusClass(selectedCase.status)}`}>
                      {selectedCase.status}
                    </span>
                  </h2>
                  <h3 className="judicial-mgmt__case-subtitle">
                    {selectedCase.plaintiff_details.name  || 'Unknown Petitioner'} vs{' '}
                    {selectedCase.respondent_details.name || 'Unknown Respondent'}
                  </h3>
                </div>

                <div className="judicial-mgmt__tabs">
                  <button
                    className={`judicial-mgmt__tab ${
                      activeTab === 'overview' ? 'judicial-mgmt__tab--active' : ''
                    }`}
                    onClick={() => setActiveTab('overview')}
                  >
                    Overview
                  </button>
                  <button
                    className={`judicial-mgmt__tab ${
                      activeTab === 'hearings' ? 'judicial-mgmt__tab--active' : ''
                    }`}
                    onClick={() => setActiveTab('hearings')}
                  >
                    Hearings
                  </button>
                  <button
                    className={`judicial-mgmt__tab ${
                      activeTab === 'documents' ? 'judicial-mgmt__tab--active' : ''
                    }`}
                    onClick={() => setActiveTab('documents')}
                  >
                    Documents
                  </button>
                  <button
                    className={`judicial-mgmt__tab ${activeTab === 'status' ? 'judicial-mgmt__tab--active' : ''}`}
                    onClick={() => setActiveTab('status')}
                  >
                    Update Status
                  </button>
                </div>
              </div>

              <div className="judicial-mgmt__tab-content">
                {activeTab === 'overview' && (
                  <div className="judicial-mgmt__overview-tab">
                    <div className="judicial-mgmt__overview-grid">
                      <div className="judicial-mgmt__overview-card">
                        <h3 className="judicial-mgmt__card-title">Case Information</h3>
                        <div className="judicial-mgmt__info-row">
                          <span className="judicial-mgmt__info-label">Case Number:</span>
                          <span className="judicial-mgmt__info-value">{selectedCase.case_num}</span>
                        </div>
                        <div className="judicial-mgmt__info-row">
                          <span className="judicial-mgmt__info-label">Case Type:</span>
                          <span className="judicial-mgmt__info-value">{selectedCase.case_type || 'N/A'}</span>
                        </div>
                        <div className="judicial-mgmt__info-row">
                          <span className="judicial-mgmt__info-label">Filing Date:</span>
                          <span className="judicial-mgmt__info-value">{formatDate(selectedCase.created_at)}</span>
                        </div>
                        <div className="judicial-mgmt__info-row">
                          <span className="judicial-mgmt__info-label">Current Status:</span>
                          <span
                            className={`judicial-mgmt__info-value judicial-mgmt__info-status ${getStatusClass(
                              selectedCase.status
                            )}`}
                          >
                            {selectedCase.status}
                          </span>
                        </div>
                      </div>

                      <div className="judicial-mgmt__overview-card">
                        <h3 className="judicial-mgmt__card-title">Parties</h3>
                        <div className="judicial-mgmt__party-section">
                          <h4 className="judicial-mgmt__party-title">Petitioner</h4>
                          <div className="judicial-mgmt__info-row">
                            <span className="judicial-mgmt__info-label">Name:</span>
                            <span className="judicial-mgmt__info-value">
                              {selectedCase.plaintiff_details.name || 'N/A'}
                            </span>
                          </div>
                          <div className="judicial-mgmt__info-row">
                            <span className="judicial-mgmt__info-label">Contact:</span>
                            <span className="judicial-mgmt__info-value">
                              {selectedCase.plaintiff_details.mobile|| 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="judicial-mgmt__party-section">
                          <h4 className="judicial-mgmt__party-title">Respondent</h4>
                          <div className="judicial-mgmt__info-row">
                            <span className="judicial-mgmt__info-label">Name:</span>
                            <span className="judicial-mgmt__info-value">
                              {selectedCase.respondent_details.name || 'N/A'}
                            </span>
                          </div>
                          <div className="judicial-mgmt__info-row">
                            <span className="judicial-mgmt__info-label">Contact:</span>
                            <span className="judicial-mgmt__info-value">
                              {selectedCase.respondent_details.mobile|| 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="judicial-mgmt__overview-card judicial-mgmt__overview-card--full">
                        <h3 className="judicial-mgmt__card-title">Status History</h3>
                        {selectedCase.status_history && selectedCase.status_history.length > 0 ? (
                          <div className="judicial-mgmt__status-timeline">
                            {selectedCase.status_history.map((history, index) => (
                              <div key={index} className="judicial-mgmt__timeline-item">
                                <div className="judicial-mgmt__timeline-marker"></div>
                                <div className="judicial-mgmt__timeline-content">
                                  <div className="judicial-mgmt__timeline-header">
                                    <span
                                      className={`judicial-mgmt__timeline-status ${getStatusClass(
                                        history.status
                                      )}`}
                                    >
                                      {history.status}
                                    </span>
                                    <span className="judicial-mgmt__timeline-date">
                                      {formatDate(history.updated_at)}
                                    </span>
                                  </div>
                                  <p className="judicial-mgmt__timeline-remarks">
                                    {history.remarks || 'No remarks'}
                                  </p>
                                  <p className="judicial-mgmt__timeline-user">
                                    Updated by: {history.updated_by} ({history.updated_by_type})
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="judicial-mgmt__no-data">No status history available</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'hearings' && (
                  <div className="judicial-mgmt__hearings-tab">
                    <div className="judicial-mgmt__hearings-container">
                      <h3 className="judicial-mgmt__section-title">Scheduled Hearings</h3>
                      {hearings && hearings.length > 0 ? (
                        <div className="judicial-mgmt__hearings-list">
                          {hearings.map((hearing, index) => (
                            <div key={index} className="judicial-mgmt__hearing-card">
                              <div className="judicial-mgmt__hearing-header">
                                <div className="judicial-mgmt__hearing-badge">{hearing.hearing_type}</div>
                                <div className="judicial-mgmt__hearing-date">
                                  {formatDate(hearing.hearing_date)}
                                </div>
                              </div>
                              <div className="judicial-mgmt__hearings-content">
                                <p className="judicial-mgmt__hearing-remarks">
                                  {hearing.remarks || 'No remarks'}
                                </p>
                                {hearing.next_hearing_date && (
                                  <p className="judicial-mgmt__next-hearing">
                                    Next Hearing: {formatDate(hearing.next_hearing_date)}
                                  </p>
                                )}
                                {hearing.attachments && hearing.attachments.length > 0 && (
                                  <div className="judicial-mgmt__attachments">
                                    <h4 className="judicial-mgmt__attachments-title">Attachments</h4>
                                    <ul className="judicial-mgmt__attachments-list">
                                      {hearing.attachments.map((attachment, idx) => (
                                        <li key={idx} className="judicial-mgmt__attachment-item">
                                          <button
                                            className="judicial-mgmt__download-btn"
                                            onClick={() => handleDownloadAttachment(attachment.filename)}
                                          >
                                            {attachment.originalname || attachment.filename}
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="judicial-mgmt__no-data">No hearings scheduled yet</p>
                      )}

                      <h3 className="judicial-mgmt__section-title judicial-mgmt__section-title--form">
                        Schedule New Hearing
                      </h3>
                      <div className="judicial-mgmt__form">
                        <div className="judicial-mgmt__form-row">
                          <div className="judicial-mgmt__form-group">
                            <label className="judicial-mgmt__form-label">Hearing Date*</label>
                            <input
                              type="date"
                              className="judicial-mgmt__form-input"
                              required
                              value={newHearing.hearing_date}
                              onChange={(e) =>
                                setNewHearing({ ...newHearing, hearing_date: e.target.value })
                              }
                            />
                          </div>
                          <div className="judicial-mgmt__form-group">
                            <label className="judicial-mgmt__form-label">Hearing Type*</label>
                            <select
                              className="judicial-mgmt__form-select"
                              required
                              value={newHearing.hearing_type}
                              onChange={(e) =>
                                setNewHearing({ ...newHearing, hearing_type: e.target.value })
                              }
                            >
                              {hearingTypes.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="judicial-mgmt__form-group">
                          <label className="judicial-mgmt__form-label">Remarks</label>
                          <textarea
                            className="judicial-mgmt__form-textarea"
                            rows="3"
                            value={newHearing.remarks}
                            onChange={(e) =>
                              setNewHearing({ ...newHearing, remarks: e.target.value })
                            }
                          ></textarea>
                        </div>

                        <div className="judicial-mgmt__form-group">
                          <label className="judicial-mgmt__form-label">Next Hearing Date (if known)</label>
                          <input
                            type="date"
                            className="judicial-mgmt__form-input"
                            value={newHearing.next_hearing_date}
                            onChange={(e) =>
                              setNewHearing({ ...newHearing, next_hearing_date: e.target.value })
                            }
                          />
                        </div>

                        <div className="judicial-mgmt__form-group">
                          <label className="judicial-mgmt__form-label">Attachments (Max 5 files)</label>
                          <input
                            type="file"
                            id="judicial-mgmt-hearing-attachments"
                            className="judicial-mgmt__form-file"
                            multiple
                            max="5"
                            onChange={(e) => console.log(e.target.files)}
                          />
                          <p className="judicial-mgmt__form-help">
                            You can attach up to 5 files related to this hearing
                          </p>
                        </div>

                        <div className="judicial-mgmt__form-actions">
                          <button onClick={handleAddHearing} className="judicial-mgmt__submit-btn">
                            Schedule Hearing
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="judicial-mgmt__documents-tab">
                    <h3 className="judicial-mgmt__section-title">Case Documents</h3>
                    {selectedCase.documents && selectedCase.documents.length > 0 ? (
                      <div className="judicial-mgmt__documents-grid">
                        {selectedCase.documents.map((document, index) => (
                          <div key={index} className="judicial-mgmt__document-card">
                            <div className="judicial-mgmt__document-icon"></div>
                            <div className="judicial-mgmt__document-info">
                              <h4 className="judicial-mgmt__document-name">{document.file_name}</h4>
                              <p className="judicial-mgmt__document-type">{document.document_type}</p>
                              {document.description && (
                                <p className="judicial-mgmt__document-desc">{document.description}</p>
                              )}
                              <p className="judicial-mgmt__document-date">
                                Uploaded: {formatDate(document.uploaded_date)}
                              </p>
                            </div>
                            <button
                              className="judicial-mgmt__document-download"
                              onClick={() => handleDownloadDocument(document.document_id)}
                            >
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="judicial-mgmt__no-data">No documents available for this case</p>
                    )}

                    <h3 className="judicial-mgmt__section-title judicial-mgmt__section-title--form">
                      Upload New Document
                    </h3>
                    <div className="judicial-mgmt__form">
                      <div className="judicial-mgmt__form-row">
                        <div className="judicial-mgmt__form-group">
                          <label className="judicial-mgmt__form-label">Document Type*</label>
                          <input
                            type="text"
                            className="judicial-mgmt__form-input"
                            required
                            placeholder="E.g., Judgment, Exhibit, Petition"
                            value={newDocument.document_type}
                            onChange={(e) =>
                              setNewDocument({ ...newDocument, document_type: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div className="judicial-mgmt__form-group">
                        <label className="judicial-mgmt__form-label">Description</label>
                        <textarea
                          className="judicial-mgmt__form-textarea"
                          rows="2"
                          placeholder="Brief description of the document"
                          value={newDocument.description}
                          onChange={(e) =>
                            setNewDocument({ ...newDocument, description: e.target.value })
                          }
                        ></textarea>
                      </div>

                      <div className="judicial-mgmt__form-group">
                        <label className="judicial-mgmt__form-label">File*</label>
                        <input
                          type="file"
                          className="judicial-mgmt__form-file"
                          required
                          onChange={handleFileSelect}
                        />
                        {newDocument.file && (
                          <p className="judicial-mgmt__selected-file">
                            Selected: {newDocument.file.name} (
                            {(newDocument.file.size / 1024).toFixed(2)} KB)
                          </p>
                        )}
                      </div>

                      <div className="judicial-mgmt__form-actions">
                        <button onClick={handleDocumentUpload} className="judicial-mgmt__submit-btn">
                          Upload Document
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'status' && (
                  <div className="judicial-mgmt__status-tab">
                    <h3 className="judicial-mgmt__section-title">Update Case Status</h3>
                    <div className="judicial-mgmt__current-status">
                      <p className="judicial-mgmt__status-info">
                        Current Status:
                        <span
                          className={`judicial-mgmt__status-badge ${getStatusClass(selectedCase.status)}`}
                        >
                          {selectedCase.status}
                        </span>
                      </p>
                    </div>

                    <div className="judicial-mgmt__form">
                      <div className="judicial-mgmt__form-group">
                        <label className="judicial-mgmt__form-label">New Status*</label>
                        <select
                          className="judicial-mgmt__form-select"
                          required
                          value={statusUpdate.status}
                          onChange={(e) =>
                            setStatusUpdate({ ...statusUpdate, status: e.target.value })
                          }
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="judicial-mgmt__form-group">
                        <label className="judicial-mgmt__form-label">
                          Remarks/Reason for Status Change*
                        </label>
                        <textarea
                          className="judicial-mgmt__form-textarea"
                          rows="4"
                          required
                          placeholder="Explain the reason for changing the status"
                          value={statusUpdate.remarks}
                          onChange={(e) =>
                            setStatusUpdate({ ...statusUpdate, remarks: e.target.value })
                          }
                        ></textarea>
                      </div>

                      <div className="judicial-mgmt__form-actions">
                        <button
                          onClick={handleStatusUpdate}
                          className="judicial-mgmt__submit-btn"
                          disabled={statusUpdate.status === selectedCase.status}
                        >
                          Update Status
                        </button>
                      </div>
                    </div>

                    <div className="judicial-mgmt__status-history">
                      <h3 className="judicial-mgmt__subsection-title">Status History</h3>
                      {selectedCase.status_history && selectedCase.status_history.length > 0 ? (
                        <div className="judicial-mgmt__status-timeline judicial-mgmt__status-timeline--vertical">
                          {selectedCase.status_history.map((history, index) => (
                            <div key={index} className="judicial-mgmt__timeline-item">
                              <div className="judicial-mgmt__timeline-marker"></div>
                              <div className="judicial-mgmt__timeline-content">
                                <div className="judicial-mgmt__timeline-header">
                                  <span
                                    className={`judicial-mgmt__timeline-status ${getStatusClass(
                                      history.status
                                    )}`}
                                  >
                                    {history.status}
                                  </span>
                                  <span className="judicial-mgmt__timeline-date">
                                    {formatDate(history.updated_at)}
                                  </span>
                                </div>
                                <p className="judicial-mgmt__timeline-remarks">
                                  {history.remarks || 'No remarks'}
                                </p>
                                <p className="judicial-mgmt__timeline-user">
                                  Updated by: {history.updated_by} ({history.updated_by_type})
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="judicial-mgmt__no-data">No status history available</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="judicial-mgmt__no-selection">
              <div className="judicial-mgmt__no-selection-icon"></div>
              <h2 className="judicial-mgmt__no-selection-title">No Case Selected</h2>
              <p className="judicial-mgmt__no-selection-text">
                Please select a case from the list to view details and manage it.
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="judicial-mgmt__error-toast">
          <p className="judicial-mgmt__error-message">{error}</p>
          <button className="judicial-mgmt__error-close" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}
    </div>
  );  
};

export default CourtAdminCase;