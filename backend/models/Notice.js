const mongoose = require('mongoose');
const NoticeSchema = new mongoose.Schema({
    notice_id: { 
      type: String, 
      required: true, 
      unique: true 
    },
    title: { 
      type: String, 
      required: true 
    },
    content: { 
      type: String, 
      required: true 
    },
    district: { 
      type: String, 
      required: true 
    },
    visibility: {
      type: String,
      enum: ['all', 'advocates_only'],
      default: 'all'
    },
    attachment: {
      filename: String,
      path: String,
      mimetype: String,
      uploadDate: Date
    },
    published_by: {
      admin_id: String,
      admin_name: String
    },
    published_date: {
      type: Date,
      default: Date.now
    },
    expiry_date: {
      type: Date
    },
    is_active: {
      type: Boolean,
      default: true
    }
  }, {
    timestamps: true
  });
  module.exports= mongoose.model('Notice', NoticeSchema);
  