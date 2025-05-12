import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../ComponentsCSS/litigantcaseassign.css'; // Update this path if needed

const LitigantAdvocateSearch = () => {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [advocates, setAdvocates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('cases');
  
  // Fetch litigant's cases
  useEffect(() => {
    fetchCases();
    fetchPendingRequests();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'https://ecourt-yr51.onrender.com/api/cases/litigant',
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
        'https://ecourt-yr51.onrender.com/litigant/pending-requests',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPendingRequests(response.data.pendingRequests);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const searchAdvocates = async () => {
    try {
      if (!selectedCase || !selectedCase.district) {
        setError('No case or district selected');
        return;
      }
      
      setLoading(true);
      const district = selectedCase.district;
      console.log("Searching advocates in district:", district);
      
      const token = localStorage.getItem('token');
      // Fixed the URL to match the backend endpoint
      const response = await axios.get(
        `https://ecourt-yr51.onrender.com/advocates/search?district=${district}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("Response received:", response.data);
      
      if (response.data.advocates && Array.isArray(response.data.advocates)) {
        console.log("Advocates found:", response.data.advocates.length);
        setAdvocates(response.data.advocates);
        if (response.data.advocates.length === 0) {
          setError('No advocates found in this district');
        }
      } else {
        console.log("No advocates found for this district");
        setAdvocates([]);
        setError('No advocates found in this district');
      }
    } catch (error) {
      console.error("Error fetching advocates:", error);
      setError(error.response?.data?.message || 'Failed to fetch advocates');
      setAdvocates([]);
    } finally {
      setLoading(false);
    }
  };

  const requestAdvocate = async (advocateId, advocateName, partyType) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `https://ecourt-yr51.onrender.com/cases/${selectedCase._id}/request-advocate`,
        {
          advocateId,
          advocateName,
          partyType
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess(`Request sent to advocate ${advocateName}`);
      setLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error requesting advocate:', error);
      setError(error.response?.data?.message || 'Failed to send request');
      setLoading(false);
    }
  };

  const handleApproveRequest = async (caseId, requestId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `https://ecourt-yr51.onrender.com/cases/${caseId}/advocate-requests/${requestId}`,
        { status: 'approved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Request approved successfully');
      fetchPendingRequests();
      fetchCases();
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
        `https://ecourt-yr51.onrender.com/cases/${caseId}/advocate-requests/${requestId}`,
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

  const filteredAdvocates = advocates.filter(advocate => 
    advocate.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="las-container">
      <h1 className="las-title">Advocate Search & Management</h1>
      
      {/* Tabs */}
      <div className="las-tabs">
        <button 
          className={`las-tab ${activeTab === 'cases' ? 'las-tab-active' : ''}`}
          onClick={() => setActiveTab('cases')}
        >
          My Cases
        </button>
        <button 
          className={`las-tab ${activeTab === 'requests' ? 'las-tab-active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Pending Requests 
          {pendingRequests.length > 0 && <span className="las-tab-badge">{pendingRequests.length}</span>}
        </button>
      </div>
      
      {/* Alert Messages */}
      {error && (
        <div className="las-alert las-alert-error">
          {error}
          <button className="las-alert-close" onClick={() => setError('')}>×</button>
        </div>
      )}
      
      {success && (
        <div className="las-alert las-alert-success">
          {success}
          <button className="las-alert-close" onClick={() => setSuccess('')}>×</button>
        </div>
      )}
      
      {/* My Cases Tab */}
      {activeTab === 'cases' && (
        <div>
          <h2 className="las-card-title">My Cases</h2>
          
          {loading ? (
            <div className="las-loading">Loading cases...</div>
          ) : cases.length === 0 ? (
            <div className="las-empty-state">No cases found.</div>
          ) : (
            <table className="las-table">
              <thead>
                <tr>
                  <th>Case Number</th>
                  <th>Court</th>
                  <th>Type</th>
                  <th>District</th>
                  <th>Plaintiff</th>
                  <th>Respondent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map(caseItem => (
                  <tr key={caseItem._id}>
                    <td>{caseItem.case_num || 'N/A'}</td>
                    <td>{caseItem.court}</td>
                    <td>{caseItem.case_type}</td>
                    <td>{caseItem.district}</td>
                    <td>
                      {caseItem.plaintiff_details.name}
                      {caseItem.plaintiff_details.advocate && (
                        <div className="las-detail-note">
                          Advocate: {caseItem.plaintiff_details.advocate}
                        </div>
                      )}
                    </td>
                    <td>
                      {caseItem.respondent_details.name}
                      {caseItem.respondent_details.advocate && (
                        <div className="las-detail-note">
                          Advocate: {caseItem.respondent_details.advocate}
                        </div>
                      )}
                    </td>
                    <td>
                      <button 
                        className="las-btn las-btn-primary las-btn-sm"
                        onClick={() => setSelectedCase(caseItem)}
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {selectedCase && (
            <div className="las-case-card">
              <h3 className="las-card-title">Selected Case: {selectedCase.case_num || 'New Case'}</h3>
              <div className="las-case-details">
                <div>
                  <div className="las-detail-item">
                    <span className="las-detail-label">Court:</span>
                    <span className="las-detail-value">{selectedCase.court}</span>
                  </div>
                  <div className="las-detail-item">
                    <span className="las-detail-label">Type:</span>
                    <span className="las-detail-value">{selectedCase.case_type}</span>
                  </div>
                  <div className="las-detail-item">
                    <span className="las-detail-label">District:</span>
                    <span className="las-detail-value">{selectedCase.district}</span>
                  </div>
                </div>
                <div>
                  <div className="las-detail-item">
                    <span className="las-detail-label">Plaintiff:</span>
                    <span className="las-detail-value">{selectedCase.plaintiff_details.name}</span>
                  </div>
                  <div className="las-detail-item">
                    <span className="las-detail-label">Plaintiff's Advocate:</span>
                    <span className="las-detail-value">{selectedCase.plaintiff_details.advocate || 'None'}</span>
                  </div>
                  <div className="las-detail-item">
                    <span className="las-detail-label">Respondent:</span>
                    <span className="las-detail-value">{selectedCase.respondent_details.name}</span>
                  </div>
                  <div className="las-detail-item">
                    <span className="las-detail-label">Respondent's Advocate:</span>
                    <span className="las-detail-value">{selectedCase.respondent_details.advocate || 'None'}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <button 
                  className="las-btn las-btn-success"
                  onClick={searchAdvocates}
                >
                  Search Advocates in District
                </button>
              </div>
              
              {loading && <div className="las-loading">Searching advocates...</div>}
              
              {advocates.length > 0 && (
                <div className="mt-4">
                  <h4 className="las-card-title">Available Advocates</h4>
                  
                  <input
                    type="text"
                    placeholder="Search advocates by name..."
                    className="las-search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  
                  <div className="las-advocate-grid">
                    {filteredAdvocates.length > 0 ? (
                      filteredAdvocates.map(advocate => (
                        <div key={advocate.advocate_id} className="las-advocate-card">
                          <h5 className="las-advocate-name">{advocate.name}</h5>
                          <p className="las-advocate-info">
                            <strong>District:</strong> {advocate.practice_details?.district || 'Not specified'}
                          </p>
                          <p className="las-advocate-info">
                            <strong>Practice:</strong> {advocate.practice_details?.high_court ? 'High Court' : ''} 
                            {advocate.practice_details?.district_court && advocate.practice_details?.high_court ? ' & ' : ''}
                            {advocate.practice_details?.district_court ? 'District Court' : ''}
                            {!advocate.practice_details?.high_court && !advocate.practice_details?.district_court ? 'Not specified' : ''}
                          </p>
                          <div className="las-advocate-actions">
                            <button
                              className="las-btn las-btn-primary las-btn-sm"
                              onClick={() => requestAdvocate(advocate.advocate_id, advocate.name, 'plaintiff')}
                              disabled={selectedCase.plaintiff_details.advocate_id ? true : false}
                            >
                              Request as Plaintiff's Advocate
                            </button>
                            <button
                              className="las-btn las-btn-secondary las-btn-sm"
                              onClick={() => requestAdvocate(advocate.advocate_id, advocate.name, 'respondent')}
                              disabled={selectedCase.respondent_details.advocate_id ? true : false}
                            >
                              Request as Respondent's Advocate
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>No advocates found matching your search criteria.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Pending Requests Tab */}
      {activeTab === 'requests' && (
        <div>
          <h2 className="las-card-title">Pending Advocate Requests</h2>
          
          {pendingRequests.length === 0 ? (
            <div className="las-empty-state">No pending requests from advocates.</div>
          ) : (
            <div>
              {pendingRequests.map(request => (
                <div key={request.case_id} className="las-request-card">
                  <h3 className="las-request-title">Case: {request.case_num || 'Case Number Not Assigned'}</h3>
                  
                  <div className="las-case-details">
                    <div>
                      <div className="las-detail-item">
                        <span className="las-detail-label">Court:</span>
                        <span className="las-detail-value">{request.court}</span>
                      </div>
                      <div className="las-detail-item">
                        <span className="las-detail-label">Type:</span>
                        <span className="las-detail-value">{request.case_type}</span>
                      </div>
                      <div className="las-detail-item">
                        <span className="las-detail-label">District:</span>
                        <span className="las-detail-value">{request.district}</span>
                      </div>
                    </div>
                    <div>
                      <div className="las-detail-item">
                        <span className="las-detail-label">Plaintiff:</span>
                        <span className="las-detail-value">{request.plaintiff}</span>
                      </div>
                      <div className="las-detail-item">
                        <span className="las-detail-label">Respondent:</span>
                        <span className="las-detail-value">{request.respondent}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="las-request-title">Advocate Requests:</h4>
                    {request.requests.map(req => (
                      <div key={req._id} className="las-request-subcard">
                        <div className="las-detail-item">
                          <span className="las-detail-label">Advocate:</span>
                          <span className="las-detail-value">{req.advocate_name}</span>
                        </div>
                        <div className="las-detail-item">
                          <span className="las-detail-label">Requested for:</span>
                          <span className="las-detail-value">{req.party_type === 'plaintiff' ? 'Plaintiff' : 'Respondent'}</span>
                        </div>
                        <div className="las-detail-item">
                          <span className="las-detail-label">Requested on:</span>
                          <span className="las-detail-value">{new Date(req.requested_at).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="las-btn-group" style={{marginTop: '1rem'}}>
                          <button 
                            className="las-btn las-btn-success las-btn-sm"
                            onClick={() => handleApproveRequest(request.case_id, req._id)}
                          >
                            Approve
                          </button>
                          <button 
                            className="las-btn las-btn-danger las-btn-sm"
                            onClick={() => handleRejectRequest(request.case_id, req._id)}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LitigantAdvocateSearch;