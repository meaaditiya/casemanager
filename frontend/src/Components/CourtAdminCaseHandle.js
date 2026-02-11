import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../ComponentsCSS/admincase.css';
import AuditTrailReportGenerator from './AuditTrailReportGenerator';
import JudicialLoadingOverlay from './CourtAdminCaseHandleLoading';
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

  const [auditTrail, setAuditTrail] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [tamperingReport, setTamperingReport] = useState(null);
  const [tamperingLoading, setTamperingLoading] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showTamperingModal, setShowTamperingModal] = useState(false);

  const [fullScanResult, setFullScanResult] = useState(null);
  const [fullScanLoading, setFullScanLoading] = useState(false);
  const [showFullScanModal, setShowFullScanModal] = useState(false);

  const [securityAlerts, setSecurityAlerts] = useState(null);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
// Add these new state variables
const [blockchainStats, setBlockchainStats] = useState(null);
const [statsLoading, setStatsLoading] = useState(false);
const [verificationDetails, setVerificationDetails] = useState(null);
const [showVerificationModal, setShowVerificationModal] = useState(false);
const [loadingOverlay, setLoadingOverlay] = useState({
  visible: false,
  type: null,
  progress: 0,
  message: 'Processing your request'
});
// Add after existing state variables (around line 20-30)
const [documentRequests, setDocumentRequests] = useState([]);
const [selectedDocumentRequest, setSelectedDocumentRequest] = useState(null);
const [showDocumentRequestModal, setShowDocumentRequestModal] = useState(false);
const [showDocumentVerificationModal, setShowDocumentVerificationModal] = useState(false);
const [selectedDocumentForVerification, setSelectedDocumentForVerification] = useState(null);

const [documentRequestForm, setDocumentRequestForm] = useState({
  document_type: '',
  description: '',
  requested_from: '',
  requested_from_type: 'litigant',
  submission_deadline: ''
});

const [verificationForm, setVerificationForm] = useState({
  verification_status: 'verified',
  verification_notes: ''
});
const [newHearing, setNewHearing] = useState({
    hearing_date: '',
    hearing_type: 'Initial',
    remarks: '',
    next_hearing_date: '',
    sign_hearing: false, // New field for digital signature
  });

  const [newDocument, setNewDocument] = useState({
    document_type: '',
    description: '',
    file: null,
  });
// Add after existing document states
const [directDocumentUpload, setDirectDocumentUpload] = useState({
  document_type: '',
  description: '',
  file: null
});
const [showDirectUploadModal, setShowDirectUploadModal] = useState(false);
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
const [isRichTextMode, setIsRichTextMode] = useState(false);
  const textareaRef = useRef(null);
  const [selectedHearingForSign, setSelectedHearingForSign] = useState(null);
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

  useEffect(() => {
    let result = [...cases];

    if (searchTerm) {
      result = result.filter(
        (caseItem) =>
          caseItem.case_num.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (caseItem.plaintiff_details?.name &&
            caseItem.plaintiff_details.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (caseItem.respondent_details?.name &&
            caseItem.respondent_details.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((caseItem) => caseItem.status === statusFilter);
    }

    setFilteredCases(result);
  }, [searchTerm, statusFilter, cases]);
const showLoadingOverlay = (type, initialMessage = '') => {
  const messages = {
    audit_trail: 'Fetching audit trail from blockchain...',
    tampering_investigation: 'Comparing blockchain records with database...',
    full_system_scan: 'Running comprehensive system verification...',
    security_alerts: 'Loading security alert database...',
    blockchain_stats: 'Calculating blockchain integrity metrics...',
    generating_report: 'Processing case data and generating report...',
    case_manipulation: 'Analyzing case changes and modifications...',
    verification_details: 'Fetching detailed block verification data...'
  };

  setLoadingOverlay({
    visible: true,
    type: type,
    progress: 0,
    message: initialMessage || messages[type] || 'Processing your request'
  });
};

const hideLoadingOverlay = () => {
  setLoadingOverlay({
    visible: false,
    type: null,
    progress: 0,
    message: 'Processing your request'
  });
};
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
    sign_hearing: false,
  });
  setNewDocument({
    document_type: '',
    description: '',
    file: null,
  });
  setAuditTrail(null);
  setTamperingReport(null);
  
  // Fetch document requests for this case
  fetchDocumentRequests(caseData.case_num);
};
  // Fetch document requests for a case
const fetchDocumentRequests = async (caseNum) => {
  try {
    showLoadingOverlay('generating_report', 'Loading document requests...');
    const token = localStorage.getItem('token');
    
    const response = await axios.get(
      `http://localhost:5000/api/courtadmin/case/${caseNum}/documents`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    setDocumentRequests(response.data.documents || []);
    hideLoadingOverlay();
  } catch (err) {
    console.error('Error fetching document requests:', err);
    setError(err.response?.data?.message || 'Failed to fetch document requests');
    hideLoadingOverlay();
  }
};

// Request document from litigant/advocate
const handleRequestDocument = async (e) => {
  e.preventDefault();
  
  try {
    showLoadingOverlay('case_manipulation', 'Creating document request...');
    const token = localStorage.getItem('token');
    
    const response = await axios.post(
      `http://localhost:5000/api/courtadmin/case/${selectedCase.case_num}/request-document`,
      documentRequestForm,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    alert('Document request sent successfully!');
    await fetchDocumentRequests(selectedCase.case_num);
    
    setDocumentRequestForm({
      document_type: '',
      description: '',
      requested_from: '',
      requested_from_type: 'litigant',
      submission_deadline: ''
    });
    
    setShowDocumentRequestModal(false);
    hideLoadingOverlay();
  } catch (err) {
    console.error('Error requesting document:', err);
    setError(err.response?.data?.message || 'Failed to request document');
    hideLoadingOverlay();
  }
};

// Verify document
const handleVerifyDocument = async (documentId, status, notes) => {
  try {
    showLoadingOverlay('verification_details', 'Verifying document...');
    const token = localStorage.getItem('token');
    
    const response = await axios.patch(  // ✅ CHANGE THIS FROM POST TO PATCH
      `http://localhost:5000/api/courtadmin/case/${selectedCase.case_num}/verify-document/${documentId}`,
      {
        verification_status: status,
        verification_notes: notes
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    alert(`Document ${status} successfully!`);
    await fetchDocumentRequests(selectedCase.case_num);
    setShowDocumentVerificationModal(false);
    setSelectedDocumentForVerification(null);
    hideLoadingOverlay();
  } catch (err) {
    console.error('Error verifying document:', err);
    setError(err.response?.data?.message || 'Failed to verify document');
    hideLoadingOverlay();
  }
};

// Verify document signature
const verifyDocumentSignature = async (documentId) => {
  try {
    showLoadingOverlay('verification_details', 'Verifying signature...');
    const token = localStorage.getItem('token');
    
    const response = await axios.get(
      `http://localhost:5000/api/case/${selectedCase.case_num}/document/${documentId}/verify-signature`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    const { verification } = response.data;
    hideLoadingOverlay();
    
    if (verification.is_valid) {
      alert(`✓ Signature Valid\n\nSigned by: ${response.data.signature_details.signed_by_name}\nSigned on: ${new Date(response.data.signature_details.signature_timestamp).toLocaleString()}`);
    } else {
      alert(`✗ Signature Invalid\n\n${verification.message}`);
    }
  } catch (err) {
    console.error('Error verifying signature:', err);
    hideLoadingOverlay();
    setError(err.response?.data?.message || 'Failed to verify signature');
  }
};
// Direct document upload by admin/clerk (no request needed)
const handleDirectDocumentUpload = async (e) => {
  e.preventDefault();
  
  try {
    if (!directDocumentUpload.file) {
      alert('Please select a file to upload');
      return;
    }

    if (!directDocumentUpload.document_type) {
      alert('Document type is required');
      return;
    }

    showLoadingOverlay('case_manipulation', 'Uploading document...');
    const token = localStorage.getItem('token');
    
    const formData = new FormData();
    formData.append('file', directDocumentUpload.file);
    formData.append('document_type', directDocumentUpload.document_type);
    formData.append('description', directDocumentUpload.description);

    const response = await axios.post(
      `http://localhost:5000/api/courtadmin/case/${selectedCase.case_num}/upload-document`,
      formData,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    alert('Document uploaded and verified successfully!');
    await fetchDocumentRequests(selectedCase.case_num);
    
    setDirectDocumentUpload({
      document_type: '',
      description: '',
      file: null
    });
    
    // Reset file input
    const fileInput = document.getElementById('direct-upload-file');
    if (fileInput) fileInput.value = '';
    
    setShowDirectUploadModal(false);
    hideLoadingOverlay();
  } catch (err) {
    console.error('Error uploading document:', err);
    setError(err.response?.data?.message || 'Failed to upload document');
    hideLoadingOverlay();
  }
};
const fetchAuditTrail = async (caseNum) => {
  try {
    showLoadingOverlay('audit_trail');
    const token = localStorage.getItem('token');
    
    const response = await axios.get(
      `http://localhost:5000/api/blockchain/case/${caseNum}/audit-trail`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('Audit Trail Response:', response.data);
    setAuditTrail(response.data);
    setShowAuditModal(true);
    hideLoadingOverlay();
  } catch (err) {
    console.error('Error fetching audit trail:', err);
    setError(err.response?.data?.message || 'Failed to fetch audit trail');
    hideLoadingOverlay();
  }
};
const investigateTampering = async (caseNum) => {
  try {
    showLoadingOverlay('tampering_investigation');
    const token = localStorage.getItem('token');
    
    const response = await axios.get(
      `http://localhost:5000/api/blockchain/case/${caseNum}/verify`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    setTamperingReport(response.data);
    setShowTamperingModal(true);
    hideLoadingOverlay();
  } catch (err) {
    console.error('Error investigating tampering:', err);
    if (err.response) {
      setError(`Error ${err.response.status}: ${err.response.data?.message || 'Failed to investigate tampering'}`);
    } else if (err.request) {
      setError('No response from server. Please check your connection.');
    } else {
      setError(err.message || 'Failed to investigate tampering');
    }
    hideLoadingOverlay();
  }
};
const viewDetailedVerification = async (entry) => {
  try {
    showLoadingOverlay('verification_details');
    const token = localStorage.getItem('token');
    
    const response = await axios.get(
      `http://localhost:5000/api/blockchain/block/${entry.block_index}/verify`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    setVerificationDetails({
      entry,
      details: response.data
    });
    setShowVerificationModal(true);
    hideLoadingOverlay();
  } catch (err) {
    console.error('Error fetching verification details:', err);
    setError(err.response?.data?.message || 'Failed to fetch verification details');
    hideLoadingOverlay();
  }
};

const closeVerificationModal = () => {
  setShowVerificationModal(false);
  setVerificationDetails(null);
};

  const performFullScan = async () => {
  try {
    showLoadingOverlay('full_system_scan');
    const token = localStorage.getItem('token');
    
    const response = await axios.post(
      'http://localhost:5000/api/blockchain/verify/full-scan',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    setFullScanResult(response.data);
    setShowFullScanModal(true);
    hideLoadingOverlay();
  } catch (err) {
    console.error('Error performing full scan:', err);
    setError(err.response?.data?.message || 'Failed to perform full scan');
    hideLoadingOverlay();
  }
};
const insertFormatting = (before, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
    
    setNewHearing({
      ...newHearing,
      remarks: newText
    });

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + before.length + selectedText.length;
    }, 0);
  };

  // Add function to render text editor toolbar
  const renderTextEditorToolbar = () => (
    <div className="text-editor-toolbar">
      <button 
        type="button"
        className="toolbar-btn"
        onClick={() => insertFormatting('<strong>', '</strong>')}
        title="Bold"
      >
        <strong>B</strong>
      </button>
      <button 
        type="button"
        className="toolbar-btn"
        onClick={() => insertFormatting('<em>', '</em>')}
        title="Italic"
      >
        <em>I</em>
      </button>
      <button 
        type="button"
        className="toolbar-btn"
        onClick={() => insertFormatting('<u>', '</u>')}
        title="Underline"
      >
        <u>U</u>
      </button>
      <button 
        type="button"
        className="toolbar-btn"
        onClick={() => insertFormatting('\n• ', '')}
        title="Bullet Point"
      >
        • List
      </button>
      <button 
        type="button"
        className="toolbar-btn"
        onClick={() => {
          const textarea = textareaRef.current;
          const start = textarea.selectionStart;
          const text = textarea.value;
          const newText = text.substring(0, start) + '\n\n' + text.substring(start);
          setNewHearing({ ...newHearing, remarks: newText });
          setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = start + 2;
          }, 0);
        }}
        title="New Paragraph"
      >
        ¶
      </button>
    </div>
  );
 const fetchSecurityAlerts = async () => {
  try {
    showLoadingOverlay('security_alerts');
    const token = localStorage.getItem('token');
    
    const response = await axios.get(
      'http://localhost:5000/api/blockchain/alerts',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    setSecurityAlerts(response.data);
    setShowAlertsModal(true);
    hideLoadingOverlay();
  } catch (err) {
    console.error('Error fetching security alerts:', err);
    setError(err.response?.data?.message || 'Failed to fetch security alerts');
    hideLoadingOverlay();
  }
};

const fetchBlockchainStats = async () => {
  try {
    showLoadingOverlay('blockchain_stats');
    const token = localStorage.getItem('token');
    
    const response = await axios.get(
      'http://localhost:5000/api/blockchain/stats',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    setBlockchainStats(response.data);
    hideLoadingOverlay();
  } catch (err) {
    console.error('Error fetching blockchain stats:', err);
    setError(err.response?.data?.message || 'Failed to fetch blockchain stats');
    hideLoadingOverlay();
  }
};
const handleAddHearing = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append('hearing_date', newHearing.hearing_date);
      formData.append('hearing_type', newHearing.hearing_type);
      formData.append('remarks', newHearing.remarks);
      formData.append('sign_hearing', newHearing.sign_hearing); // Add signature flag

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
        sign_hearing: false,
      });

      // Reset file input
      if (fileInput) fileInput.value = '';

      alert('Hearing added successfully!');
    } catch (err) {
      console.error('Error adding hearing:', err);
      setError(err.response?.data?.message || 'Failed to add hearing');
    }
  };

  // Add function to sign a hearing
  const signHearing = async (hearingId) => {
    try {
      if (!window.confirm('Are you sure you want to digitally sign this hearing? This action cannot be undone.')) {
        return;
      }

      showLoadingOverlay('case_manipulation', 'Signing hearing digitally...');

      const response = await axios.post(
        `http://localhost:5000/api/case/${selectedCase.case_num}/hearing/${hearingId}/sign`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );

      // Update the hearing in the case
      const updatedHearings = selectedCase.hearings.map(h => 
        h._id === hearingId ? response.data.hearing : h
      );

      const updatedCase = { ...selectedCase, hearings: updatedHearings };
      setSelectedCase(updatedCase);
      setCases(cases.map(c => c.case_num === selectedCase.case_num ? updatedCase : c));
      setFilteredCases(filteredCases.map(c => c.case_num === selectedCase.case_num ? updatedCase : c));
      setHearings(updatedHearings);

      hideLoadingOverlay();
      alert('Hearing signed successfully');
    } catch (err) {
      console.error('Error signing hearing:', err);
      hideLoadingOverlay();
      setError(err.response?.data?.message || 'Failed to sign hearing');
    }
  };

  // Add function to verify hearing signature
  const verifyHearingSignature = async (hearingId) => {
    try {
      showLoadingOverlay('verification_details', 'Verifying signature...');

      const response = await axios.get(
        `http://localhost:5000/api/case/${selectedCase.case_num}/hearing/${hearingId}/verify-signature`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );

      const { verification } = response.data;
      
      hideLoadingOverlay();

      if (verification.valid) {
        alert(`✓ Signature Valid\n\nSigned by: ${verification.signed_by}\nSigned on: ${new Date(verification.signed_at).toLocaleString()}`);
      } else {
        alert(`✗ Signature Invalid\n\n${verification.message}`);
      }
    } catch (err) {
      console.error('Error verifying signature:', err);
      hideLoadingOverlay();
      setError(err.response?.data?.message || 'Failed to verify signature');
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

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'severity-critical';
      case 'HIGH':
        return 'severity-high';
      case 'MEDIUM':
        return 'severity-medium';
      case 'LOW':
        return 'severity-low';
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

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const closeAuditModal = () => {
    setShowAuditModal(false);
    setAuditTrail(null);
  };

  const closeTamperingModal = () => {
    setShowTamperingModal(false);
    setTamperingReport(null);
  };

  const closeFullScanModal = () => {
    setShowFullScanModal(false);
    setFullScanResult(null);
  };

  const closeAlertsModal = () => {
    setShowAlertsModal(false);
    setSecurityAlerts(null);
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

      <div className="blockchain-verification-panel">
  <h2 className="blockchain-panel-title">Blockchain Verification Center</h2>
  <div className="blockchain-actions-grid">
    <button
      className="blockchain-action-btn blockchain-action-btn--scan"
      onClick={performFullScan}
      disabled={fullScanLoading}
    >
      {fullScanLoading ? 'Scanning...' : 'Run Full System Scan'}
    </button>
    
    <button
      className="blockchain-action-btn blockchain-action-btn--alerts"
      onClick={fetchSecurityAlerts}
      disabled={alertsLoading}
    >
      {alertsLoading ? 'Loading...' : 'View Security Alerts'}
    </button>

    <button
      className="blockchain-action-btn blockchain-action-btn--stats"
      onClick={fetchBlockchainStats}
      disabled={statsLoading}
    >
      {statsLoading ? 'Loading...' : 'Blockchain Statistics'}
    </button>
  </div>

  {blockchainStats && (
    <div className="blockchain-stats-summary">
      <h3>Current Blockchain Status</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Total Blocks:</span>
          <span className="stat-value">{blockchainStats.totalBlocks}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Chain Valid:</span>
          <span className={`stat-value ${blockchainStats.verification?.chainValid ? 'text-success' : 'text-danger'}`}>
            {blockchainStats.verification?.chainValid ? '✅ Yes' : '❌ No'}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Integrity Score:</span>
          <span className="stat-value">{blockchainStats.verification?.integrityScore}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">IPFS Anchored:</span>
          <span className="stat-value">{blockchainStats.security?.ipfsAnchoredBlocks}/{blockchainStats.totalBlocks}</span>
        </div>
      </div>
    </div>
  )}
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
                        {caseItem.plaintiff_details?.name || 'Unknown Petitioner'}
                      </span>
                      <span className="judicial-mgmt__vs">vs</span>
                      <span className="judicial-mgmt__respondent">
                        {caseItem.respondent_details?.name || 'Unknown Respondent'}
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
                    {selectedCase.plaintiff_details?.name || 'Unknown Petitioner'} vs{' '}
                    {selectedCase.respondent_details?.name || 'Unknown Respondent'}
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
                  <button
                    className={`judicial-mgmt__tab ${activeTab === 'blockchain' ? 'judicial-mgmt__tab--active' : ''}`}
                    onClick={() => setActiveTab('blockchain')}
                  >
                    Blockchain Verification
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
                              {selectedCase.plaintiff_details?.name || 'N/A'}
                            </span>
                          </div>
                          <div className="judicial-mgmt__info-row">
                            <span className="judicial-mgmt__info-label">Contact:</span>
                            <span className="judicial-mgmt__info-value">
                              {selectedCase.plaintiff_details?.mobile || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="judicial-mgmt__party-section">
                          <h4 className="judicial-mgmt__party-title">Respondent</h4>
                          <div className="judicial-mgmt__info-row">
                            <span className="judicial-mgmt__info-label">Name:</span>
                            <span className="judicial-mgmt__info-value">
                              {selectedCase.respondent_details?.name || 'N/A'}
                            </span>
                          </div>
                          <div className="judicial-mgmt__info-row">
                            <span className="judicial-mgmt__info-label">Contact:</span>
                            <span className="judicial-mgmt__info-value">
                              {selectedCase.respondent_details?.mobile || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="judicial-mgmt__overview-card judicial-mgmt__overview-card--full">
                        <h3 className="judicial-mgmt__card-title">Status History</h3>
                        {selectedCase.status_history && selectedCase.status_history.length> 0 ? (
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
                  {hearing.digital_signature && hearing.digital_signature.is_signed && (
                    <div className="digital-signature-badge" title="Digitally Signed">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Signed
                    </div>
                  )}
                </div>
                
                <div className="judicial-mgmt__hearings-content">
                  {hearing.remarks && (
                    <div 
                      className="judicial-mgmt__hearing-remarks"
                      dangerouslySetInnerHTML={{ __html: hearing.remarks }}
                    />
                  )}
                  
                  {hearing.next_hearing_date && (
                    <p className="judicial-mgmt__next-hearing">
                      Next Hearing: {formatDate(hearing.next_hearing_date)}
                    </p>
                  )}

                  {hearing.digital_signature && hearing.digital_signature.is_signed && (
                    <div className="judicial-mgmt__hearing-signature-info">
                      <div className="signature-details">
                        <span className="signature-label">Signed by:</span>
                        <span className="signature-value">{hearing.digital_signature.signed_by_name}</span>
                      </div>
                      <div className="signature-details">
                        <span className="signature-label">Role:</span>
                        <span className="signature-value">{hearing.digital_signature.signed_by_role}</span>
                      </div>
                      <div className="signature-details">
                        <span className="signature-label">Signed on:</span>
                        <span className="signature-value">
                          {formatDateTime(hearing.digital_signature.signature_timestamp)}
                        </span>
                      </div>
                      <button
                        className="verify-signature-btn"
                        onClick={() => verifyHearingSignature(hearing._id)}
                      >
                        🔍 Verify Signature
                      </button>
                    </div>
                  )}

                  {!hearing.digital_signature?.is_signed && (
                    <button
                      className="sign-hearing-btn"
                      onClick={() => signHearing(hearing._id)}
                    >
                      ✍️ Sign Digitally
                    </button>
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
            <label className="judicial-mgmt__form-label">
              Remarks
              <button
                type="button"
                className="toggle-editor-btn"
                onClick={() => setIsRichTextMode(!isRichTextMode)}
              >
                {isRichTextMode ? 'Simple Mode' : 'Rich Text Mode'}
              </button>
            </label>
            
            {isRichTextMode && renderTextEditorToolbar()}
            
            <textarea
              ref={textareaRef}
              className="judicial-mgmt__form-textarea hearing-remarks-textarea"
              rows="8"
              value={newHearing.remarks}
              onChange={(e) =>
                setNewHearing({ ...newHearing, remarks: e.target.value })
              }
              placeholder="Enter hearing remarks. Press Enter for new line, double Enter for new paragraph."
            ></textarea>
            
            <div className="formatting-help">
              <small>
                💡 Tip: Use the toolbar buttons or type HTML tags directly for formatting.
                Paragraphs and line breaks will be preserved.
              </small>
            </div>
          </div>

          <div className="judicial-mgmt__form-group">
            <label className="judicial-mgmt__form-label">Attachments (Max 5 files)</label>
            <input
              type="file"
              id="courtadmin-hearing-attachments"
              className="judicial-mgmt__form-file"
              multiple
              max="5"
            />
            <p className="judicial-mgmt__form-help">
              You can attach up to 5 files related to this hearing
            </p>
          </div>

          <div className="judicial-mgmt__form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={newHearing.sign_hearing}
                onChange={(e) => setNewHearing({
                  ...newHearing,
                  sign_hearing: e.target.checked
                })}
              />
              <span>Digitally sign this hearing</span>
            </label>
            <small className="help-text">
              Digitally signing will create a tamper-proof record of this hearing.
            </small>
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
   <div className="documents-tab-header">
  <h3 className="judicial-mgmt__section-title">Document Management</h3>
  <div className="document-actions-group">
    <button 
      className="request-document-btn"
      onClick={() => setShowDirectUploadModal(true)}
    >
     Upload Document
    </button>
    <button 
      className="request-document-btn"
      onClick={() => setShowDocumentRequestModal(true)}
    >
      Request Document
    </button>
  </div>
</div>

    {/* Document Requests Table */}
    <div className="document-requests-section">
      <h4 className="subsection-title">All Document Requests</h4>
      
      {documentRequests && documentRequests.length > 0 ? (
        <div className="document-table-container">
          <table className="document-requests-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Requested From</th>
                <th>Status</th>
                <th>Deadline</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documentRequests.map((doc, index) => (
                <tr key={index} className={`doc-row doc-row--${doc.verification_status}`}>
                  <td>
                    <div className="doc-type-cell">
                      <strong>{doc.document_type}</strong>
                      {doc.description && (
                        <small className="doc-description">{doc.description}</small>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="requested-from-cell">
                      <span className={`party-badge party-badge--${doc.requested_from_type}`}>
                        {doc.requested_from_type}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-badge--${doc.verification_status}`}>
                      {doc.verification_status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <span className="date-cell">
                      {doc.submission_deadline ? formatDate(doc.submission_deadline) : 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className="date-cell">
                      {doc.uploaded_date ? formatDate(doc.uploaded_date) : '—'}
                    </span>
                  </td>
                  <td>
                    <div className="doc-actions">
                      {doc.verification_status === 'uploaded_pending_review' && (
                        <button
                          className="doc-action-btn doc-action-btn--verify"
                          onClick={() => {
                            setSelectedDocumentForVerification(doc);
                            setShowDocumentVerificationModal(true);
                          }}
                        >
                          Review
                        </button>
                      )}
                      
                      {doc.file_name && (
                        <button
                          className="doc-action-btn doc-action-btn--download"
                          onClick={() => handleDownloadDocument(doc.document_id)}
                        >
                          Download
                        </button>
                      )}
                      
                      {doc.digital_signature && doc.digital_signature.is_signed && (
                        <button
                          className="doc-action-btn doc-action-btn--signature"
                          onClick={() => verifyDocumentSignature(doc.document_id)}
                          title="Verify Digital Signature"
                        >
                          🔍 Verify
                        </button>
                      )}
                      
                      {doc.verification_status === 'verified' && doc.digital_signature && (
                        <span className="signature-indicator" title="Digitally Signed">
                          ✓ Signed
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="judicial-mgmt__no-data">No document requests for this case</p>
      )}
    </div>

    {/* Document Request Modal */}
    {showDocumentRequestModal && (
      <div className="blockchain-modal-overlay" onClick={() => setShowDocumentRequestModal(false)}>
        <div className="blockchain-modal" onClick={(e) => e.stopPropagation()}>
          <div className="blockchain-modal-header">
            <h2>Request Document</h2>
            <button 
              className="blockchain-modal-close" 
              onClick={() => setShowDocumentRequestModal(false)}
            >
              ×
            </button>
          </div>
          
          <div className="blockchain-modal-content">
            <form onSubmit={handleRequestDocument} className="document-request-form">
              <div className="form-group">
                <label>Document Type *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Affidavit, Evidence, Certificate"
                  value={documentRequestForm.document_type}
                  onChange={(e) => setDocumentRequestForm({
                    ...documentRequestForm,
                    document_type: e.target.value
                  })}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  placeholder="Brief description of what is needed"
                  value={documentRequestForm.description}
                  onChange={(e) => setDocumentRequestForm({
                    ...documentRequestForm,
                    description: e.target.value
                  })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Request From *</label>
                  <select
                    required
                    value={documentRequestForm.requested_from_type}
                    onChange={(e) => setDocumentRequestForm({
                      ...documentRequestForm,
                      requested_from_type: e.target.value,
                      requested_from: ''
                    })}
                  >
                    <option value="litigant">Litigant</option>
                    <option value="advocate">Advocate</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Select Party *</label>
                  <select
                    required
                    value={documentRequestForm.requested_from}
                    onChange={(e) => setDocumentRequestForm({
                      ...documentRequestForm,
                      requested_from: e.target.value
                    })}
                  >
                    <option value="">-- Select --</option>
                    {documentRequestForm.requested_from_type === 'litigant' ? (
                      <>
                        {selectedCase.plaintiff_details?.party_id && (
                          <option value={selectedCase.plaintiff_details.party_id}>
                            Plaintiff - {selectedCase.plaintiff_details.name}
                          </option>
                        )}
                        {selectedCase.respondent_details?.party_id && (
                          <option value={selectedCase.respondent_details.party_id}>
                            Respondent - {selectedCase.respondent_details.name}
                          </option>
                        )}
                      </>
                    ) : (
                      <>
                        {selectedCase.plaintiff_details?.advocate_id && (
                          <option value={selectedCase.plaintiff_details.advocate_id}>
                            Plaintiff Advocate - {selectedCase.plaintiff_details.advocate}
                          </option>
                        )}
                        {selectedCase.respondent_details?.advocate_id && (
                          <option value={selectedCase.respondent_details.advocate_id}>
                            Respondent Advocate - {selectedCase.respondent_details.advocate}
                          </option>
                        )}
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Submission Deadline *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={documentRequestForm.submission_deadline}
                  onChange={(e) => setDocumentRequestForm({
                    ...documentRequestForm,
                    submission_deadline: e.target.value
                  })}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Send Request
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowDocumentRequestModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}

    {/* Document Verification Modal */}
    {showDocumentVerificationModal && selectedDocumentForVerification && (
      <div className="blockchain-modal-overlay" onClick={() => setShowDocumentVerificationModal(false)}>
        <div className="blockchain-modal" onClick={(e) => e.stopPropagation()}>
          <div className="blockchain-modal-header">
            <h2>Review Document</h2>
            <button 
              className="blockchain-modal-close" 
              onClick={() => setShowDocumentVerificationModal(false)}
            >
              ×
            </button>
          </div>
          
          <div className="blockchain-modal-content">
            <div className="document-review-info">
              <div className="info-row">
                <span className="info-label">Document Type:</span>
                <span className="info-value">{selectedDocumentForVerification.document_type}</span>
              </div>
              <div className="info-row">
                <span className="info-label">File Name:</span>
                <span className="info-value">{selectedDocumentForVerification.file_name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Uploaded:</span>
                <span className="info-value">{formatDate(selectedDocumentForVerification.uploaded_date)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Size:</span>
                <span className="info-value">{(selectedDocumentForVerification.size / 1024).toFixed(2)} KB</span>
              </div>
            </div>

            <form className="verification-form">
              <div className="form-group">
                <label>Decision *</label>
                <select
                  value={verificationForm.verification_status}
                  onChange={(e) => setVerificationForm({
                    ...verificationForm,
                    verification_status: e.target.value
                  })}
                >
                  <option value="verified">Approve & Sign</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  {verificationForm.verification_status === 'verified' ? 'Notes (Optional)' : 'Rejection Reason *'}
                </label>
                <textarea
                  rows="4"
                  required={verificationForm.verification_status === 'rejected'}
                  placeholder={
                    verificationForm.verification_status === 'verified'
                      ? 'Optional notes about the document'
                      : 'Please provide reason for rejection'
                  }
                  value={verificationForm.verification_notes}
                  onChange={(e) => setVerificationForm({
                    ...verificationForm,
                    verification_notes: e.target.value
                  })}
                />
              </div>

              {verificationForm.verification_status === 'verified' && (
                <div className="signature-notice">
                  <strong>⚠️ Important:</strong> Approving this document will digitally sign it, 
                  making it an official part of the case record. This action cannot be undone.
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button"
                  className={`btn-primary ${
                    verificationForm.verification_status === 'verified' ? 'btn-success' : 'btn-danger'
                  }`}
                  onClick={() => handleVerifyDocument(
                    selectedDocumentForVerification.document_id,
                    verificationForm.verification_status,
                    verificationForm.verification_notes
                  )}
                >
                  {verificationForm.verification_status === 'verified' ? 'Approve & Sign' : 'Reject'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowDocumentVerificationModal(false);
                    setSelectedDocumentForVerification(null);
                    setVerificationForm({
                      verification_status: 'verified',
                      verification_notes: ''
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}
    {/* Direct Document Upload Modal */}
{showDirectUploadModal && (
  <div className="blockchain-modal-overlay" onClick={() => setShowDirectUploadModal(false)}>
    <div className="blockchain-modal" onClick={(e) => e.stopPropagation()}>
      <div className="blockchain-modal-header">
        <h2>Upload Document Directly</h2>
        <button 
          className="blockchain-modal-close" 
          onClick={() => setShowDirectUploadModal(false)}
        >
          ×
        </button>
      </div>
      
      <div className="blockchain-modal-content">
        <form onSubmit={handleDirectDocumentUpload} className="judicial-mgmt__form">
          <div className="judicial-mgmt__form-group">
            <label className="judicial-mgmt__form-label">Document Type *</label>
            <input
              type="text"
              className="judicial-mgmt__form-input"
              required
              placeholder="e.g., Court Order, Evidence, Affidavit"
              value={directDocumentUpload.document_type}
              onChange={(e) => setDirectDocumentUpload({
                ...directDocumentUpload,
                document_type: e.target.value
              })}
            />
          </div>

          <div className="judicial-mgmt__form-group">
            <label className="judicial-mgmt__form-label">Description</label>
            <textarea
              className="judicial-mgmt__form-textarea"
              rows="3"
              placeholder="Brief description of the document"
              value={directDocumentUpload.description}
              onChange={(e) => setDirectDocumentUpload({
                ...directDocumentUpload,
                description: e.target.value
              })}
            />
          </div>

          <div className="judicial-mgmt__form-group">
            <label className="judicial-mgmt__form-label">Select File *</label>
            <input
              type="file"
              id="direct-upload-file"
              className="judicial-mgmt__form-file"
              required
              onChange={(e) => setDirectDocumentUpload({
                ...directDocumentUpload,
                file: e.target.files[0]
              })}
            />
            <p className="judicial-mgmt__form-help">
              Maximum file size: 10MB
            </p>
          </div>

          <div className="judicial-mgmt__form-actions">
            <button type="submit" className="judicial-mgmt__submit-btn">
              Upload & Auto-Verify
            </button>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => {
                setShowDirectUploadModal(false);
                setDirectDocumentUpload({
                  document_type: '',
                  description: '',
                  file: null
                });
              }}
            >
              Cancel
            </button>
          </div>
        </form>
        
        <div className="form-info-box">
          <strong>ℹ️ Note:</strong> Documents uploaded directly by court admin/clerk are 
          automatically verified and digitally signed. No further approval needed.
        </div>
      </div>
    </div>
  </div>
)}
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

                {activeTab === 'blockchain' && (
                  <div className="judicial-mgmt__blockchain-tab">
                    <h3 className="judicial-mgmt__section-title">Blockchain Verification & Audit</h3>
                    
                    <div className="blockchain-case-actions">
                      <button
                        className="blockchain-btn blockchain-btn--audit"
                        onClick={() => fetchAuditTrail(selectedCase.case_num)}
                        disabled={auditLoading}
                      >
                        {auditLoading ? 'Loading...' : 'View Complete Audit Trail'}
                      </button>
                      
                      <button
                        className="blockchain-btn blockchain-btn--verify"
                        onClick={() => investigateTampering(selectedCase.case_num)}
                        disabled={tamperingLoading}
                      >
                        {tamperingLoading ? 'Investigating...' : 'Investigate Tampering'}
                      </button>
                     <AuditTrailReportGenerator 
  caseData={selectedCase}
  onClose={() => {}}
  showLoadingOverlay={showLoadingOverlay}
  hideLoadingOverlay={hideLoadingOverlay}
/>
                    </div>

                    <div className="blockchain-info">
                      <h4>About Blockchain Verification</h4>
                      <p>
                        Every action on this case is recorded in an immutable blockchain ledger. 
                        Use the audit trail to view all historical changes and the tampering investigation 
                        to verify data integrity.
                      </p>
                      <ul>
                        <li>Audit Trail shows complete case history</li>
                        <li>Each entry is cryptographically secured</li>
                        <li>Tampering detection compares blockchain vs database</li>
                        <li>Full transparency and accountability</li>
                      </ul>
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

      {showAuditModal && auditTrail && (
        <div className="blockchain-modal-overlay" onClick={closeAuditModal}>
          <div className="blockchain-modal blockchain-modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="blockchain-modal-header">
              <h2>Audit Trail - Case {auditTrail.case_num}</h2>
              <button className="blockchain-modal-close" onClick={closeAuditModal}>×</button>
            </div>

            <div className="blockchain-modal-content">
              <div className={`verification-status ${auditTrail.blockchain_verified ? 'verified' : 'failed'}`}>
                {auditTrail.blockchain_verified 
                  ? 'Blockchain Verified - All entries authentic'
                  : `Verification Failed: ${auditTrail.blockchain_error}`}
              </div>

              <div className="current-case-data">
                <h3>Current Case Data</h3>
                <div className="data-grid">
                  <div className="data-item">
                    <strong>Status:</strong>
                    <span>{auditTrail.current_case_data?.status}</span>
                  </div>
                  <div className="data-item">
                    <strong>Plaintiff:</strong>
                    <span>{auditTrail.current_case_data?.plaintiff}</span>
                  </div>
                  <div className="data-item">
                    <strong>Respondent:</strong>
                    <span>{auditTrail.current_case_data?.respondent}</span>
                  </div>
                  <div className="data-item">
                    <strong>Approved:</strong>
                    <span>{auditTrail.current_case_data?.case_approved ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              <div className="audit-timeline">
  <h3>Complete History ({auditTrail.total_entries} entries)</h3>
  
  {auditTrail.verification_summary && (
    <div className="verification-summary-box">
      <h4>Verification Summary</h4>
      <div className="summary-stats">
        <span>Total Blocks: {auditTrail.verification_summary.total_blocks}</span>
        <span className="text-success">Verified: {auditTrail.verification_summary.verified_blocks}</span>
        <span className="text-danger">Failed: {auditTrail.verification_summary.failed_blocks}</span>
        <span className="text-warning">Critical: {auditTrail.verification_summary.critical_issues}</span>
      </div>
    </div>
  )}

  {auditTrail.audit_trail?.map((entry, index) => (
    <div key={index} className="audit-entry">
      <div className="audit-marker">{entry.sequence}</div>
      <div className="audit-content">
        <div className="audit-header">
          <span className="audit-action">{entry.action}</span>
          <span className="audit-timestamp">{formatDateTime(entry.timestamp)}</span>
        </div>

        {entry.verification && (
          <div className={`verification-badge ${entry.verification.overall ? 'verified' : 'failed'}`}>
            {entry.verification.overall ? '✅ Verified' : '⚠️ Verification Failed'}
          </div>
        )}

        {entry.verification?.issues && entry.verification.issues.length > 0 && (
          <div className="verification-issues">
            <h5>Issues Detected:</h5>
            <ul>
              {entry.verification.issues.map((issue, idx) => (
                <li key={idx} className={getSeverityClass(issue.severity)}>
                  <strong>{issue.field || issue.layer}:</strong> {issue.error || issue.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="audit-details">
          {Object.entries(entry.details || {}).map(([key, value]) => (
            <div key={key} className="detail-row">
              <span className="detail-key">{key}:</span>
              <span className="detail-value">{value?.toString() || 'N/A'}</span>
            </div>
          ))}
        </div>

        <div className="audit-meta">
          <small>
            By: {entry.performed_by} ({entry.user_type}) | 
            Block: #{entry.block_index} | 
            Hash: {entry.blockchain_hash?.substring(0, 12)}...
          </small>
        </div>

        {entry.ipfs_anchor && (
          <div className="blockchain-proof">
            <a 
              href={entry.ipfs_anchor.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ipfs-link"
            >
              📎 View IPFS Proof
            </a>
          </div>
        )}

        <button
          className="view-details-btn"
          onClick={() => viewDetailedVerification(entry)}
        >
          View Full Verification
        </button>
      </div>
    </div>
  ))}
</div>

            </div>
          </div>
        </div>
      )}

      {showTamperingModal && tamperingReport && (
        <div className="blockchain-modal-overlay" onClick={closeTamperingModal}>
          <div className="blockchain-modal blockchain-modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="blockchain-modal-header">
              <h2>Tampering Investigation - Case {selectedCase.case_num}</h2>
              <button className="blockchain-modal-close" onClick={closeTamperingModal}>×</button>
            </div>

            <div className="blockchain-modal-content">
          {tamperingReport.verification_status === 'VERIFIED' || 
 (tamperingReport.discrepancies && tamperingReport.discrepancies.length === 0) ? (
  <div className="alert alert-success">
    ✅ No discrepancies found between blockchain and database.
    The case data is intact and verified.
    <div className="integrity-score">
      Integrity Score: {tamperingReport.blockchain_integrity?.integrity_score || '100'}%
    </div>
  </div>
) : (
  <>
    <div className="alert alert-danger">
      ⚠️ {tamperingReport.discrepancy_count || tamperingReport.discrepancies?.length || 0} Discrepancy(ies) Detected
      <div className="verification-status-badge">
        Status: {tamperingReport.verification_status}
      </div>
    </div>

    {tamperingReport.blockchain_integrity?.tampering_patterns && 
     tamperingReport.blockchain_integrity.tampering_patterns.length > 0 && (
      <div className="tampering-patterns-summary">
        <h3>Tampering Patterns Identified</h3>
        {tamperingReport.blockchain_integrity.tampering_patterns.map((pattern, idx) => (
          <div key={idx} className="pattern-summary">
            <strong>Block #{pattern.blockIndex}:</strong>
            <ul>
              {pattern.patterns.map((p, i) => (
                <li key={i} className={getSeverityClass(p.riskLevel)}>
                  {p.type}: {p.description}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )}

    <div className="comparison-table-container">
      <table className="comparison-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Blockchain (Original)</th>
            <th>Database (Current)</th>
            <th>Severity</th>
            <th>Block Index</th>
          </tr>
        </thead>
        <tbody>
          {tamperingReport.discrepancies?.map((discrepancy, index) => (
            <tr key={index} className={getSeverityClass(discrepancy.severity)}>
              <td><strong>{discrepancy.field}</strong></td>
              <td className="blockchain-value">{discrepancy.blockchain_value?.toString() || 'N/A'}</td>
              <td className="database-value">{discrepancy.database_value?.toString() || 'N/A'}</td>
              <td>
                <span className={`severity-badge ${getSeverityClass(discrepancy.severity)}`}>
                  {discrepancy.severity}
                </span>
              </td>
              <td>#{discrepancy.block_index || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {tamperingReport.blockchain_integrity && (
      <div className="blockchain-integrity-details">
        <h3>Blockchain Integrity Analysis</h3>
        <div className="integrity-grid">
          <div className="integrity-item">
            <strong>Total Blocks:</strong>
            <span>{tamperingReport.blockchain_integrity.total_blocks}</span>
          </div>
          <div className="integrity-item">
            <strong>Verified Blocks:</strong>
            <span className="text-success">{tamperingReport.blockchain_integrity.verification_summary?.allLayersValid}</span>
          </div>
          <div className="integrity-item">
            <strong>Failed Blocks:</strong>
            <span className="text-danger">{tamperingReport.blockchain_integrity.verification_summary?.invalid}</span>
          </div>
        </div>
      </div>
    )}

    <div className="recommended-actions">
      <h3>Recommended Actions:</h3>
      <ul>
        <li> Lock case for editing to prevent further modifications</li>
        <li>Notify senior administrator about the discrepancies</li>
        <li>Create detailed incident report with screenshots</li>
        <li>Consider restoring data from blockchain records</li>
        <li> Review access logs for unauthorized changes</li>
        <li> If CRITICAL severity, escalate to system security team immediately</li>
      </ul>
    </div>
  </>
)}
              {tamperingReport.blockchain_history && (
                <div className="blockchain-history-section">
                  <h3>Blockchain History Summary</h3>
                  <p>Total blockchain entries: {tamperingReport.blockchain_history.length}</p>
                  <p>Last verified: {formatDateTime(new Date())}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showFullScanModal && fullScanResult && (
        <div className="blockchain-modal-overlay" onClick={closeFullScanModal}>
          <div className="blockchain-modal blockchain-modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="blockchain-modal-header">
              <h2>Full Blockchain System Scan</h2>
              <button className="blockchain-modal-close" onClick={closeFullScanModal}>×</button>
            </div>

            <div className="blockchain-modal-content">
              <div className={`scan-result-badge scan-result-${fullScanResult.scan_result?.toLowerCase()}`}>
                Scan Result: {fullScanResult.scan_result}
              </div>

              <div className="scan-summary">
                <h3>Scan Summary</h3>
                <div className="scan-stats-grid">
                  <div className="scan-stat">
                    <span className="scan-stat-value">{fullScanResult.scan_summary?.total_cases_scanned}</span>
                    <span className="scan-stat-label">Cases Scanned</span>
                  </div>
                  <div className="scan-stat">
                    <span className="scan-stat-value">{fullScanResult.scan_summary?.valid_cases}</span>
                    <span className="scan-stat-label">Valid Cases</span>
                  </div>
                  <div className="scan-stat">
                    <span className="scan-stat-value scan-stat-value--critical">
                      {fullScanResult.scan_summary?.cases_with_critical_issues}
                    </span>
                    <span className="scan-stat-label">Critical Issues</span>
                  </div>
                  <div className="scan-stat">
                    <span className="scan-stat-value scan-stat-value--high">
                      {fullScanResult.scan_summary?.cases_with_high_issues}
                    </span>
                    <span className="scan-stat-label">High Issues</span>
                  </div>
                </div>
              </div>

              <div className="blockchain-integrity-summary">
                <h3>Blockchain Integrity</h3>
                <div className="integrity-grid">
                  <div className="integrity-item">
                    <strong>Chain Valid:</strong>
                    <span className={fullScanResult.blockchain_integrity?.chain_valid ? 'text-success' : 'text-danger'}>
                      {fullScanResult.blockchain_integrity?.chain_valid ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="integrity-item">
                    <strong>Integrity Score:</strong>
                    <span>{fullScanResult.blockchain_integrity?.integrity_score}%</span>
                  </div>
                  <div className="integrity-item">
                    <strong>Total Blocks:</strong>
                    <span>{fullScanResult.blockchain_integrity?.total_blocks}</span>
                  </div>
                  <div className="integrity-item">
                    <strong>Verified Blocks:</strong>
                    <span>{fullScanResult.blockchain_integrity?.verified_blocks}</span>
                  </div>
                </div>
              </div>

              {fullScanResult.issues && fullScanResult.issues.length > 0 && (
                <div className="issues-section">
                  <h3>Issues Found ({fullScanResult.issues.length})</h3>
                  <div className="issues-list">
                    {fullScanResult.issues.map((issue, index) => (
                      <div key={index} className={`issue-card ${getSeverityClass(issue.severity)}`}>
                        <div className="issue-header">
                          <span className="issue-case">{issue.case_num}</span>
                          <span className={`severity-badge ${getSeverityClass(issue.severity)}`}>
                            {issue.severity}
                          </span>
                        </div>
                        <div className="issue-body">
                          <p className="issue-type">{issue.issue_type}</p>
                          <p className="issue-description">{issue.description}</p>
                          {issue.plaintiff && <p className="issue-plaintiff">Plaintiff: {issue.plaintiff}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="scan-recommendation">
                <h3>Recommendation</h3>
                <p>{fullScanResult.recommendation}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAlertsModal && securityAlerts && (
        <div className="blockchain-modal-overlay" onClick={closeAlertsModal}>
          <div className="blockchain-modal blockchain-modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="blockchain-modal-header">
              <h2>Security Alerts</h2>
              <button className="blockchain-modal-close" onClick={closeAlertsModal}>×</button>
            </div>

            <div className="blockchain-modal-content">
              <div className="alerts-summary">
                <h3>Alerts Summary</h3>
                <div className="alerts-stats-grid">
                  <div className="alert-stat">
                    <span className="alert-stat-value">{securityAlerts.total_alerts}</span>
                    <span className="alert-stat-label">Total Alerts</span>
                  </div>
                  <div className="alert-stat">
                    <span className="alert-stat-value alert-stat-value--critical">
                      {securityAlerts.critical_alerts}
                    </span>
                    <span className="alert-stat-label">Critical</span>
                  </div>
                  <div className="alert-stat">
                    <span className="alert-stat-value alert-stat-value--high">
                      {securityAlerts.high_alerts}
                    </span>
                    <span className="alert-stat-label">High</span>
                  </div>
                  <div className="alert-stat">
                    <span className="alert-stat-value alert-stat-value--medium">
                      {securityAlerts.medium_alerts}
                    </span>
                    <span className="alert-stat-label">Medium</span>
                  </div>
                </div>
              </div>

              {securityAlerts.alerts && securityAlerts.alerts.length > 0 ? (
                <div className="alerts-list">
                  <h3>Active Alerts</h3>
                  {securityAlerts.alerts.map((alert, index) => (
                    <div key={index} className={`alert-card ${getSeverityClass(alert.severity)}`}>
                      <div className="alert-header">
                        <span className={`severity-badge ${getSeverityClass(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className="alert-timestamp">{formatDateTime(alert.timestamp)}</span>
                      </div>
                      <div className="alert-body">
                        <h4 className="alert-title">{alert.title}</h4>
                        <p className="alert-message">{alert.message}</p>
                        {alert.case_num && (
                          <p className="alert-case">Case: {alert.case_num}</p>
                        )}
                        <p className="alert-action">
                          <strong>Action Required:</strong> {alert.action_required}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alert alert-success">
                  No security alerts at this time. All systems are operating normally.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="judicial-mgmt__error-toast">
          <p className="judicial-mgmt__error-message">{error}</p>
          <button className="judicial-mgmt__error-close" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}
      {showVerificationModal && verificationDetails && (
  <div className="blockchain-modal-overlay" onClick={closeVerificationModal}>
    <div className="blockchain-modal blockchain-modal--large" onClick={(e) => e.stopPropagation()}>
      <div className="blockchain-modal-header">
        <h2>Detailed Verification - Block #{verificationDetails.entry.block_index}</h2>
        <button className="blockchain-modal-close" onClick={closeVerificationModal}>×</button>
      </div>

      <div className="blockchain-modal-content">
        <div className="verification-overview">
          <h3>Block Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <strong>Action:</strong>
              <span>{verificationDetails.entry.action}</span>
            </div>
            <div className="info-item">
              <strong>Timestamp:</strong>
              <span>{formatDateTime(verificationDetails.entry.timestamp)}</span>
            </div>
            <div className="info-item">
              <strong>Block Hash:</strong>
              <span className="hash-display">{verificationDetails.entry.blockchain_hash}</span>
            </div>
            <div className="info-item">
              <strong>Previous Hash:</strong>
              <span className="hash-display">{verificationDetails.entry.previous_hash}</span>
            </div>
          </div>
        </div>

        {verificationDetails.details.layers && (
          <div className="verification-layers">
            <h3>Multi-Layer Verification Results</h3>
            
            <div className="layer-results">
              {Object.entries(verificationDetails.details.layers).map(([layerName, layerResult]) => (
                <div key={layerName} className={`layer-card ${layerResult.valid ? 'valid' : 'invalid'}`}>
                  <div className="layer-header">
                    <h4>{layerName.replace(/([A-Z])/g, ' $1').toUpperCase()}</h4>
                    <span className={`layer-status ${layerResult.valid ? 'success' : 'failed'}`}>
                      {layerResult.valid ? '✅ VALID' : '❌ FAILED'}
                    </span>
                  </div>
                  
                  {!layerResult.valid && (
                    <div className="layer-error">
                      <strong>Error:</strong> {layerResult.error}
                      {layerResult.severity && (
                        <span className={`severity-badge ${getSeverityClass(layerResult.severity)}`}>
                          {layerResult.severity}
                        </span>
                      )}
                    </div>
                  )}

                  {layerResult.details && (
                    <div className="layer-details">
                      <pre>{JSON.stringify(layerResult.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {verificationDetails.details.tamperingPatterns && 
         verificationDetails.details.tamperingPatterns.detected && 
         verificationDetails.details.tamperingPatterns.detected.length > 0 && (
          <div className="tampering-patterns">
            <h3>⚠️ Tampering Patterns Detected</h3>
            {verificationDetails.details.tamperingPatterns.detected.map((pattern, idx) => (
              <div key={idx} className={`pattern-card ${getSeverityClass(pattern.riskLevel)}`}>
                <h4>{pattern.type}</h4>
                <p>{pattern.description}</p>
                <div className="pattern-indicators">
                  <strong>Indicators:</strong>
                  <ul>
                    {pattern.indicators?.map((indicator, i) => (
                      <li key={i}>{indicator}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="verification-actions">
          <button className="btn-primary" onClick={closeVerificationModal}>
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
)}
{/* Loading Overlay */}
<JudicialLoadingOverlay
  isVisible={loadingOverlay.visible}
  loadingType={loadingOverlay.type}
  progress={loadingOverlay.progress}
  message={loadingOverlay.message}
/>
    </div>
  );
};

export default CourtAdminCase;