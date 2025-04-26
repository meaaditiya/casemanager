const mongoose = require('mongoose');

// Advocate Schema (for registered users)
const AdvocateSchema = new mongoose.Schema({
    advocate_id: { type: String, required: true, unique: true },
    enrollment_no: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    fathers_name: String,
    gender: { type: String, required: true },
    dob: { type: Date, required: true },
    contact: {
        email: String
    },
    address: String,
    district: { type: String, required: true },
    date_of_registration: Date,
    practice_details: {
        district_court: Boolean,
        high_court: Boolean,
        state: String,
        district: String,
        high_court_bench: String
    },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },
    emailOTP: String,
    otpExpiry: Date,
    iCOP_number: {
        type: String,
        required: true,
        unique: true
    },
    cop_document: {
        filename: String,
        path: String,
        uploadDate: Date
    },
    barId: {
        type: String,
        required: true,
        unique: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'suspended'],
        default: 'pending'
    },
    profilePicture: {
        filename: String,
        path: String,
        uploadDate: Date
    },
    verificationNotes: String,
    verifiedBy: String,
    verificationDate: Date,
    lastLogin: Date
}, {
    timestamps: true
});

// Export the model
module.exports = mongoose.model('Advocate', AdvocateSchema);