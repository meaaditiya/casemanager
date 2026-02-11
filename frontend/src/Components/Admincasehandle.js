import React, { useRef,useState, useEffect } from 'react';
import axios from 'axios';
import '../ComponentsCSS/Admincasehandle.css';

const AdminCaseManagement = () => {
  // State management
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCaseType, setFilterCaseType] = useState('');
  
  // Selected case and hearing states
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedTab, setSelectedTab] = useState('details');
  const [isRichTextMode, setIsRichTextMode] = useState(false);
  const textareaRef = useRef(null);
  // Form states for adding/updating hearings
 const [hearingForm, setHearingForm] = useState({
    hearing_date: '',
    hearing_type: 'Initial',
    remarks: '',
    next_hearing_date: '',
    attachments: [],
    sign_hearing: false // New field for digital signature
  });
  // Case status update form
  const [statusForm, setStatusForm] = useState({
    status: '',
    remarks: ''
  });

  // Document upload form
  const [documentForm, setDocumentForm] = useState({
    document_type: '',
    file: null,
    description: ''
  });

  // Office use form for updating administrative details
  const [officeUseForm, setOfficeUseForm] = useState({
    filing_no: '',
    filing_date: '',
    objection_red_date: '',
    objection_compliance_date: '',
    registration_no: '',
    registration_date: '',
    listing_date: '',
    court_allotted: '',
    allocation_date: '',
    case_code: '',
    filing_done_by: '',
    objection_raised_by: '',
    registration_done_by: '',
    allocation_done_by: ''
  });
const [documentRequestForm, setDocumentRequestForm] = useState({
  document_type: '',
  description: '',
  requested_from: '',
  requested_from_type: '', // 'litigant' or 'advocate'
  submission_deadline: ''
});
const [requestingDocument, setRequestingDocument] = useState(false);
const [showRequestForm, setShowRequestForm] = useState(false);
  // Fetch all cases assigned to admin's district
  
  useEffect(() => {
    const fetchCases = async () => {
        try {
          setLoading(true);
          
          // Get token with explicit error handling
          const token = localStorage.getItem('token');
          
          if (!token) {
            throw new Error('Authentication token not found. Please login again.');
          }
          
          console.log('Using token:', token.substring(0, 10) + '...');
          
          const response = await axios.get('http://localhost:5000/api/cases/admin', {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          setCases(response.data.cases);
          setFilteredCases(response.data.cases);
          setLoading(false);
        } catch (err) {
          console.error('Full error object:', err);
          
          if (!localStorage.getItem('token')) {
            setError('No authentication token found. Please login again.');
          } else if (err.response && err.response.status === 403) {
            setError('Access denied: Only court administrators can view this data');
          } else if (err.response && err.response.status === 401) {
            setError('Authentication failed. Please login again.');
            // Clear invalid token
            localStorage.removeItem('token');
            // Redirect to login page
            setTimeout(() => {
              window.location.href = '/login'; // Adjust path as needed
            }, 2000);
          } else {
            setError(`Failed to fetch cases: ${err.response?.data?.message || err.message}`);
          }
          
          setLoading(false);
        }
      };

    fetchCases();
  }, []);
  useEffect(() => {
    const fetchCases = async () => {
      try {
        // Same as above
      } catch (err) {
        if (err.response && err.response.status === 403) {
          setError('You need administrator privileges to view this page');
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            window.location.href = '/dashboard'; // Change this to your appropriate route
          }, 3000);
        } else {
          setError(`Failed to fetch cases: ${err.response?.data?.message || err.message}`);
        }
        setLoading(false);
      }
    };
  
    fetchCases();
  }, []);
  // Filter cases based on search term and filters
  useEffect(() => {
    let result = [...cases];
    
    if (searchTerm) {
      result = result.filter(
        case_ => 
          case_.case_num.toLowerCase().includes(searchTerm.toLowerCase()) ||
          case_.plaintiff_details.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          case_.respondent_details.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus) {
      result = result.filter(case_ => case_.status === filterStatus);
    }
    
    if (filterCaseType) {
      result = result.filter(case_ => case_.case_type === filterCaseType);
    }
    
    setFilteredCases(result);
  }, [searchTerm, filterStatus, filterCaseType, cases]);

  // Handle case selection
  const handleCaseSelect = (case_) => {
    setSelectedCase(case_);
    setSelectedTab('details');
    
    // Reset forms
    setHearingForm({
      hearing_date: '',
      hearing_type: 'Initial',
      remarks: '',
      next_hearing_date: '',
      attachments: []
    });
    
    setStatusForm({
      status: case_.status,
      remarks: ''
    });

    setDocumentForm({
      document_type: '',
      file: null,
      description: ''
    });

    // Initialize office use form with existing data if available
    if (case_.for_office_use_only) {
      setOfficeUseForm({
        filing_no: case_.for_office_use_only.filing_no || '',
        filing_date: case_.for_office_use_only.filing_date ? new Date(case_.for_office_use_only.filing_date).toISOString().split('T')[0] : '',
        objection_red_date: case_.for_office_use_only.objection_red_date ? new Date(case_.for_office_use_only.objection_red_date).toISOString().split('T')[0] : '',
        objection_compliance_date: case_.for_office_use_only.objection_compliance_date ? new Date(case_.for_office_use_only.objection_compliance_date).toISOString().split('T')[0] : '',
        registration_no: case_.for_office_use_only.registration_no || '',
        registration_date: case_.for_office_use_only.registration_date ? new Date(case_.for_office_use_only.registration_date).toISOString().split('T')[0] : '',
        listing_date: case_.for_office_use_only.listing_date ? new Date(case_.for_office_use_only.listing_date).toISOString().split('T')[0] : '',
        court_allotted: case_.for_office_use_only.court_allotted || '',
        allocation_date: case_.for_office_use_only.allocation_date ? new Date(case_.for_office_use_only.allocation_date).toISOString().split('T')[0] : '',
        case_code: case_.for_office_use_only.case_code || '',
        filing_done_by: case_.for_office_use_only.filing_done_by || '',
        objection_raised_by: case_.for_office_use_only.objection_raised_by || '',
        registration_done_by: case_.for_office_use_only.registration_done_by || '',
        allocation_done_by: case_.for_office_use_only.allocation_done_by || ''
      });
    } else {
      setOfficeUseForm({
        filing_no: '',
        filing_date: '',
        objection_red_date: '',
        objection_compliance_date: '',
        registration_no: '',
        registration_date: '',
        listing_date: '',
        court_allotted: '',
        allocation_date: '',
        case_code: '',
        filing_done_by: '',
        objection_raised_by: '',
        registration_done_by: '',
        allocation_done_by: ''
      });
    }
  };
const handleDocumentRequest = async (e) => {
  e.preventDefault();
  
  if (!documentRequestForm.document_type || !documentRequestForm.requested_from || 
      !documentRequestForm.requested_from_type || !documentRequestForm.submission_deadline) {
    alert('Please fill in all required fields');
    return;
  }

  setRequestingDocument(true);
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `http://localhost:5000/api/courtadmin/case/${selectedCase.case_num}/request-document`,
      {
        document_type: documentRequestForm.document_type,
        description: documentRequestForm.description,
        requested_from: documentRequestForm.requested_from,
        requested_from_type: documentRequestForm.requested_from_type,
        submission_deadline: documentRequestForm.submission_deadline
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    alert('Document request sent successfully');
    
    // Reset form
    setDocumentRequestForm({
      document_type: '',
      description: '',
      requested_from: '',
      requested_from_type: '',
      submission_deadline: ''
    });
    setShowRequestForm(false);

  } catch (err) {
    alert(`Error requesting document: ${err.response?.data?.message || err.message}`);
    console.error('Error requesting document:', err);
  } finally {
    setRequestingDocument(false);
  }
};
  // Handle case approval
  const handleCaseApproval = async (approve) => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/case/${selectedCase.case_num}/approve`,
        { case_approved: approve },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      
      // Update cases list
      setCases(cases.map(c => 
        c.case_num === selectedCase.case_num 
          ? { ...c, case_approved: approve } 
          : c
      ));
      
      // Update selected case
      setSelectedCase({ ...selectedCase, case_approved: approve });
      
      alert(`Case ${approve ? 'approved' : 'rejected'} successfully`);
    } catch (err) {
      setError(`Failed to ${approve ? 'approve' : 'reject'} case`);
      console.error(`Error ${approve ? 'approving' : 'rejecting'} case:`, err);
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
    
    setHearingForm({
      ...hearingForm,
      remarks: newText
    });

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + before.length + selectedText.length;
    }, 0);
  };

  // Render rich text editor toolbar
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
          setHearingForm({ ...hearingForm, remarks: newText });
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

  // Render hearing item with proper HTML rendering
  const renderHearingItem = (hearing, index) => (
    <div key={index} className="admin-hearing-item">
      <div className="admin-hearing-header">
        <div className="admin-hearing-date">
          {new Date(hearing.hearing_date).toLocaleDateString()}
        </div>
        <div className="admin-hearing-type">
          {hearing.hearing_type}
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
      
      {hearing.remarks && (
        <div 
          className="admin-hearing-remarks"
          // Render HTML content safely
          dangerouslySetInnerHTML={{ __html: hearing.remarks }}
        />
      )}
      
      {hearing.next_hearing_date && (
        <div className="admin-hearing-next-date">
          Next Hearing: {new Date(hearing.next_hearing_date).toLocaleDateString()}
        </div>
      )}
      
      {hearing.digital_signature && hearing.digital_signature.is_signed && (
        <div className="admin-hearing-signature-info">
          <div className="signature-details">
            <span className="signature-label">Signed by:</span>
            <span className="signature-value">{hearing.digital_signature.signed_by_name}</span>
          </div>
          <div className="signature-details">
            <span className="signature-label">Signed on:</span>
            <span className="signature-value">
              {new Date(hearing.digital_signature.signature_timestamp).toLocaleString()}
            </span>
          </div>
          <button
            className="admin-btn small verify-btn"
            onClick={() => verifyHearingSignature(hearing._id)}
          >
            Verify Signature
          </button>
        </div>
      )}
      
      {hearing.attachments && hearing.attachments.length > 0 && (
        <div className="admin-hearing-attachments">
          <strong>Attachments:</strong>
          <ul>
            {hearing.attachments.map((att, idx) => (
              <li key={idx}>{att.originalname}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="admin-hearing-actions">
        {!hearing.digital_signature?.is_signed && (
          <button 
            className="admin-btn small sign-btn"
            onClick={() => signHearing(hearing._id)}
          >
            Sign Digitally
          </button>
        )}
      </div>
    </div>
  );

  // Function to sign a hearing
  const signHearing = async (hearingId) => {
    try {
      if (!window.confirm('Are you sure you want to digitally sign this hearing? This action cannot be undone.')) {
        return;
      }

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

      alert('Hearing signed successfully');
    } catch (err) {
      console.error('Error signing hearing:', err);
      alert('Failed to sign hearing');
    }
  };

  // Function to verify hearing signature
  const verifyHearingSignature = async (hearingId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/case/${selectedCase.case_num}/hearing/${hearingId}/verify-signature`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );

      const { verification } = response.data;
      
      if (verification.valid) {
        alert(`✓ Signature Valid\n\nSigned by: ${verification.signed_by}\nSigned on: ${new Date(verification.signed_at).toLocaleString()}`);
      } else {
        alert(`✗ Signature Invalid\n\n${verification.message}`);
      }
    } catch (err) {
      console.error('Error verifying signature:', err);
      alert('Failed to verify signature');
    }
  };
  // Handle status update
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/case/${selectedCase.case_num}/status`,
        statusForm,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      
      // Update cases list
      setCases(cases.map(c => 
        c.case_num === selectedCase.case_num 
          ? { ...c, status: statusForm.status } 
          : c
      ));
      
      // Update selected case
      setSelectedCase({ ...selectedCase, status: statusForm.status });
      
      alert('Case status updated successfully');
    } catch (err) {
      setError('Failed to update case status');
      console.error('Error updating case status:', err);
    }
  };

  // Handle hearing form changes
  const handleHearingChange = (e) => {
    const { name, value } = e.target;
    setHearingForm({
      ...hearingForm,
      [name]: value
    });
  };

  // Handle file attachment
  const handleFileChange = (e) => {
    setHearingForm({
      ...hearingForm,
      attachments: [...e.target.files]
    });
  };

  // Handle document form changes
  const handleDocumentFormChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'file') {
      setDocumentForm({
        ...documentForm,
        file: files[0]
      });
    } else {
      setDocumentForm({
        ...documentForm,
        [name]: value
      });
    }
  };

  // Handle office use form changes
  const handleOfficeUseFormChange = (e) => {
    const { name, value } = e.target;
    setOfficeUseForm({
      ...officeUseForm,
      [name]: value
    });
  };

  // Handle hearing submission
  const handleHearingSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('hearing_date', hearingForm.hearing_date);
      formData.append('hearing_type', hearingForm.hearing_type);
      formData.append('remarks', hearingForm.remarks);
      
      if (hearingForm.next_hearing_date) {
        formData.append('next_hearing_date', hearingForm.next_hearing_date);
      }
      
      // Append each attachment
      if (hearingForm.attachments && hearingForm.attachments.length > 0) {
        for (let i = 0; i < hearingForm.attachments.length; i++) {
          formData.append('attachments', hearingForm.attachments[i]);
        }
      }
      
      const response = await axios.post(
        `http://localhost:5000/api/case/${selectedCase.case_num}/hearing`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Update selected case with new hearing
      const updatedCase = { 
        ...selectedCase, 
        hearings: [...(selectedCase.hearings || []), response.data.hearing] 
      };
      
      // Update cases list
      setCases(cases.map(c => 
        c.case_num === selectedCase.case_num ? updatedCase : c
      ));
      
      // Update selected case
      setSelectedCase(updatedCase);
      
      // Reset form
      setHearingForm({
        hearing_date: '',
        hearing_type: 'Initial',
        remarks: '',
        next_hearing_date: '',
        attachments: []
      });
      
      alert('Hearing added successfully');
    } catch (err) {
      setError('Failed to add hearing');
      console.error('Error adding hearing:', err);
    }
  };
  // Handle document submission
  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validations
      if (!documentForm.file) {
        alert('Please select a file to upload');
        return;
      }
      
      if (!documentForm.document_type) {
        alert('Document type is required');
        return;
      }
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', documentForm.file);
      formData.append('document_type', documentForm.document_type);
      formData.append('description', documentForm.description || '');
      
      // Get user information from wherever it's stored
      const token = localStorage.getItem('token');
      
      // Try different ways to include the user ID - simplified to one approach
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (userData.id) {
        formData.append('uploaded_by', userData.id);
      }
      
      console.log('Form data being sent:');
      for (let [key, value] of formData.entries()) {
        console.log(key, ':', value instanceof File ? value.name : value);
      }
      
      // Make the request
      const response = await axios({
        method: 'POST',
       url: `http://localhost:5000/api/courtadmin/case/${selectedCase.case_num}/upload-document`,
        data: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Upload successful:', response.data);
      
      // DEBUG: Log the document ID from the server response
      console.log('Document ID from server response:', response.data.document.document_id);
      console.log('Document _id from server response:', response.data.document._id);
      
      // Handle successful response
      if (response.data && response.data.document) {
        // Store the document with the exact id properties from the server
        const newDocument = response.data.document;
        
        // Ensure the document has consistent ID property for download
        // Use document_id as the primary ID field used for API calls
        if (!newDocument.document_id && newDocument._id) {
          newDocument.document_id = newDocument._id;
        }
        
        // Create updated case with new document
        const updatedCase = {
          ...selectedCase,
          documents: selectedCase.documents ?
            [...selectedCase.documents, newDocument] :
            [newDocument]
        };
        
        // Update state
        setSelectedCase(updatedCase);
        setCases(prevCases =>
          prevCases.map(c =>
            c.case_num === selectedCase.case_num ? updatedCase : c
          )
        );
        
        // Reset form
        setDocumentForm({
          document_type: '',
          description: '',
          file: null
        });
        
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
        
        alert('Document uploaded successfully');
      }
    } catch (err) {
      console.error('Upload error details:', err.response?.data || err.message);
      
      alert(`Error uploading document: ${err.response?.data?.message || err.response?.data?.error || err.message}`);
    }
  };
  
  // Document download handler
 // Fixed document download handler to preserve original file format
const handleDocumentDownload = async (documentId) => {
  try {
    // Log the document ID being used for download
    console.log('Document ID being used for download:', documentId);
    
    const token = localStorage.getItem('token');
    
    // Download request with proper headers and response type
    const response = await axios({
      method: 'GET',
      url: `http://localhost:5000/api/document/${documentId}/download`,
      responseType: 'blob', // Critical for binary file handling
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // The key to preserving the file format is creating a blob with the proper type
    // Extract the content type from the response
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    
    // Create a blob with the correct content type
    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    
    // Create and trigger download link
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from content-disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'document';
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
        // Decode if the filename is URL encoded
        filename = decodeURIComponent(filename);
      }
    }
    
    // Set download attribute and filename
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    link.remove();
  } catch (err) {
    console.error('Download error:', err);
    
    // Improved error message with details
    const errorMessage = err.response?.data?.message || err.message;
    alert(`Error downloading document: ${errorMessage}`);
  }
};
  
  // Handle office use details update
  const handleOfficeUseSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/case/${selectedCase.case_num}/office-details`,
        officeUseForm,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      
      // Update cases list
      const updatedCase = { 
        ...selectedCase, 
        for_office_use_only: response.data.for_office_use_only 
      };
      
      setCases(cases.map(c => 
        c.case_num === selectedCase.case_num ? updatedCase : c
      ));
      
      // Update selected case
      setSelectedCase(updatedCase);
      
      alert('Office details updated successfully');
    } catch (err) {
      setError('Failed to update office details');
      console.error('Error updating office details:', err);
    }
  };

  // Handle hearing update
  const handleHearingUpdate = async (hearingId, updatedData) => {
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('hearing_date', updatedData.hearing_date);
      formData.append('hearing_type', updatedData.hearing_type);
      formData.append('remarks', updatedData.remarks || '');
      
      if (updatedData.next_hearing_date) {
        formData.append('next_hearing_date', updatedData.next_hearing_date);
      }
      
      // Append each attachment if any
      if (updatedData.attachments && updatedData.attachments.length > 0) {
        for (let i = 0; i < updatedData.attachments.length; i++) {
          formData.append('attachments', updatedData.attachments[i]);
        }
      }
      
      const response = await axios.patch(
        `http://localhost:5000/api/case/${selectedCase.case_num}/hearing/${hearingId}`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Find and update the specific hearing in the case
      const updatedHearings = selectedCase.hearings.map(hearing => 
        hearing._id === hearingId ? response.data.hearing : hearing
      );
      
      // Update selected case with updated hearing
      const updatedCase = { 
        ...selectedCase, 
        hearings: updatedHearings 
      };
      
      // Update cases list
      setCases(cases.map(c => 
        c.case_num === selectedCase.case_num ? updatedCase : c
      ));
      
      // Update selected case
      setSelectedCase(updatedCase);
      
      alert('Hearing updated successfully');
    } catch (err) {
      setError('Failed to update hearing');
      console.error('Error updating hearing:', err);
    }
  };
  const handleAddAttachments = async (hearingId, files) => {
    try {
      // Validate files
      if (!files || files.length === 0) {
        alert('Please select files to upload');
        return;
      }
      
      // Create FormData
      const formData = new FormData();
      
      // Append each file
      for (let i = 0; i < files.length; i++) {
        formData.append('attachments', files[i]);
      }
      
      const response = await axios.post(
        `http://localhost:5000/api/case/${selectedCase.case_num}/hearing/${hearingId}/attachments`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Find and update the specific hearing in the case
      const updatedHearings = selectedCase.hearings.map(hearing => {
        if (hearing._id === hearingId) {
          return {
            ...hearing,
            attachments: response.data.attachments
          };
        }
        return hearing;
      });
      
      // Update selected case with updated hearing
      const updatedCase = { 
        ...selectedCase, 
        hearings: updatedHearings 
      };
      
      // Update cases list
      setCases(cases.map(c => 
        c.case_num === selectedCase.case_num ? updatedCase : c
      ));
      
      // Update selected case
      setSelectedCase(updatedCase);
      
      alert('Attachments added successfully');
    } catch (err) {
      setError('Failed to add attachments');
      console.error('Error adding attachments:', err);
    }
  };
  // Handle document download
  
  // Render loading state
  if (loading) {
    return <div className="admin-loading">Loading cases...</div>;
  }

  // Render error state
  if (error) {
    return <div className="admin-error">{error}</div>;
  }

  return (
    <div className="admin-case-management">
      <div className="admin-sidebar">
        <h2>Case Management</h2>
        
        <div className="admin-filters">
          <input
            type="text"
            placeholder="Search by case number or party name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search"
          />
          
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="admin-select"
          >
            <option value="">All Statuses</option>
            <option value="Filed">Filed</option>
            <option value="Pending">Pending</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Hearing in Progress">Hearing in Progress</option>
            <option value="Awaiting Judgment">Awaiting Judgment</option>
            <option value="Disposed">Disposed</option>
            <option value="Appealed">Appealed</option>
          </select>
          
          <select 
            value={filterCaseType} 
            onChange={(e) => setFilterCaseType(e.target.value)}
            className="admin-select"
          >
            <option value="">All Case Types</option>
            <option value="Civil">Civil</option>
            <option value="Criminal">Criminal</option>
          </select>
        </div>
        
        <div className="admin-cases-list">
          {filteredCases.length === 0 ? (
            <div className="admin-no-cases">No cases found</div>
          ) : (
            filteredCases.map(case_ => (
              <div 
                key={case_.case_num} 
                className={`admin-case-item ${selectedCase && selectedCase.case_num === case_.case_num ? 'selected' : ''}`}
                onClick={() => handleCaseSelect(case_)}
              >
                <div className="admin-case-number">{case_.case_num}</div>
                <div className="admin-case-info">
                  <div className="admin-case-title">
                    {case_.plaintiff_details.name} vs. {case_.respondent_details.name}
                  </div>
                  <div className="admin-case-meta">
                    <span className={`admin-case-status status-${case_.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {case_.status}
                    </span>
                    <span className="admin-case-type">{case_.case_type}</span>
                  </div>
                  <div className="admin-case-approval">
                    {case_.case_approved ? 
                      <span className="approval-badge approved">Approved</span> : 
                      <span className="approval-badge pending">Pending Approval</span>
                    }
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="admin-content">
        {!selectedCase ? (
          <div className="admin-select-case">
            <h3>Select a case to view details</h3>
          </div>
        ) : (
          <div className="admin-case-details">
            <div className="admin-case-header">
              <h2>Case {selectedCase.case_num}</h2>
              <div className="admin-approval-actions">
                {!selectedCase.case_approved ? (
                  <>
                    <button 
                      className="admin-btn approve"
                      onClick={() => handleCaseApproval(true)}
                    >
                      Approve Case
                    </button>
                    <button 
                      className="admin-btn reject"
                      onClick={() => handleCaseApproval(false)}
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <span className="approval-badge large approved">Case Approved</span>
                )}
              </div>
            </div>
            
            <div className="admin-tabs">
              <button 
                className={`admin-tab ${selectedTab === 'details' ? 'active' : ''}`}
                onClick={() => setSelectedTab('details')}
              >
                Case Details
              </button>
              <button 
                className={`admin-tab ${selectedTab === 'hearings' ? 'active' : ''}`}
                onClick={() => setSelectedTab('hearings')}
              >
                Hearings
              </button>
              <button 
                className={`admin-tab ${selectedTab === 'status' ? 'active' : ''}`}
                onClick={() => setSelectedTab('status')}
              >
                Update Status
              </button>
              <button 
                className={`admin-tab ${selectedTab === 'documents' ? 'active' : ''}`}
                onClick={() => setSelectedTab('documents')}
              >
                Documents
              </button>
              <button 
                className={`admin-tab ${selectedTab === 'office' ? 'active' : ''}`}
                onClick={() => setSelectedTab('office')}
              >
                Office Use
              </button>
            </div>
            
            {selectedTab === 'details' && (
              <div className="admin-tab-content">
                <div className="admin-case-section">
                  <h3>Case Information</h3>
                  <div className="admin-detail-row">
                    <div className="admin-detail-label">Case Number:</div>
                    <div className="admin-detail-value">{selectedCase.case_num}</div>
                  </div>
                  <div className="admin-detail-row">
                    <div className="admin-detail-label">Case Type:</div>
                    <div className="admin-detail-value">{selectedCase.case_type}</div>
                  </div>
                  <div className="admin-detail-row">
                    <div className="admin-detail-label">Court:</div>
                    <div className="admin-detail-value">{selectedCase.court}</div>
                  </div>
                  <div className="admin-detail-row">
                    <div className="admin-detail-label">Status:</div>
                    <div className="admin-detail-value">{selectedCase.status}</div>
                  </div>
                  <div className="admin-detail-row">
                    <div className="admin-detail-label">Filing Date:</div>
                    <div className="admin-detail-value">{new Date(selectedCase.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                
                <div className="admin-case-section">
                  <h3>Plaintiff Details</h3>
                  <div className="admin-detail-row">
                    <div className="admin-detail-label">Name:</div>
                    <div className="admin-detail-value">{selectedCase.plaintiff_details.name}</div>
                  </div>
                  <div className="admin-detail-row">
                    <div className="admin-detail-label">Address:</div>
                    <div className="admin-detail-value">{selectedCase.plaintiff_details.address}</div>
                  </div>
                  <div className="admin-detail-row">
                    <div className="admin-detail-label">Contact:</div>
                    <div className="admin-detail-value">{selectedCase.plaintiff_details.mobile || selectedCase.plaintiff_details.phone}</div>
                  </div>
                  <div className="admin-detail-row">
                    <div className="admin-detail-label">Advocate:</div>
                    <div className="admin-detail-value">{selectedCase.plaintiff_details.advocate}</div>
                  </div>
                </div>
                
                <div className="admin-case-section">
                  <h3>Respondent Details</h3>
                  <div className="admin-detail-row">
                    <div className="admin-detail-label">Name:</div>
                    <div className="admin-detail-value">{selectedCase.respondent_details.name}</div>
                  </div>
                  <div className="admin-detail-row">
                    <div className="admin-detail-label">Address:</div>
                    <div className="admin-detail-value">{selectedCase.respondent_details.address}</div>
                  </div>
                  <div className="admin-detail-row">
                    <div className="admin-detail-label">Contact:</div>
                    <div className="admin-detail-value">{selectedCase.respondent_details.mobile || selectedCase.respondent_details.phone}</div>
                  </div>
                  <div className="admin-detail-row">
                    <div className="admin-detail-label">Advocate:</div>
                    <div className="admin-detail-value">{selectedCase.respondent_details.advocate}</div>
                  </div>
                </div>
                
                {selectedCase.case_type === 'Criminal' && selectedCase.police_station_details && (
                  <div className="admin-case-section">
                    <h3>Police Station Details</h3>
                    <div className="admin-detail-row">
                      <div className="admin-detail-label">Police Station:</div>
                      <div className="admin-detail-value">{selectedCase.police_station_details.police_station}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-label">FIR Number:</div>
                      <div className="admin-detail-value">{selectedCase.police_station_details.fir_no}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-label">FIR Year:</div>
                      <div className="admin-detail-value">{selectedCase.police_station_details.fir_year}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-label">Date of Offence:</div>
                      <div className="admin-detail-value">{selectedCase.police_station_details.date_of_offence && new Date(selectedCase.police_station_details.date_of_offence).toLocaleDateString()}</div>
                    </div>
                  </div>
                )}
                
                {selectedCase.lower_court_details && selectedCase.lower_court_details.court_name && (
                  <div className="admin-case-section">
                    <h3>Lower Court Details</h3>
                    <div className="admin-detail-row">
                      <div className="admin-detail-label">Court Name:</div>
                      <div className="admin-detail-value">{selectedCase.lower_court_details.court_name}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-label">Case Number:</div>
                      <div className="admin-detail-value">{selectedCase.lower_court_details.case_no}</div>
                    </div>
                    <div className="admin-detail-row">
                      <div className="admin-detail-label">Decision Date:</div>
                      <div className="admin-detail-value">{selectedCase.lower_court_details.decision_date && new Date(selectedCase.lower_court_details.decision_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
              {selectedTab === 'hearings' && (
          <div className="admin-tab-content">
            <div className="admin-hearing-form">
              <h3>Schedule New Hearing</h3>
              <form onSubmit={handleHearingSubmit}>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Hearing Date</label>
                    <input
                      type="date"
                      name="hearing_date"
                      value={hearingForm.hearing_date}
                      onChange={handleHearingChange}
                      required
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label>Hearing Type</label>
                    <select
                      name="hearing_type"
                      value={hearingForm.hearing_type}
                      onChange={handleHearingChange}
                      required
                    >
                      <option value="Initial">Initial</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Final">Final</option>
                      <option value="Adjournment">Adjournment</option>
                    </select>
                  </div>
                </div>
                
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Next Hearing Date (optional)</label>
                    <input
                      type="date"
                      name="next_hearing_date"
                      value={hearingForm.next_hearing_date}
                      onChange={handleHearingChange}
                    />
                  </div>
                </div>
                
                <div className="admin-form-row">
                  <div className="admin-form-group full-width">
                    <label>
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
                      name="remarks"
                      value={hearingForm.remarks}
                      onChange={handleHearingChange}
                      rows="8"
                      className="hearing-remarks-textarea"
                      placeholder="Enter hearing remarks. Press Enter for new line, double Enter for new paragraph."
                    ></textarea>
                    
                    <div className="formatting-help">
                      <small>
                        💡 Tip: Use the toolbar buttons or type HTML tags directly for formatting.
                        Paragraphs and line breaks will be preserved.
                      </small>
                    </div>
                  </div>
                </div>
                
                <div className="admin-form-row">
                  <div className="admin-form-group full-width">
                    <label>Attachments</label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
                
                <div className="admin-form-row">
                  <div className="admin-form-group full-width">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={hearingForm.sign_hearing}
                        onChange={(e) => setHearingForm({
                          ...hearingForm,
                          sign_hearing: e.target.checked
                        })}
                      />
                      <span>Digitally sign this hearing</span>
                    </label>
                    <small className="help-text">
                      Digitally signing will create a tamper-proof record of this hearing.
                    </small>
                  </div>
                </div>
                
                <div className="admin-form-actions">
                  <button type="submit" className="admin-btn primary">
                    Schedule Hearing
                  </button>
                </div>
              </form>
            </div>
            
            <div className="admin-hearings-list">
              <h3>Hearing History</h3>
              {!selectedCase.hearings || selectedCase.hearings.length === 0 ? (
                <div className="admin-no-hearings">No hearings scheduled yet</div>
              ) : (
                <div className="admin-hearings-timeline">
                  {selectedCase.hearings.map((hearing, index) => 
                    renderHearingItem(hearing, index)
                  )}
                </div>
              )}
            </div>
          </div>
        )}
            {selectedTab === 'status' && (
              <div className="admin-tab-content">
                <div className="admin-status-form">
                  <h3>Update Case Status</h3>
                  <form onSubmit={handleStatusUpdate}>
                    <div className="admin-form-row">
                      <div className="admin-form-group">
                        <label>Status</label>
                        <select
                          name="status"
                          value={statusForm.status}
                          onChange={(e) => setStatusForm({...statusForm, status: e.target.value})}
                          required
                        >
                          <option value="">Select Status</option>
                          <option value="Filed">Filed</option>
                          <option value="Pending">Pending</option>
                          <option value="Under Investigation">Under Investigation</option>
                          <option value="Hearing in Progress">Hearing in Progress</option>
                          <option value="Awaiting Judgment">Awaiting Judgment</option>
                          <option value="Disposed">Disposed</option>
                          <option value="Appealed">Appealed</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="admin-form-row">
                      <div className="admin-form-group full-width">
                        <label>Remarks</label>
                        <textarea
                          name="remarks"
                          value={statusForm.remarks}
                          onChange={(e) => setStatusForm({...statusForm, remarks: e.target.value})}
                          rows="3"
                        ></textarea>
                      </div>
                    </div>
                    
                    <div className="admin-form-actions">
                      <button type="submit" className="admin-btn primary">Update Status</button>
                    </div>
                  </form>
                </div>
                
                <div className="admin-status-history">
                  <h3>Status History</h3>
                  <div className="admin-status-current">
                    <strong>Current Status:</strong> 
                    <span className={`admin-status-badge status-${selectedCase.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {selectedCase.status}
                    </span>
                  </div>
                  
                  {/* Status history would be displayed here if available in your API */}
                  <div className="admin-status-note">
                    <p>Status changes are recorded with timestamps for audit purposes.</p>
                  </div>
                </div>
              </div>
            )}
            
           {selectedTab === 'documents' && (
  <div className="admin-documents-section">
    <h3>Document Management</h3>

    {/* REQUEST DOCUMENT SECTION */}
    <div className="admin-document-request-box">
      <h4>📄 Request Document from Party</h4>
      {!showRequestForm ? (
        <button 
          onClick={() => setShowRequestForm(true)}
          className="admin-btn admin-btn-primary"
        >
          + Request Document
        </button>
      ) : (
        <form onSubmit={handleDocumentRequest} className="admin-request-form">
          <div className="admin-form-group">
            <label>Document Type *</label>
            <select
              value={documentRequestForm.document_type}
              onChange={(e) => setDocumentRequestForm({
                ...documentRequestForm,
                document_type: e.target.value
              })}
              className="admin-select"
              required
            >
              <option value="">Select Document Type</option>
              <option value="Petition">Petition</option>
              <option value="Affidavit">Affidavit</option>
              <option value="Evidence">Evidence</option>
              <option value="Court Order">Court Order</option>
              <option value="Judgment">Judgment</option>
              <option value="Application">Application</option>
              <option value="Certificate">Certificate</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="admin-form-group">
            <label>Request From *</label>
            <select
              value={documentRequestForm.requested_from_type}
              onChange={(e) => setDocumentRequestForm({
                ...documentRequestForm,
                requested_from_type: e.target.value,
                requested_from: '' // Reset requested_from when type changes
              })}
              className="admin-select"
              required
            >
              <option value="">Select Type</option>
              <option value="litigant">Litigant</option>
              <option value="advocate">Advocate</option>
            </select>
          </div>

          {documentRequestForm.requested_from_type && (
            <div className="admin-form-group">
              <label>Select {documentRequestForm.requested_from_type === 'litigant' ? 'Litigant' : 'Advocate'} *</label>
              <select
                value={documentRequestForm.requested_from}
                onChange={(e) => setDocumentRequestForm({
                  ...documentRequestForm,
                  requested_from: e.target.value
                })}
                className="admin-select"
                required
              >
                <option value="">Select {documentRequestForm.requested_from_type === 'litigant' ? 'Litigant' : 'Advocate'}</option>
                {documentRequestForm.requested_from_type === 'litigant' && (
                  <>
                    <option value={selectedCase.plaintiff_details?.party_id}>
                      {selectedCase.plaintiff_details?.name} (Plaintiff)
                    </option>
                    {selectedCase.respondent_details?.party_id && (
                      <option value={selectedCase.respondent_details?.party_id}>
                        {selectedCase.respondent_details?.name} (Respondent)
                      </option>
                    )}
                  </>
                )}
                {documentRequestForm.requested_from_type === 'advocate' && (
                  <>
                    {selectedCase.plaintiff_details?.advocate_id && (
                      <option value={selectedCase.plaintiff_details?.advocate_id}>
                        {selectedCase.plaintiff_details?.advocate || 'Plaintiff Advocate'}
                      </option>
                    )}
                    {selectedCase.respondent_details?.advocate_id && (
                      <option value={selectedCase.respondent_details?.advocate_id}>
                        {selectedCase.respondent_details?.advocate || 'Respondent Advocate'}
                      </option>
                    )}
                  </>
                )}
              </select>
            </div>
          )}

          <div className="admin-form-group">
            <label>Description</label>
            <textarea
              value={documentRequestForm.description}
              onChange={(e) => setDocumentRequestForm({
                ...documentRequestForm,
                description: e.target.value
              })}
              placeholder="Describe what document you need and why"
              rows="3"
              className="admin-textarea"
            />
          </div>

          <div className="admin-form-group">
            <label>Submission Deadline *</label>
            <input
              type="date"
              value={documentRequestForm.submission_deadline}
              onChange={(e) => setDocumentRequestForm({
                ...documentRequestForm,
                submission_deadline: e.target.value
              })}
              className="admin-input"
              required
            />
          </div>

          <div className="admin-form-actions">
            <button 
              type="submit" 
              className="admin-btn admin-btn-primary"
              disabled={requestingDocument}
            >
              {requestingDocument ? 'Sending...' : 'Send Request'}
            </button>
            <button 
              type="button"
              onClick={() => {
                setShowRequestForm(false);
                setDocumentRequestForm({
                  document_type: '',
                  description: '',
                  requested_from: '',
                  requested_from_type: '',
                  submission_deadline: ''
                });
              }}
              className="admin-btn admin-btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>

    <hr style={{margin: '30px 0'}} />

    {/* UPLOAD DOCUMENT SECTION */}
    <div className="admin-document-upload-box">
      <h4>📤 Upload Document Directly</h4>
      <form onSubmit={handleDocumentSubmit} className="admin-upload-form">
        <div className="admin-form-group">
          <label>Document Type *</label>
          <select
            name="document_type"
            value={documentForm.document_type}
            onChange={handleDocumentFormChange}
            className="admin-select"
            required
          >
            <option value="">Select Document Type</option>
            <option value="Petition">Petition</option>
            <option value="Affidavit">Affidavit</option>
            <option value="Evidence">Evidence</option>
            <option value="Court Order">Court Order</option>
            <option value="Judgment">Judgment</option>
            <option value="Notice">Notice</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="admin-form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={documentForm.description}
            onChange={handleDocumentFormChange}
            placeholder="Enter document description"
            rows="2"
            className="admin-textarea"
          />
        </div>

        <div className="admin-form-group">
          <label>Select File *</label>
          <input
            type="file"
            name="file"
            onChange={handleDocumentFormChange}
            className="admin-input"
            required
          />
        </div>

        <button type="submit" className="admin-btn admin-btn-primary">
          Upload Document
        </button>
      </form>
    </div>

    <hr style={{margin: '30px 0'}} />

    {/* DOCUMENT LIST SECTION */}
    <div className="admin-documents-list">
      <h4>📋 Case Documents</h4>
      {!selectedCase.documents || selectedCase.documents.length === 0 ? (
        <p className="admin-no-data">No documents uploaded yet</p>
      ) : (
        <div className="admin-documents-table-wrapper">
          <table className="admin-documents-table">
            <thead>
              <tr>
                <th>Document Type</th>
                <th>File Name</th>
                <th>Description</th>
                <th>Uploaded Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {selectedCase.documents.map((doc, index) => (
                <tr key={index}>
                  <td>{doc.document_type || 'N/A'}</td>
                  <td>
                    {doc.file_name || 'N/A'}
                    {doc.requested_from_type && (
                      <span className="admin-badge">
                        {doc.requested_from_type === 'litigant' ? '👤 From Litigant' : '👨‍⚖️ From Advocate'}
                      </span>
                    )}
                  </td>
                  <td>{doc.description || 'N/A'}</td>
                  <td>
                    {doc.uploaded_date 
                      ? new Date(doc.uploaded_date).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td>
                    <span className={`admin-status-badge ${doc.verification_status || 'pending'}`}>
                      {doc.verification_status ? doc.verification_status.replace('_', ' ').toUpperCase() : 'UPLOADED'}
                    </span>
                  </td>
                  <td>
                    {doc.file_name && (
                      <button
                        onClick={() => {
                          console.log('Document ID for download:', doc.document_id);
                          handleDocumentDownload(doc.document_id);
                        }}
                        className="admin-btn admin-btn-small admin-btn-secondary"
                      >
                        Download
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
)}

            
            {selectedTab === 'office' && (
              <div className="admin-tab-content">
                <div className="admin-office-form">
                  <h3>Office Use Details</h3>
                  <form onSubmit={handleOfficeUseSubmit}>
                    <div className="admin-form-section">
                      <h4>Filing Details</h4>
                      <div className="admin-form-row">
                        <div className="admin-form-group">
                          <label>Filing Number</label>
                          <input
                            type="text"
                            name="filing_no"
                            value={officeUseForm.filing_no}
                            onChange={handleOfficeUseFormChange}
                          />
                        </div>
                        <div className="admin-form-group">
                          <label>Filing Date</label>
                          <input
                            type="date"
                            name="filing_date"
                            value={officeUseForm.filing_date}
                            onChange={handleOfficeUseFormChange}
                          />
                        </div>
                        <div className="admin-form-group">
                          <label>Filing Done By</label>
                          <input
                            type="text"
                            name="filing_done_by"
                            value={officeUseForm.filing_done_by}
                            onChange={handleOfficeUseFormChange}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="admin-form-section">
                      <h4>Objection Details</h4>
                      <div className="admin-form-row">
                        <div className="admin-form-group">
                          <label>Objection Raised Date</label>
                          <input
                            type="date"
                            name="objection_red_date"
                            value={officeUseForm.objection_red_date}
                            onChange={handleOfficeUseFormChange}
                          />
                        </div>
                        <div className="admin-form-group">
                          <label>Objection Compliance Date</label>
                          <input
                            type="date"
                            name="objection_compliance_date"
                            value={officeUseForm.objection_compliance_date}
                            onChange={handleOfficeUseFormChange}
                          />
                        </div>
                        <div className="admin-form-group">
                          <label>Objection Raised By</label>
                          <input
                            type="text"
                            name="objection_raised_by"
                            value={officeUseForm.objection_raised_by}
                            onChange={handleOfficeUseFormChange}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="admin-form-section">
                      <h4>Registration Details</h4>
                      <div className="admin-form-row">
                        <div className="admin-form-group">
                          <label>Registration Number</label>
                          <input
                            type="text"
                            name="registration_no"
                            value={officeUseForm.registration_no}
                            onChange={handleOfficeUseFormChange}
                          />
                        </div>
                        <div className="admin-form-group">
                          <label>Registration Date</label>
                          <input
                            type="date"
                            name="registration_date"
                            value={officeUseForm.registration_date}
                            onChange={handleOfficeUseFormChange}
                          />
                        </div>
                        <div className="admin-form-group">
                          <label>Registration Done By</label>
                          <input
                            type="text"
                            name="registration_done_by"
                            value={officeUseForm.registration_done_by}
                            onChange={handleOfficeUseFormChange}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="admin-form-section">
                      <h4>Allocation Details</h4>
                      <div className="admin-form-row">
                        <div className="admin-form-group">
                          <label>Court Allotted</label>
                          <input
                            type="text"
                            name="court_allotted"
                            value={officeUseForm.court_allotted}
                            onChange={handleOfficeUseFormChange}
                          />
                        </div>
                        <div className="admin-form-group">
                          <label>Allocation Date</label>
                          <input
                            type="date"
                            name="allocation_date"
                            value={officeUseForm.allocation_date}
                            onChange={handleOfficeUseFormChange}
                          />
                        </div>
                        <div className="admin-form-group">
                          <label>Allocation Done By</label>
                          <input
                            type="text"
                            name="allocation_done_by"
                            value={officeUseForm.allocation_done_by}
                            onChange={handleOfficeUseFormChange}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="admin-form-row">
                      <div className="admin-form-group">
                        <label>Listing Date</label>
                        <input
                          type="date"
                          name="listing_date"
                          value={officeUseForm.listing_date}
                          onChange={handleOfficeUseFormChange}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>Case Code</label>
                        <input
                          type="text"
                          name="case_code"
                          value={officeUseForm.case_code}
                          onChange={handleOfficeUseFormChange}
                        />
                      </div>
                    </div>
                    
                    <div className="admin-form-actions">
                      <button type="submit" className="admin-btn primary">Update Office Details</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default AdminCaseManagement;
                          