const mongoose = require('mongoose');
const LitigantSchema = new mongoose.Schema({
    party_id: { type: String, required: true, unique: true },
    party_type: {
        type: String,
        required: true,
        enum: ['plaintiff', 'defendant']
    },
    full_name: { type: String, required: true },
    parentage: { type: String, required: true },
    gender: {
        type: String,
        required: true,
        enum: ['male', 'female', 'other']
    },
    address: { 
        street: { type: String, required: true },
        city: { type: String, required: true },
        district: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String }
    },
    contact: {
        email: { type: String, required: true, unique: true },
        mobile: { type: String, required: true }
    },
    password: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },
    emailOTP: String,
    otpExpiry: Date,
    resetPasswordOTP: String,
    resetPasswordExpiry: Date,
    status: {
        type: String,
        enum: ['pending', 'active', 'suspended'],
        default: 'pending'
    },
    lastLogin: Date,
    lastLogout: Date,
    
    // Additional fields for case filing
    case_filing_details: {
        relation_type: {
            type: String,
            enum: ['FATHER', 'MOTHER', 'HUSBAND']
        },
        pin: String,
        age: Number,
        caste: String,
        nationality: {
            type: String,
            enum: ['INDIAN', 'OTHER']
        },
        occupation: String,
        subject: String,
        fax: String,
        phone: String
    },
    advocates: [{
        advocate_code: { type: String },
        advocate_name: { type: String }
    }]
}, {
    timestamps: true
});

// Indexes
module.exports= mongoose.model('Litigant' ,LitigantSchema );