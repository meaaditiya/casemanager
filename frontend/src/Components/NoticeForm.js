import React, { useState, useEffect } from 'react';
 import '../ComponentsCSS/Noticelistform.css';
 const NoticeForm = ({ notice, onSubmit, onCancel }) => {
   const [formData, setFormData] = useState({
     title: '',
     content: '',
     visibility: 'all',
     expiry_date: '',
     is_active: true
   });
   const [attachment, setAttachment] = useState(null);
   const [filePreview, setFilePreview] = useState('');
 
   useEffect(() => {
     if (notice) {
       setFormData({
         title: notice.title || '',
         content: notice.content || '',
         visibility: notice.visibility || 'all',
         expiry_date: notice.expiry_date ? new Date(notice.expiry_date).toISOString().split('T')[0] : '',
         is_active: notice.is_active !== undefined ? notice.is_active : true
       });
       
       if (notice.attachment) {
         setFilePreview(`/api/notices/${notice.notice_id}/attachment`);
       }
     }
   }, [notice]);
 
   const handleChange = (e) => {
     const { name, value, type, checked } = e.target;
     setFormData({
       ...formData,
       [name]: type === 'checkbox' ? checked : value
     });
   };
 
   const handleFileChange = (e) => {
     const file = e.target.files[0];
     if (file) {
       setAttachment(file);
       setFilePreview(URL.createObjectURL(file));
     }
   };
 
   const handleSubmit = (e) => {
     e.preventDefault();
     
     const submitData = new FormData();
     Object.keys(formData).forEach(key => {
       submitData.append(key, formData[key]);
     });
     
     if (attachment) {
       submitData.append('attachment', attachment);
     }
     
     onSubmit(submitData);
   };
 
   return (
     <div className="notice-form-container">
       <h2 className="notice-form-title">
         {notice ? 'Edit Notice' : 'Create New Notice'}
       </h2>
       
       <form onSubmit={handleSubmit}>
         <div className="form-group">
           <label className="form-label">Title</label>
           <input
             type="text"
             name="title"
             value={formData.title}
             onChange={handleChange}
             className="form-input"
             required
           />
         </div>
         
         <div className="form-group">
           <label className="form-label">Content</label>
           <textarea
             name="content"
             value={formData.content}
             onChange={handleChange}
             className="form-textarea"
             required
           />
         </div>
         
         <div className="form-group">
           <label className="form-label">Visibility</label>
           <select
             name="visibility"
             value={formData.visibility}
             onChange={handleChange}
             className="form-select"
           >
             <option value="all">Everyone</option>
             <option value="advocates_only">Advocates Only</option>
           </select>
         </div>
         
         <div className="form-group">
           <label className="form-label">Expiry Date (Optional)</label>
           <input
             type="date"
             name="expiry_date"
             value={formData.expiry_date}
             onChange={handleChange}
             className="form-input"
           />
         </div>
         
         <div className="form-group">
           <label className="checkbox-label">
             <input
               type="checkbox"
               name="is_active"
               checked={formData.is_active}
               onChange={handleChange}
               className="checkbox-input"
             />
             <span className="checkbox-text">Active</span>
           </label>
         </div>
         
         <div className="form-group">
           <label className="form-label">Attachment (Optional)</label>
           <input
             type="file"
             onChange={handleFileChange}
             className="form-file-input"
           />
           
           {filePreview && (
             <div className="file-preview">
               {filePreview.startsWith('blob:') ? (
                 <img 
                   src={filePreview} 
                   alt="Preview" 
                   className="file-preview-image" 
                 />
               ) : (
                 <div className="current-attachment">
                   <span className="current-attachment-label">Current attachment:</span>
                   <a 
                     href={filePreview} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="attachment-link"
                   >
                     View
                   </a>
                 </div>
               )}
             </div>
           )}
         </div>
         
         <div className="form-actions">
           <button
             type="button"
             onClick={onCancel}
             className="btn-cancel"
           >
             Cancel
           </button>
           <button
             type="submit"
             className="btn-submit"
           >
             {notice ? 'Update Notice' : 'Publish Notice'}
           </button>
         </div>
       </form>
     </div>
   );
 };
 
 export default NoticeForm;