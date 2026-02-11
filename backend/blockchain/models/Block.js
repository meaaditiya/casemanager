const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  index: {
    type: Number,
    required: true,
    unique: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  previousHash: {
    type: String,
    required: true
  },
  hash: {
    type: String,
    required: true,
    unique: true
  },
  nonce: {
    type: Number,
    required: true,
    default: 0
  },
  networkId: {
    type: String,
    required: true
  },
// In Block.js, line 39, REPLACE the dataType enum with:
dataType: {
  type: String,
  required: true,
  enum: [
    'case_filing', 
    'case_status_update', 
    'hearing_added', 
    'document_upload', 
    'case_approval', 
    'advocate_verification', 
    'video_meeting_scheduled',
    'document_requested',  
  ]
},
  entityId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    required: true,
    enum: ['advocate', 'litigant', 'clerk', 'admin']
  },
  
  // 🆕 IPFS ANCHORING - External Proof
  ipfs: {
    cid: {
      type: String,
      required: false, // Will be added after block creation
      index: true
    },
    anchoredAt: {
      type: Date,
      required: false
    },
    gateway: {
      type: String,
      default: 'https://ipfs.io/ipfs/'
    }
  },
  
  // 🆕 DIGITAL SIGNATURE - Independent verification
  signature: {
    value: {
      type: String,
      required: false // Will be added during mining
    },
    algorithm: {
      type: String,
      default: 'SHA256withRSA'
    },
    publicKeyFingerprint: {
      type: String,
      required: false
    }
  },
  
  // 🆕 MERKLE PROOF - For transaction integrity
  merkleRoot: {
    type: String,
    required: false
  },
  
  // 🆕 VERIFICATION STATUS - Track integrity checks
  verificationHistory: [{
    verifiedAt: Date,
    verifiedBy: String,
    status: {
      type: String,
      enum: ['VALID', 'INVALID', 'SUSPICIOUS']
    },
    method: {
      type: String,
      enum: ['IPFS_CHECK', 'SIGNATURE_CHECK', 'HASH_CHAIN_CHECK', 'MANUAL_AUDIT']
    },
    notes: String
  }]
}, {
  timestamps: true
});

// Indexes for performance
blockSchema.index({ hash: 1 });
blockSchema.index({ entityId: 1 });
blockSchema.index({ dataType: 1 });
blockSchema.index({ timestamp: -1 });
blockSchema.index({ 'ipfs.cid': 1 });
blockSchema.index({ 'signature.publicKeyFingerprint': 1 });

// 🆕 METHOD: Add IPFS anchor to block
blockSchema.methods.addIPFSAnchor = function(cid) {
  this.ipfs.cid = cid;
  this.ipfs.anchoredAt = new Date();
  return this.save();
};

// 🆕 METHOD: Add digital signature to block
blockSchema.methods.addSignature = function(signature, publicKeyFingerprint) {
  this.signature.value = signature;
  this.signature.publicKeyFingerprint = publicKeyFingerprint;
  return this.save();
};

// 🆕 METHOD: Record verification attempt
blockSchema.methods.recordVerification = function(status, method, verifiedBy, notes = '') {
  this.verificationHistory.push({
    verifiedAt: new Date(),
    verifiedBy,
    status,
    method,
    notes
  });
  return this.save();
};

// 🆕 VIRTUAL: Get IPFS public URL
blockSchema.virtual('ipfsUrl').get(function() {
  if (this.ipfs.cid) {
    return `${this.ipfs.gateway}${this.ipfs.cid}`;
  }
  return null;
});

const Block = mongoose.model('Block', blockSchema);

module.exports = Block;