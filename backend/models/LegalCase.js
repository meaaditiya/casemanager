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
  enum: [
    'Civil', 
    'Criminal',
    'CIV SUITS',
    'EXE PET',
    'MISC. CIV APPLN',
    'MRG PET',
    'MACP',
    'MISC CIV CASES',
    'CIVIL APPEAL',
    'ARBITN',
    'MISC. CIV APPEAL',
    'LAND REFRNC',
    'MAGISTRIAL CASES',
    'MISC. EXE.',
    'LABUR MAIN',
    'COMMERCIAL SUIT',
    'MISC. CRIM APLN',
    'INDUS MAIN',
    'CIVIL REV.',
    'OTHER TRIBNL',
    'INDUS MISC',
    'LABUR MISC',
    'ELCTN PET',
    'CO-OP MAIN',
    'COMMERCIAL APPEAL',
    'CO-OP APEAL MAIN',
    'CO-OP MISC.',
    'SESSIONS CASES',
    'CRIM APPEAL'
  ]
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
      remarks_plain_text: {
    type: String
  },
  digital_signature: {
    is_signed: { type: Boolean, default: false },
    signed_by: { type: String }, // admin_id or clerk_id
    signed_by_name: { type: String },
    signed_by_role: { type: String }, // 'admin' or 'clerk'
    signature_timestamp: { type: Date },
    signature_hash: { type: String }, // Hash of the hearing content for verification
  },
  listing_time_start: Date,
  listing_time_end: Date,
  estimated_duration: {
    type: Number,
    default: 60
  },
  actual_start_time: Date,
  actual_end_time: Date,
  hearing_status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'dismissed', 'adjourned'],
    default: 'scheduled'
  },
  court_no: String,
  listing_order: Number,
  is_listed_for_today: {
    type: Boolean,
    default: false
  },
  created_by: { type: String },
  created_by_type: { type: String }, // 'admin' or 'clerk'
  updated_by: { type: String },
  updated_by_type: { type: String },
  updated_at: { type: Date },
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
    case_embedding: {
  type: [Number],
  default: []
},

plaintiff_subject_embedding: {
  type: [Number],
  default: []
},

respondent_subject_embedding: {
  type: [Number],
  default: []
},

combined_case_embedding: {
  type: [Number],
  default: []
},

  // In LegalCase.js - Replace the documents section

documents: [{
 document_id: { type: String, required: true },
  document_type: { type: String, required: true },
  description: { type: String, default: '' },
  file_name: { type: String, required: false }, // CHANGED: removed required
  file_path: { type: String, required: false }, // CHANGED: removed required
  mime_type: { type: String, default: 'application/octet-stream' },
  size: { type: Number },
  
  // Request tracking
  requested_by_admin: { type: String }, // admin_id who requested
  requested_from: { type: String }, // party_id or advocate_id
  requested_from_type: { type: String, enum: ['litigant', 'advocate'] },
  request_date: { type: Date },
  submission_deadline: { type: Date },
  request_description: { type: String },
  
  // Upload tracking
  uploaded_by: { type: String },
  uploaded_by_type: { type: String, enum: ['litigant', 'advocate', 'admin', 'clerk'] },
  uploaded_date: { type: Date },
  
  // Verification tracking
  verification_status: { 
    type: String, 
    enum: ['pending_upload', 'uploaded_pending_review', 'verified', 'rejected'],
    default: 'pending_upload'
  },
  verified_by: { type: String }, // admin_id
  verified_by_name: { type: String },
  verification_date: { type: Date },
  verification_notes: { type: String },
  rejection_reason: { type: String },
  
  // Digital signature
  digital_signature: {
    is_signed: { type: Boolean, default: false },
    signed_by: { type: String }, // admin_id
    signed_by_name: { type: String },
    signature_timestamp: { type: Date },
    signature_hash: { type: String }
  }
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
  LegalCaseSchema.index({ case_num: 1 });
LegalCaseSchema.index({ district: 1 });
LegalCaseSchema.index({ 'plaintiff_details.party_id': 1 });
LegalCaseSchema.index({ 'respondent_details.party_id': 1 });
  module.exports= mongoose.model('LegalCase', LegalCaseSchema);