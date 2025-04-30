const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const CourtAdminSchema = new mongoose.Schema({
    admin_id: { 
        type: String, 
        required: true, 
        unique: true 
    },
    district:{
        type:String ,
        required: true
    },
    name: { 
        type: String, 
        required: true 
    },
    court_name: { 
        type: String, 
        required: true 
    },
    contact: {
        email: { 
            type: String, 
            required: true, 
            unique: true 
        },
        mobile: { 
            type: String
        }
    },
    password: { 
        type: String, 
        required: true 
    },
    isEmailVerified: { 
        type: Boolean, 
        default: false 
    },
    emailOTP: String,
    otpExpiry: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    status: {
        type: String,
        enum: ['pending', 'active', 'suspended'],
        default: 'pending'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clerk',
    },
    lastLogin: Date,
    lastLogout: Date
}, {
    timestamps: true
});

// Pre-save hook to hash password if modified
CourtAdminSchema.pre('save', async function(next) {
    const admin = this;
    
    // Only hash the password if it has been modified (or is new)
    if (!admin.isModified('password')) return next();
    
    try {
        // Generate a salt
        const salt = await bcrypt.genSalt(10);
        
        // Hash the password along with the new salt
        const hash = await bcrypt.hash(admin.password, salt);
        
        // Override the plaintext password with the hashed one
        admin.password = hash;
        next();
    } catch (error) {
        return next(error);
    }
});

// Method to compare password for login
CourtAdminSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate random password
CourtAdminSchema.statics.generateRandomPassword = function() {
    const length = 10;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
};

module.exports = mongoose.model('CourtAdmin', CourtAdminSchema);