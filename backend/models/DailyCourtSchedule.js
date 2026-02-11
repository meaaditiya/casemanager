const mongoose = require('mongoose');

const dailyCourtScheduleSchema = new mongoose.Schema({
  schedule_id: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true
  },
  court_no: {
    type: String,
    required: true
  },
  court_allotted: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  scheduled_cases: [{
    case_num: String,
    hearing_id: mongoose.Schema.Types.ObjectId,
    listing_time_start: Date,
    listing_time_end: Date,
    estimated_duration: Number,
    actual_duration: Number,
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'dismissed', 'adjourned'],
      default: 'scheduled'
    },
    listing_order: Number,
    plaintiff_name: String,
    respondent_name: String,
    case_type: String,
    actual_start_time: Date,
    actual_end_time: Date
  }],
  total_estimated_time: Number,
  current_case_index: {
    type: Number,
    default: 0
  },
  court_start_time: Date,
  last_updated: Date,
  updated_by: String
}, {
  timestamps: true
});

dailyCourtScheduleSchema.index({ date: 1, court_no: 1 }, { unique: true });

module.exports = mongoose.model('DailyCourtSchedule', dailyCourtScheduleSchema);