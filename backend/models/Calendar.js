const mongoose = require('mongoose');
const courtCalendarSchema = new mongoose.Schema({
    calendar_id: {
      type: String,
      required: true,
      unique: true
    },
    district: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    is_holiday: {
      type: Boolean,
      default: false
    },
    holiday_reason: {
      type: String,
      default: ''
    },
    opening_time: {
      type: String,
      default: '09:00' // Default opening time
    },
    closing_time: {
      type: String,
      default: '17:00' // Default closing time
    },
    created_by: {
      admin_id: String,
      admin_name: String
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    }
  });
  
  // Create composite index for district and date to ensure uniqueness
  courtCalendarSchema.index({ district: 1, date: 1 }, { unique: true });
  module.exports =mongoose.model('CourtCalendar', courtCalendarSchema);