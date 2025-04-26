// 3. OTP Schema for verification
const mongoose = require('mongoose');
  const otpVerificationSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    purpose: { type: String, required: true },
    caseNum: { type: String, required: true },
    isUsed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
  });
  
  // Add index to automatically delete expired OTPs
  otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  
  module.exports = mongoose.model('OTPVerification', otpVerificationSchema);