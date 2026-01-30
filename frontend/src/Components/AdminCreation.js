import React, { useState, useEffect } from 'react';
import '../ComponentsCSS/CourtAdminManagement.css';
import axios from 'axios';

const CourtAdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    court_name: '',
    email: '',
    mobile: '',
    specialities: ''   // ⭐ ADDED
  });

  const [clerkProfile, setClerkProfile] = useState(null);
  const [statusChangeData, setStatusChangeData] = useState({
    adminId: null,
    status: '',
    reason: '',
    showModal: false
  });

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: ''
  });

  const API_URL = 'http://localhost:5000';

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          showNotification('Authentication error. Please log in again.', 'error');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/clerk/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        setClerkProfile(response.data.clerk);
      } catch (err) {
        console.error('Error fetching clerk profile:', err);
        showNotification('Failed to get your profile. Please try refreshing.', 'error');
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/admins`, {
        method: 'GET',
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch admins');
      }

      setAdmins(data.admins);
      setError(null);
    } catch (err) {
      setError(err.message);
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async (e) => {
    e.preventDefault();

    if (!clerkProfile || !clerkProfile._id || !clerkProfile.district) {
      showNotification('Your profile information is not available or incomplete. Please refresh and try again.', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/create-admin`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          ...formData,
          specialities: formData.specialities
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0), // ⭐ ADDED
          district: clerkProfile.district,
          createdBy: clerkProfile._id
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create admin');
      }

      setFormData({
        name: '',
        court_name: '',
        email: '',
        mobile: '',
        specialities: ''     // ⭐ ADDED
      });

      setShowCreateForm(false);
      fetchAdmins();
      showNotification('Court admin created successfully. A welcome email has been sent.', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const updateAdminStatus = async () => {
    try {
      const { adminId, status, reason } = statusChangeData;

      if (!clerkProfile || !clerkProfile._id) {
        showNotification('Your profile information is not available. Please refresh and try again.', 'error');
        return;
      }

      const response = await fetch(`${API_URL}/admin/${adminId}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          status,
          reason,
          updatedBy: clerkProfile._id
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update admin status');
      }

      setStatusChangeData({
        adminId: null,
        status: '',
        reason: '',
        showModal: false
      });

      fetchAdmins();
      showNotification(`Admin status updated to ${status}`, 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openStatusModal = (adminId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setStatusChangeData({
      adminId,
      status: newStatus,
      reason: '',
      showModal: true
    });
  };

  const showNotification = (message, type) => {
    setNotification({
      show: true,
      message,
      type
    });

    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  return (
    <div className="admin-management-container">
      <h1>Court Admin Management</h1>

      {clerkProfile && clerkProfile.district && (
        <div className="clerk-info">
          <p>District: <strong>{clerkProfile.district}</strong></p>
        </div>
      )}

      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
          <button
            className="close-btn"
            onClick={() => setNotification(prev => ({ ...prev, show: false }))}
          >
            &times;
          </button>
        </div>
      )}

      <div className="action-buttons">
        <button
          className="create-btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create New Admin'}
        </button>
      </div>

      {showCreateForm && (
        <div className="form-container">
          <h2>Create Court Admin</h2>
          <form onSubmit={createAdmin}>

            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>

            <div className="form-group">
              <label htmlFor="court_name">Court Name</label>
              <input type="text" id="court_name" name="court_name" value={formData.court_name} onChange={handleInputChange} required />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required />
            </div>

            <div className="form-group">
              <label htmlFor="mobile">Mobile (Optional)</label>
              <input type="text" id="mobile" name="mobile" value={formData.mobile} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label htmlFor="specialities">Specialities (comma separated)</label>
              <input
                type="text"
                id="specialities"
                name="specialities"
                value={formData.specialities}
                onChange={handleInputChange}
                placeholder="criminal law, NDPS, property dispute"
              />
            </div>

            <div className="form-group">
              <label htmlFor="district">District</label>
              <input
                type="text"
                id="district"
                name="district"
                value={clerkProfile?.district || 'Loading...'}
                readOnly
                disabled
                className="disabled-input"
              />
              <small className="info-text">District is automatically set from your profile</small>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">Create Admin</button>
              <button type="button" className="cancel-btn" onClick={() => setShowCreateForm(false)}>Cancel</button>
            </div>

          </form>
        </div>
      )}

      <div className="admin-list-container">
        <h2>Court Admins</h2>

        {loading ? (
          <div className="loading">Loading admins...</div>
        ) : error ? (
          <div className="error">Error: {error}</div>
        ) : admins.length === 0 ? (
          <div className="no-admins">No admins found. Create a new admin to get started.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Admin ID</th>
                <th>Name</th>
                <th>Court</th>
                <th>District</th>
                <th>Email</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(admin => (
                <tr key={admin.admin_id} className={admin.status === 'suspended' ? 'suspended' : ''}>
                  <td>{admin.admin_id}</td>
                  <td>{admin.name}</td>
                  <td>{admin.court_name}</td>
                  <td>{admin.district}</td>
                  <td>{admin.contact?.email}</td>
                  <td>
                    <span className={`status-badge ${admin.status}`}>
                      {admin.status}
                    </span>
                  </td>
                  <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className={admin.status === 'active' ? 'suspend-btn' : 'activate-btn'}
                      onClick={() => openStatusModal(admin.admin_id, admin.status)}
                    >
                      {admin.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {statusChangeData.showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>
              {statusChangeData.status === 'suspended' ? 'Suspend Admin Account' : 'Reactivate Admin Account'}
            </h3>

            <div className="modal-content">
              {statusChangeData.status === 'suspended' && (
                <div className="form-group">
                  <label htmlFor="reason">Reason for suspension</label>
                  <textarea
                    id="reason"
                    value={statusChangeData.reason}
                    onChange={(e) => setStatusChangeData(prev => ({ ...prev, reason: e.target.value }))}
                    rows="3"
                  />
                </div>
              )}

              <p>
                {statusChangeData.status === 'suspended'
                  ? 'The admin will be notified via email about this suspension.'
                  : 'The admin will be notified via email that their account has been reactivated.'}
              </p>

              <p className="warning">
                {statusChangeData.status === 'suspended'
                  ? 'The admin will no longer be able to access the system.'
                  : 'The admin will regain full access.'}
              </p>
            </div>

            <div className="modal-actions">
              <button
                className={statusChangeData.status === 'suspended' ? 'suspend-btn' : 'activate-btn'}
                onClick={updateAdminStatus}
              >
                {statusChangeData.status === 'suspended' ? 'Confirm Suspension' : 'Confirm Activation'}
              </button>
              <button
                className="cancel-btn"
                onClick={() => setStatusChangeData(prev => ({ ...prev, showModal: false }))}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CourtAdminManagement;
