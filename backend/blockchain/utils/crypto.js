const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const NodeRSA = require('node-rsa');
const fs = require('fs');
const path = require('path');

class CryptoService {
  constructor() {
    this.privateKey = null;
    this.publicKey = null;
    this.publicKeyFingerprint = null;
  }

  /**
   * Initialize RSA keys for signing
   * Call this during application startup
   */
  initialize() {
    try {
      const privateKeyPath = process.env.RSA_PRIVATE_KEY_PATH || './blockchain/keys/private.pem';
      const publicKeyPath = process.env.RSA_PUBLIC_KEY_PATH || './blockchain/keys/public.pem';

      // Check if key files exist
      if (!fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) {
        console.warn('⚠️  RSA keys not found. Run: node blockchain/utils/generateKeys.js');
        return false;
      }

      // Load private key
      const privateKeyContent = fs.readFileSync(privateKeyPath, 'utf8');
      this.privateKey = new NodeRSA(privateKeyContent);
      this.privateKey.setOptions({ signingScheme: 'pkcs1-sha256' });

      // Load public key
      const publicKeyContent = fs.readFileSync(publicKeyPath, 'utf8');
      this.publicKey = new NodeRSA(publicKeyContent);
      this.publicKey.setOptions({ signingScheme: 'pkcs1-sha256' });

      // Calculate fingerprint
      this.publicKeyFingerprint = crypto
        .createHash('sha256')
        .update(publicKeyContent)
        .digest('hex')
        .substring(0, 16);

      console.log('✅ RSA keys loaded successfully');
      console.log(`🔑 Public Key Fingerprint: ${this.publicKeyFingerprint}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to load RSA keys:', error.message);
      return false;
    }
  }

  /**
   * Calculate block hash (existing function, kept for compatibility)
   */
  calculateHash(index, previousHash, timestamp, data, nonce, secret) {
    const dataString = JSON.stringify(data);
    const input = `${index}${previousHash}${timestamp}${dataString}${nonce}${secret}`;
    return CryptoJS.SHA256(input).toString();
  }

  /**
   * 🆕 Calculate hash with merkle root
   * More secure - includes transaction integrity proof
   */
  calculateHashWithMerkle(index, previousHash, timestamp, data, nonce, secret, merkleRoot) {
    const dataString = JSON.stringify(data);
    const input = `${index}${previousHash}${timestamp}${dataString}${nonce}${secret}${merkleRoot}`;
    return CryptoJS.SHA256(input).toString();
  }

  /**
   * 🆕 Create merkle root from transaction data
   * Ensures data integrity at transaction level
   */
  createMerkleRoot(data) {
    // Convert data to array of hashes
    const dataString = JSON.stringify(data);
    const leaves = [];

    // Create leaf hashes for each key-value pair
    if (typeof data === 'object' && data !== null) {
      for (const [key, value] of Object.entries(data)) {
        const leafData = `${key}:${JSON.stringify(value)}`;
        const leafHash = CryptoJS.SHA256(leafData).toString();
        leaves.push(leafHash);
      }
    } else {
      // Single data point
      leaves.push(CryptoJS.SHA256(dataString).toString());
    }

    // Build merkle tree
    return this.buildMerkleTree(leaves);
  }

  /**
   * Build merkle tree from leaf hashes
   */
  buildMerkleTree(leaves) {
    if (leaves.length === 0) {
      return CryptoJS.SHA256('empty').toString();
    }

    if (leaves.length === 1) {
      return leaves[0];
    }

    const newLevel = [];

    // Pair up leaves and hash them together
    for (let i = 0; i < leaves.length; i += 2) {
      if (i + 1 < leaves.length) {
        // Hash pair
        const combined = leaves[i] + leaves[i + 1];
        newLevel.push(CryptoJS.SHA256(combined).toString());
      } else {
        // Odd number - hash with itself
        const combined = leaves[i] + leaves[i];
        newLevel.push(CryptoJS.SHA256(combined).toString());
      }
    }

    // Recursively build tree
    return this.buildMerkleTree(newLevel);
  }

  /**
   * 🆕 Sign block with RSA private key
   * Creates tamper-proof signature independent of BLOCKCHAIN_SECRET
   */
  signBlock(block) {
    if (!this.privateKey) {
      throw new Error('Private key not loaded. Run cryptoService.initialize() first.');
    }

    // Create signature payload with critical block data
    const signaturePayload = {
      index: block.index,
      hash: block.hash,
      previousHash: block.previousHash,
      timestamp: block.timestamp,
      merkleRoot: block.merkleRoot,
      entityId: block.entityId,
      dataType: block.dataType
    };

    const payloadString = JSON.stringify(signaturePayload);
    
    // Sign with private key
    const signature = this.privateKey.sign(payloadString, 'base64');

    return {
      signature,
      publicKeyFingerprint: this.publicKeyFingerprint
    };
  }

  /**
   * 🆕 Verify block signature with RSA public key
   * Detects if block was tampered with after signing
   */
  verifySignature(block, signature) {
    if (!this.publicKey) {
      throw new Error('Public key not loaded. Run cryptoService.initialize() first.');
    }

    try {
      // Reconstruct signature payload
      const signaturePayload = {
        index: block.index,
        hash: block.hash,
        previousHash: block.previousHash,
        timestamp: block.timestamp,
        merkleRoot: block.merkleRoot,
        entityId: block.entityId,
        dataType: block.dataType
      };

      const payloadString = JSON.stringify(signaturePayload);

      // Verify signature
      const isValid = this.publicKey.verify(payloadString, signature, 'utf8', 'base64');

      return {
        valid: isValid,
        method: 'RSA_SIGNATURE',
        publicKeyFingerprint: this.publicKeyFingerprint
      };

    } catch (error) {
      return {
        valid: false,
        method: 'RSA_SIGNATURE',
        error: error.message
      };
    }
  }

  /**
   * Check if hash matches difficulty requirement
   */
  hashMatchesDifficulty(hash, difficulty) {
    const requiredPrefix = '0'.repeat(difficulty);
    return hash.substring(0, difficulty) === requiredPrefix;
  }

  /**
   * Generate genesis block hash
   */
  generateGenesisHash() {
    return CryptoJS.SHA256('ECOURT_GENESIS_BLOCK').toString();
  }

  /**
   * 🆕 Verify public key fingerprint matches
   */
  verifyPublicKeyFingerprint(fingerprint) {
    return this.publicKeyFingerprint === fingerprint;
  }
}

// Export singleton instance
const cryptoService = new CryptoService();

module.exports = {
  cryptoService,
  
  // Legacy exports for backward compatibility
  calculateHash: (index, previousHash, timestamp, data, nonce, secret) => {
    return cryptoService.calculateHash(index, previousHash, timestamp, data, nonce, secret);
  },
  hashMatchesDifficulty: (hash, difficulty) => {
    return cryptoService.hashMatchesDifficulty(hash, difficulty);
  },
  generateGenesisHash: () => {
    return cryptoService.generateGenesisHash();
  }
};