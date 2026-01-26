const mongoose = require('mongoose');

const auditCheckpointSchema = new mongoose.Schema({
  // Block reference
  blockIndex: {
    type: Number,
    required: true,
    index: true
  },
  blockHash: {
    type: String,
    required: true,
    index: true
  },
  
  // Original data fingerprint (before any tampering)
  dataFingerprint: {
    type: String,
    required: true
  },
  
  // Timestamp proofs (EXTERNAL - cannot be modified)
  timestampProof: {
    // OpenTimestamps proof (Bitcoin-backed)
    ots: {
      proof: Buffer,              // Binary OTS proof
      merkleRoot: String,         // Bitcoin merkle root
      bitcoinBlockHeight: Number, // Bitcoin block number
      verified: Boolean,
      verifiedAt: Date
    },
    
    // RFC 3161 timestamp (if using paid service)
    rfc3161: {
      token: Buffer,              // TSA response token
      tsaUrl: String,             // Timestamp authority URL
      serialNumber: String,
      verified: Boolean
    }
  },
  
  // Cryptographic commitments
  commitments: {
    merkleRoot: String,           // Merkle root of all data
    previousBlockHash: String,    // Chain linkage
    signatureHash: String,        // Hash of RSA signature
    ipfsCid: String              // IPFS anchor CID
  },
  
  // Verification checksums (multi-hash for extra security)
  checksums: {
    sha256: String,
    sha512: String,
    blake2b: String              // Quantum-resistant hash
  },
  
  // Metadata (immutable)
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
    immutable: true               // Cannot be changed
  },
  entityId: {
    type: String,
    required: true,
    immutable: true
  },
  dataType: {
    type: String,
    required: true,
    immutable: true
  },
  
  // Cross-verification (distributed consensus)
  distributedProofs: [{
    nodeId: String,               // Verification node ID
    checksum: String,             // Node's computed checksum
    timestamp: Date,
    signature: String             // Node's signature
  }]
}, {
  timestamps: true,
  collection: 'audit_checkpoints'
});

// 🔒 PREVENT MODIFICATIONS
auditCheckpointSchema.pre('save', function(next) {
  // Only allow creation, not updates
  if (!this.isNew) {
    return next(new Error('Audit checkpoints are immutable and cannot be modified'));
  }
  next();
});

// 🔒 DISABLE UPDATE OPERATIONS
auditCheckpointSchema.pre('updateOne', function() {
  throw new Error('Audit checkpoints cannot be updated');
});

auditCheckpointSchema.pre('findOneAndUpdate', function() {
  throw new Error('Audit checkpoints cannot be updated');
});

auditCheckpointSchema.pre('update', function() {
  throw new Error('Audit checkpoints cannot be updated');
});

// Indexes for fast lookups
auditCheckpointSchema.index({ blockIndex: 1 });
auditCheckpointSchema.index({ blockHash: 1 });
auditCheckpointSchema.index({ entityId: 1 });
auditCheckpointSchema.index({ createdAt: -1 });

const AuditCheckpoint = mongoose.model('AuditCheckpoint', auditCheckpointSchema);

module.exports = AuditCheckpoint;