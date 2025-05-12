import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import '../ComponentsCSS/NoticeBoard.css';
import aadiImage from "../images/aadiimage4.svg";

const NoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const fetchNotices = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('https://ecourt-yr51.onrender.com/api/notices', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotices(response.data.notices);
        // Add a small delay before fade-in animation
        setTimeout(() => setFadeIn(true), 100);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch notices');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotices();
  }, []);

  const handleViewDetails = (notice) => {
    setFadeIn(false);
    setTimeout(() => {
      setSelectedNotice(notice);
      setTimeout(() => setFadeIn(true), 50);
    }, 300);
  };

  const handleCloseDetails = () => {
    setFadeIn(false);
    setTimeout(() => {
      setSelectedNotice(null);
      setTimeout(() => setFadeIn(true), 50);
    }, 300);
  };

  const handleAttachmentClick = async (noticeId) => {
    try {
      // Get the authentication token
      const token = localStorage.getItem('token');
      
      // Make an authenticated request for the attachment
      const response = await axios({
        url: `https://ecourt-yr51.onrender.com/api/notices/${noticeId}/attachment`,
        method: 'GET',
        headers: { 
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob' // Important for file downloads
      });
      
      // Get content type from response
      const contentType = response.headers['content-type'];
      
      // Create a blob with the correct content type
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Extract filename from content-disposition header
      let filename = 'attachment';
      const contentDisposition = response.headers['content-disposition'];
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          // Remove quotes if present
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // If no extension in filename and we have content type, add appropriate extension
      if (!filename.includes('.') && contentType) {
        const extension = getFileExtensionFromMimeType(contentType);
        if (extension) {
          filename = `${filename}.${extension}`;
        }
      }
      
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
    } catch (err) {
      console.error('Error downloading attachment:', err);
      alert('Failed to download attachment. Please try again.');
    }
  };

  // Helper function to determine file extension from MIME type
  const getFileExtensionFromMimeType = (mimeType) => {
    const mimeToExt = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'text/plain': 'txt',
      'text/html': 'html',
      'text/css': 'css',
      'text/javascript': 'js',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
      'application/zip': 'zip',
      'application/x-rar-compressed': 'rar',
      'audio/mpeg': 'mp3',
      'video/mp4': 'mp4'
    };
    
    return mimeToExt[mimeType] || '';
  };

  if (isLoading) {
    return (
      <div className="notice-board-loading">
        <div className="spinner">
          <div className="double-bounce1"></div>
          <div className="double-bounce2"></div>
        </div>
        <p>Loading notices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notice-board-error">
        <div className="error-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h3>Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!notices || notices.length === 0) {
    return (
      <div className="notice-board-empty">
        <div className="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
          </svg>
        </div>
        <h3>No Notices Available</h3>
        <p>There are no notices published at this time. Please check back later.</p>
      </div>
    );
  }

  return (
    <div className={`notice-board-container ${fadeIn ? 'fade-in' : 'fade-out'}`}>
      <div className="notice-board-header">
        <div className="header-content">
          <div className="title-section">
            <h1>Official Court Notice Board</h1>
            <div className="header-divider"></div>
            <p className="subtitle">Important announcements and notifications</p>
          </div>
          <div className="logo-section">
            <img src= {aadiImage} alt="Court Official Seal" className="court-logo" />
          </div>
        </div>
      </div>
      
      {selectedNotice ? (
        <div className="notice-detail">
          <div className="notice-detail-paper">
            <div className="detail-header">
              <div className="header-left">
                <h2>{selectedNotice.title}</h2>
                <div className="notice-detail-meta">
                  <div className="meta-item">
                    <svg xmlns="http://www.w3.org/2000/svg" className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>Published: {format(new Date(selectedNotice.published_date), 'MMMM dd, yyyy')}</span>
                  </div>
                  
                  {selectedNotice.expiry_date && (
                    <div className="meta-item">
                      <svg xmlns="http://www.w3.org/2000/svg" className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>Expires: {format(new Date(selectedNotice.expiry_date), 'MMMM dd, yyyy')}</span>
                    </div>
                  )}
                  
                  <div className="meta-item">
                    <svg xmlns="http://www.w3.org/2000/svg" className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>By: {selectedNotice.published_by.admin_name}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleCloseDetails}
                className="close-button"
                aria-label="Close notice details"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="notice-detail-content">
              {selectedNotice.content}
            </div>
            
            {selectedNotice.attachment && (
              <div className="notice-attachment">
                <button 
                  onClick={() => handleAttachmentClick(selectedNotice.notice_id)}
                  className="attachment-button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="attachment-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Download Attachment</span>
                </button>
              </div>
            )}
            
            <div className="notice-footer">
              <div className="notice-stamp">
                <span>OFFICIAL COURT NOTICE</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          
        
          
          <div className="notice-grid">
            {notices.map((notice) => (
              <div key={notice.notice_id} className="notice-card">
                <div className="card-pin"></div>
                <div className="card-content">
                  <div className="notice-card-header">
                    <h3>{notice.title}</h3>
                    {notice.visibility === 'advocates_only' && (
                      <span className="advocate-badge">
                        <svg xmlns="http://www.w3.org/2000/svg" className="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                        <span>Advocates Only</span>
                      </span>
                    )}
                  </div>
                  
                  <div className="notice-date">
                    <svg xmlns="http://www.w3.org/2000/svg" className="date-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>{format(new Date(notice.published_date), 'MMMM dd, yyyy')}</span>
                  </div>
                  
                  <p className="notice-excerpt">
                    {notice.content.length > 150 ? 
                      `${notice.content.substring(0, 150)}...` : 
                      notice.content
                    }
                  </p>
                  
                  <div className="notice-card-footer">
                    <button
                      onClick={() => handleViewDetails(notice)}
                      className="read-more-button"
                    >
                      <span>View Notice</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </button>
                    
                    {notice.attachment && (
                      <div className="has-attachment" title="This notice has an attachment">
                        <svg xmlns="http://www.w3.org/2000/svg" className="attachment-indicator" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default NoticeBoard;