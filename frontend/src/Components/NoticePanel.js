import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import NoticeForm from './NoticeForm';
import NoticeList from './NoticeList';
import '../ComponentsCSS/NoticePanel.css';

const NoticePanel = () => {
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  
  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/notices', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotices(response.data.notices);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch notices');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchNotices();
  }, []);
  
  const handleAddNew = () => {
    setSelectedNotice(null);
    setShowForm(true);
  };
  
  const handleEdit = (notice) => {
    setSelectedNotice(notice);
    setShowForm(true);
  };
  
  const handleDelete = async (noticeId) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/notices/${noticeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotices();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete notice');
    }
  };
  
  const handleFormSubmit = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      
      if (selectedNotice) {
        // Update existing notice
        await axios.put(`http://localhost:5000/api/notices/${selectedNotice.notice_id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Create new notice
        await axios.post('http://localhost:5000/api/notices', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      setShowForm(false);
      fetchNotices();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save notice');
    }
  };
  
  return (
    <div className="np-container">
      <div className="np-header">
        <h1 className="np-title">Notice Panel</h1>
        <button
          onClick={handleAddNew}
          className="np-add-button"
        >
          Add New Notice
        </button>
      </div>
      
      {error && (
        <div className="np-error">
          {error}
        </div>
      )}
      
      {showForm ? (
        <NoticeForm
          notice={selectedNotice}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <NoticeList
          notices={notices}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default NoticePanel;