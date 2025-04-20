import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle, Search, User, FileText, Clock, Send } from 'lucide-react';
import '../ComponentsCSS/advocatecaseassign.css';

const AdvocateCaseSearch = () => {
  const [cases, setCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('cases');
  const [userInfo, setUserInfo] = useState(null);
  const [viewDetails, setViewDetails] = useState(null);
  
  // Fetch advocate info and district cases on initial load
  useEffect(() => {
    fetchUserInfo();
    fetchCases();
    fetchPendingRequests();
    fetchSentRequests(); // New function to fetch requests made by the advocate
  }, []);
  
  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/advlogin');
        throw new Error('No authentication token found');
      }
      
      const response = await axios.get(
        'http://localhost:5000/api/advocate/profile',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUserInfo(response.data.advocate);
      setLoading(false);
    } catch (error) {
      setError(error.response?.data?.message || error.message);
      setLoading(false);
      if (error.response?.status === 401) {
        navigate('/advlogin');
      }
    }
  };

  const fetchCases = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/cases/district',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCases(response.data.cases);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cases:', error);
      setError(error.response?.data?.message || 'Failed to fetch cases');
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/advocate/pending-requests',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPendingRequests(response.data.pendingRequests);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  // New function to fetch requests sent by the advocate
  const fetchSentRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/advocate/sent-requests',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSentRequests(response.data.sentRequests || []);
    } catch (error) {
      console.error('Error fetching sent requests:', error);
    }
  };

  const requestToJoinCase = async (caseId, partyType) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Determine the litigant ID based on party type
      const selectedCase = cases.find(c => c._id === caseId);
      const litigantId = partyType === 'plaintiff' 
        ? selectedCase.plaintiff_details.party_id 
        : selectedCase.respondent_details.party_id;
      
      await axios.post(
        `http://localhost:5000/cases/${caseId}/advocate-join-request`,
        {
          partyType,
          litigantId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess(`Request sent to join case as ${partyType}'s advocate`);
      fetchSentRequests(); // Refresh sent requests after sending a new one
      setLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error requesting to join case:', error);
      setError(error.response?.data?.message || 'Failed to send request');
      setLoading(false);
    }
  };

  const handleApproveRequest = async (caseId, requestId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/cases/${caseId}/advocate-requests/${requestId}`,
        { status: 'approved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Request approved successfully');
      fetchPendingRequests();
      setLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error approving request:', error);
      setError(error.response?.data?.message || 'Failed to approve request');
      setLoading(false);
    }
  };

  const handleRejectRequest = async (caseId, requestId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/cases/${caseId}/advocate-requests/${requestId}`,
        { status: 'rejected' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Request rejected successfully');
      fetchPendingRequests();
      setLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error rejecting request:', error);
      setError(error.response?.data?.message || 'Failed to reject request');
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(caseItem => {
    const caseNumber = caseItem.case_num || '';
    const plaintiff = caseItem.plaintiff_details.name || '';
    const respondent = caseItem.respondent_details.name || '';
    const query = searchQuery.toLowerCase();
    
    return (
      caseNumber.toLowerCase().includes(query) ||
      plaintiff.toLowerCase().includes(query) ||
      respondent.toLowerCase().includes(query)
    );
  });
  
  // Helper function to get status badge color class
  const getStatusBadgeClass = (status) => {
    switch(status.toLowerCase()) {
      case 'approved':
        return 'adv-status-approved';
      case 'pending':
        return 'adv-status-pending';
      case 'rejected':
        return 'adv-status-rejected';
      case 'active':
        return 'adv-status-active';
      case 'closed':
        return 'adv-status-closed';
      default:
        return 'adv-status-default';
    }
  };

  return (
    <div className="adv-dashboard-container">
      {/* Header Section */}
      <header className="adv-dashboard-header">
        <div className="adv-header-content">
          <h1>Case Management Dashboard</h1>
          {userInfo && (
            <div className="adv-profile-badge">
              <User size={18} />
              <span>{userInfo.name}</span>
            </div>
          )}
        </div>
      </header>
    
      {/* Alerts Section */}
      <div className="adv-alerts-container">
        {error && (
          <div className="adv-alert adv-alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button className="adv-close-button" onClick={() => setError('')}>×</button>
          </div>
        )}
        
        {success && (
          <div className="adv-alert adv-alert-success">
            <CheckCircle size={20} />
            <span>{success}</span>
            <button className="adv-close-button" onClick={() => setSuccess('')}>×</button>
          </div>
        )}
      </div>
    
      {/* Main Content Area */}
      <div className="adv-dashboard-content">
        {/* Profile Card */}
        {userInfo && (
          <div className="adv-profile-card">
            <div className="adv-profile-header">
              <User size={24} />
              <h2>Advocate Profile</h2>
            </div>
            <div className="adv-profile-details">
              <div className="adv-profile-detail-item">
                <span className="adv-detail-label">Name:</span>
                <span className="adv-detail-value">{userInfo.name}</span>
              </div>
              <div className="adv-profile-detail-item">
                <span className="adv-detail-label">District:</span>
                <span className="adv-detail-value">{userInfo.practice_details?.district || 'Not specified'}</span>
              </div>
              <div className="adv-profile-detail-item">
                <span className="adv-detail-label">Cases shown from:</span>
                <span className="adv-detail-value">{userInfo.practice_details?.district || 'Your district'}</span>
              </div>
            </div>
          </div>
        )}
    
        {/* Tabs Navigation */}
        <div className="adv-tabs-container">
          <button 
            className={`adv-tab-button ${activeTab === 'cases' ? 'adv-active-tab' : ''}`}
            onClick={() => setActiveTab('cases')}
          >
            <FileText size={16} />
            <span>District Cases</span>
          </button>
          <button 
            className={`adv-tab-button ${activeTab === 'requests' ? 'adv-active-tab' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <Clock size={16} />
            <span>Pending Requests</span>
            {pendingRequests.length > 0 && <span className="adv-badge">{pendingRequests.length}</span>}
          </button>
          <button 
            className={`adv-tab-button ${activeTab === 'sent-requests' ? 'adv-active-tab' : ''}`}
            onClick={() => setActiveTab('sent-requests')}
          >
            <Send size={16} />
            <span>My Requests</span>
            {sentRequests.length > 0 && <span className="adv-badge">{sentRequests.length}</span>}
          </button>
        </div>
        
        {/* District Cases Tab */}
        {activeTab === 'cases' && (
          <div className="adv-tab-content">
            <div className="adv-tab-header">
              <h2>Cases in Your District</h2>
              <div className="adv-search-container">
                <Search size={18} className="adv-search-icon" />
                <input
                  type="text"
                  placeholder="Search cases by number, plaintiff, or respondent..."
                  className="adv-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {loading ? (
              <div className="adv-loading-container">
                <div className="adv-loader"></div>
                <p>Loading cases...</p>
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="adv-empty-state">
                <FileText size={48} />
                <p>No cases found in your district.</p>
              </div>
            ) : (
              <div className="adv-cases-table-container">
                <table className="adv-cases-table">
                  <thead>
                    <tr>
                      <th>Case Number</th>
                      <th>Court</th>
                      <th>Type</th>
                      <th>Plaintiff</th>
                      <th>Respondent</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map(caseItem => (
                      <tr key={caseItem._id}>
                        <td>{caseItem.case_num || 'N/A'}</td>
                        <td>{caseItem.court}</td>
                        <td>{caseItem.case_type}</td>
                        <td>
                          <div className="adv-party-details">
                            <span className="adv-party-name">{caseItem.plaintiff_details.name}</span>
                            {caseItem.plaintiff_details.advocate && (
                              <span className="adv-advocate-info">
                                Adv: {caseItem.plaintiff_details.advocate}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="adv-party-details">
                            <span className="adv-party-name">{caseItem.respondent_details.name}</span>
                            {caseItem.respondent_details.advocate && (
                              <span className="adv-advocate-info">
                                Adv: {caseItem.respondent_details.advocate}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`adv-status-badge adv-status-${caseItem.status.toLowerCase()}`}>
                            {caseItem.status}
                          </span>
                        </td>
                        <td>
                          <div className="adv-action-buttons">
                            <button 
                              className={`adv-action-btn adv-plaintiff-btn ${caseItem.plaintiff_details.advocate_id ? 'adv-disabled' : ''}`}
                              onClick={() => requestToJoinCase(caseItem._id, 'plaintiff')}
                              disabled={caseItem.plaintiff_details.advocate_id ? true : false}
                            >
                              Join Plaintiff
                            </button>
                            <button 
                              className={`adv-action-btn adv-respondent-btn ${caseItem.respondent_details.advocate_id ? 'adv-disabled' : ''}`}
                              onClick={() => requestToJoinCase(caseItem._id, 'respondent')}
                              disabled={caseItem.respondent_details.advocate_id ? true : false}
                            >
                              Join Respondent
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
        )}
        
        {/* Pending Requests Tab */}
        {activeTab === 'requests' && (
          <div className="adv-tab-content">
            <div className="adv-tab-header">
              <h2>Pending Litigant Requests</h2>
            </div>
            
            {pendingRequests.length === 0 ? (
              <div className="adv-empty-state">
                <Clock size={48} />
                <p>No pending requests from litigants.</p>
              </div>
            ) : (
              <div className="adv-requests-grid">
                {pendingRequests.map(request => (
                  <div key={request.case_id} className="adv-request-card">
                    <div className="adv-request-card-header">
                      <h3>Case: {request.case_num || 'Case Number Not Assigned'}</h3>
                    </div>
                    <div className="adv-request-card-body">
                      <div className="adv-request-case-details">
                        <div className="adv-detail-row">
                          <span className="adv-detail-label">Court:</span>
                          <span className="adv-detail-value">{request.court}</span>
                        </div>
                        <div className="adv-detail-row">
                          <span className="adv-detail-label">Type:</span>
                          <span className="adv-detail-value">{request.case_type}</span>
                        </div>
                        <div className="adv-detail-row">
                          <span className="adv-detail-label">District:</span>
                          <span className="adv-detail-value">{request.district}</span>
                        </div>
                        <div className="adv-detail-row">
                          <span className="adv-detail-label">Plaintiff:</span>
                          <span className="adv-detail-value">{request.plaintiff}</span>
                        </div>
                        <div className="adv-detail-row">
                          <span className="adv-detail-label">Respondent:</span>
                          <span className="adv-detail-value">{request.respondent}</span>
                        </div>
                      </div>
                      
                      <div className="adv-request-list">
                        <h4>Litigant Requests:</h4>
                        {request.requests.map(req => (
                          <div key={req._id} className="adv-request-item">
                            <div className="adv-request-details">
                              <div className="adv-detail-row">
                                <span className="adv-detail-label">Requested by:</span>
                                <span className="adv-detail-value">{req.party_type === 'plaintiff' ? 'Plaintiff' : 'Respondent'}</span>
                              </div>
                              <div className="adv-detail-row">
                                <span className="adv-detail-label">Role:</span>
                                <span className="adv-detail-value">{req.party_type === 'plaintiff' ? "Plaintiff's Advocate" : "Respondent's Advocate"}</span>
                              </div>
                              <div className="adv-detail-row">
                                <span className="adv-detail-label">Requested on:</span>
                                <span className="adv-detail-value">{new Date(req.requested_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            
                            <div className="adv-request-actions">
                              <button 
                                className="adv-action-btn adv-accept-btn"
                                onClick={() => handleApproveRequest(request.case_id, req._id)}
                              >
                                Accept
                              </button>
                              <button 
                                className="adv-action-btn adv-decline-btn"
                                onClick={() => handleRejectRequest(request.case_id, req._id)}
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sent Requests Tab - NEW TAB */}
        {activeTab === 'sent-requests' && (
          <div className="adv-tab-content">
            <div className="adv-tab-header">
              <h2>My Case Join Requests</h2>
            </div>
            
            {loading ? (
              <div className="adv-loading-container">
                <div className="adv-loader"></div>
                <p>Loading your requests...</p>
              </div>
            ) : sentRequests.length === 0 ? (
              <div className="adv-empty-state">
                <Send size={48} />
                <p>You haven't sent any requests to join cases yet.</p>
              </div>
            ) : (
              <div className="adv-requests-grid">
                {sentRequests.map(request => (
                  <div key={request.case_id} className="adv-request-card">
                    <div className="adv-request-card-header">
                      <h3>Case: {request.case_num || 'Case Number Not Assigned'}</h3>
                      <span className={`adv-status-badge ${getStatusBadgeClass(request.request_status)}`}>
                        {request.request_status}
                      </span>
                    </div>
                    <div className="adv-request-card-body">
                      <div className="adv-request-case-details">
                        <div className="adv-detail-row">
                          <span className="adv-detail-label">Court:</span>
                          <span className="adv-detail-value">{request.court}</span>
                        </div>
                        <div className="adv-detail-row">
                          <span className="adv-detail-label">Type:</span>
                          <span className="adv-detail-value">{request.case_type}</span>
                        </div>
                        <div className="adv-detail-row">
                          <span className="adv-detail-label">District:</span>
                          <span className="adv-detail-value">{request.district}</span>
                        </div>
                        <div className="adv-detail-row">
                          <span className="adv-detail-label">Plaintiff:</span>
                          <span className="adv-detail-value">{request.plaintiff}</span>
                        </div>
                        <div className="adv-detail-row">
                          <span className="adv-detail-label">Respondent:</span>
                          <span className="adv-detail-value">{request.respondent}</span>
                        </div>
                      </div>
                      
                      <div className="adv-request-details">
                        <h4>Request Details:</h4>
                        <div className="adv-detail-row">
                          <span className="adv-detail-label">Requested Role:</span>
                          <span className="adv-detail-value">
                            {request.party_type === 'plaintiff' ? "Plaintiff's Advocate" : "Respondent's Advocate"}
                          </span>
                        </div>
                        <div className="adv-detail-row">
                          <span className="adv-detail-label">Requested on:</span>
                          <span className="adv-detail-value">{new Date(request.requested_at).toLocaleDateString()}</span>
                        </div>
                        {request.updated_at && request.updated_at !== request.requested_at && (
                          <div className="adv-detail-row">
                            <span className="adv-detail-label">Last updated:</span>
                            <span className="adv-detail-value">{new Date(request.updated_at).toLocaleDateString()}</span>
                          </div>
                        )}
                        {request.request_status === 'rejected' && (
                          <div className="adv-rejection-note">
                            <p>Your request was declined by the litigant. You may contact the court for more information.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvocateCaseSearch;