const mongoose = require('mongoose');
  const LegalCaseSchema = new mongoose.Schema({
    // Court Information
    court: { 
      type: String, 
      required: true,
      enum: ['District & Sessions Court', 'Other']
    },
    case_type: { 
      type: String, 
      required: true,
      enum: ['Civil', 'Criminal']
    },
    
    // Add district field
    district: {
      type: String,
      required: true
    },
  
    // Plaintiff/Applicant Details
    plaintiff_details: {
      party_id: { type: String },
      name: { type: String, required: true },
      father_mother_husband: { type: String },
      address: { type: String },
      pin: { type: String },
      sex: { type: String },
      age: { type: Number },
      caste: { type: String },
      nationality: { type: String },
      if_other_mention: { type: String },
      occupation: { type: String },
      email: { 
        type: String, 
        match: [/^\w+([.-]?\w+)@\w+([.-]?\w+)(\.\w{2,3})+$/, 'Please fill a valid email address']
      },
      phone: { type: String },
      mobile: { type: String },
      fax: { type: String },
      subject: { type: String },
      advocate_id: { type: String },
      advocate: { type: String }
    },
    // Respondent/Opponent Details
    respondent_details: {
      party_id: { type: String },
      name: { type: String, required: true },
      father_mother_husband: { type: String },
      address: { type: String },
      pin: { type: String },
      sex: { type: String },
      age: { type: Number },
      caste: { type: String },
      nationality: { type: String },
      if_other_mention: { type: String },
      occupation: { type: String },
      email: { 
        type: String, 
        match: [/^\w+([.-]?\w+)@\w+([.-]?\w+)(\.\w{2,3})+$/, 'Please fill a valid email address']
      },
      phone: { type: String },
      mobile: { type: String },
      fax: { type: String },
      subject: { type: String },
      advocate_id: { type: String },
      advocate: { type: String }
    },
  
    // Additional Criminal-Specific Details
    police_station_details: {
      police_station: { type: String },
      fir_no: { type: String },
      fir_year: { type: Number },
      date_of_offence: { type: Date }
    },
  
    // Lower Court Details
    lower_court_details: {
      court_name: { type: String },
      case_no: { type: String },
      decision_date: { type: Date }
    },
  
    // Main Matter Details
    main_matter_details: {
      case_type: { type: String },
      case_no: { type: String },
      year: { type: Number }
    },
  
    // Hearing Management
    hearings: [{
      hearing_date: { type: Date, required: true },
      hearing_type: {
        type: String,
        required: true,
        enum: ['Initial', 'Intermediate', 'Final', 'Adjournment']
      },
      remarks: { type: String },
      next_hearing_date: { type: Date },
      attachments: [{
        filename: { type: String, required: true },
        originalname: { type: String, required: true },
        mimetype: { type: String, required: true },
        path: { type: String, required: true },
        size: { type: Number, required: true },
        uploaded_at: { type: Date, default: Date.now }
      }]
    }], 
    // Case Status
    status: {
      type: String,
      enum: [
        'Filed', 
        'Pending', 
        'Under Investigation', 
        'Hearing in Progress', 
        'Awaiting Judgment', 
        'Disposed', 
        'Appealed'
      ],
      default: 'Filed'
    },
  
    // Case Approval
    case_approved: { 
      type: Boolean, 
      default: false 
    },
    case_num: { 
        type: String,
        unique: true,
      },
      case_no: {
        type: String,
        unique: true,
        sparse: true  // This allows multiple null values
    },
    // Office Use Details
    for_office_use_only: {
      case_type: { type: String },
      filing_no: { type: String },
      filing_date: { type: Date },
      objection_red_date: { type: Date },
      objection_compliance_date: { type: Date },
      registration_no: { type: String },
      registration_date: { type: Date },
      listing_date: { type: Date },
      court_allotted: { type: String },
      allocation_date: { type: Date },
      case_code: { type: String },
      
      // Additional fields for Criminal Cases
      filing_done_by: { type: String },
      objection_raised_by: { type: String },
      registration_done_by: { type: String },
      allocation_done_by: { type: String }
    },
    documents: [{
      document_id: { type: String, required: true },
  document_type: { type: String, required: true },
  description: { type: String, default: '' },
  file_name: { type: String, required: true },
  file_path: { type: String, required: true },  // Store relative path
  mime_type: { type: String, default: 'application/octet-stream' },
  size: { type: Number },
  uploaded_date: { type: Date, default: Date.now },
  uploaded_by: { type: String, required: false }
    }],
    videoMeeting: {
      meetingLink: { type: String },
      startDateTime: { type: Date },
      endDateTime: { type: Date },
      isActive: { type: Boolean, default: false },
      createdBy: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
,  
// Add this to the existing LegalCase schema
advocate_requests: [{
  advocate_id: { 
    type: String, 
    required: true 
  },
  advocate_name: { 
    type: String, 
    required: true 
  },
  party_type: { 
    type: String, 
    enum: ['plaintiff', 'respondent'],
    required: true 
  },
  requested_by: { 
    type: String, 
    enum: ['advocate', 'litigant'],
    required: true 
  },
  litigant_id: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requested_at: { 
    type: Date, 
    default: Date.now 
  },
  updated_at: { 
    type: Date, 
    default: Date.now 
  }
}],
// Add to LegalCaseSchema

    // Timestamps
    created_at: { type: Date, default: Date.now },
    last_updated: { type: Date, default: Date.now }
  }, {
    timestamps: true
  });
  
  // Pre-save middleware to update last_updated
  LegalCaseSchema.pre('save', function(next) {
    this.last_updated = Date.now();
    next();
  });
  module.exports= mongoose.model('LegalCase', LegalCaseSchema);