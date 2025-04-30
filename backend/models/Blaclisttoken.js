const mongoose = require('mongoose');
const TokenBlacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    user_id: {
        type: String,
        required: true
    },
    user_type: {
        type: String,
        required: true,
        enum: ['advocate', 'litigant', 'clerk','admin']
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400
    }
});

module.exports= mongoose.model('BlacklistedToken', TokenBlacklistSchema);