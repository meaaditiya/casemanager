import React from 'react';
import { format } from 'date-fns';
import '../ComponentsCSS/Noticelistform.css';
const NoticeList = ({ notices, isLoading, onEdit, onDelete }) => {
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!notices || notices.length === 0) {
    return (
      <div className="empty-state">
        No notices found. Create your first notice by clicking the "Add New Notice" button.
      </div>
    );
  }

  return (
    <div className="notice-list-container">
      <table className="notice-table">
        <thead className="table-header">
          <tr>
            <th className="table-header-cell">
              Title
            </th>
            <th className="table-header-cell">
              Visibility
            </th>
            <th className="table-header-cell">
              Published Date
            </th>
            <th className="table-header-cell">
              Status
            </th>
            <th colSpan="2" className="table-header-cell">
  Actions
</th>

          </tr>
        </thead>
        <tbody className="table-body">
          {notices.map((notice) => (
            <tr key={notice.notice_id} className="table-row">
              <td className="table-cell">
                <div className="notice-title">{notice.title}</div>
              </td>
              <td className="table-cell">
                <span className={`badge ${
                  notice.visibility === 'advocates_only' 
                    ? 'badge-purple' 
                    : 'badge-green'
                }`}>
                  {notice.visibility === 'advocates_only' ? 'Advocates Only' : 'Everyone'}
                </span>
              </td>
              <td className="table-cell">
                <span className="date-text">
                  {format(new Date(notice.published_date), 'PPP')}
                </span>
              </td>
              <td className="table-cell">
                <span className={`badge ${
                  notice.is_active 
                    ? 'badge-green' 
                    : 'badge-red'
                }`}>
                  {notice.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="table-cell">
                <button
                  onClick={() => onEdit(notice)}
                  className="btn-edit"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(notice.notice_id)}
                  className="btn-delete"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NoticeList;