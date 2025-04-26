const mongoose = require('mongoose');
const ClerkSchema = new mongoose.Schema({
    clerk_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    gender: { 
        type: String,
        enum: ['male', 'female', 'other'],
        required: true 
    },
    district: { type: String, required: true },
    court_name: { type: String, required: true },
    court_no: { type: String, required: true },
    contact: {
        email: { type: String, required: true, unique: true },
        mobile: { type: String, required: true }
    },
    password: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },
    emailOTP: String,
    otpExpiry: Date,
    status: {
        type: String,
        enum: ['pending', 'active', 'suspended'],
        default: 'pending'
    },
    lastLogin: Date,
    lastLogout: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('Clerk', ClerkSchema);
