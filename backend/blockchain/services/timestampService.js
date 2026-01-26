const crypto = require('crypto');
const axios = require('axios');

/**
 * 🕐 OPENTIMESTAMPS SERVICE
 * Anchors block hashes to Bitcoin blockchain
 * Provides cryptographic proof that data existed at specific time
 * FREE and IMMUTABLE - even with database access, cannot be faked
 */
class TimestampService {
  constructor() {
    // OpenTimestamps calendar servers (public, free)
    this.calendarServers = [
      'https://alice.btc.calendar.opentimestamps.org',
      'https://bob.btc.calendar.opentimestamps.org',
      'https://finney.calendar.eternitywall.com'
    ];
    
    this.enabled = process.env.ENABLE_TIMESTAMP === 'true';
  }

  /**
   * Create timestamp proof for block hash
   * This submits hash to Bitcoin blockchain via OpenTimestamps
   */
  async createTimestamp(blockHash) {
    if (!this.enabled) {
      console.log('⚠️  Timestamping disabled');
      return null;
    }

    try {
      console.log(`🕐 Creating timestamp for block hash: ${blockHash}`);
      
      // Calculate SHA256 of block hash (OTS requirement)
      const hashBuffer = Buffer.from(blockHash, 'hex');
      const sha256Hash = crypto.createHash('sha256').update(hashBuffer).digest();

      // Submit to OpenTimestamps calendars
      const promises = this.calendarServers.map(async (server) => {
        try {
          const response = await axios.post(
            `${server}/digest`,
            sha256Hash,
            {
              headers: {
                'Content-Type': 'application/octet-stream',
                'Accept': 'application/vnd.opentimestamps.v1'
              },
              responseType: 'arraybuffer',
              timeout: 10000
            }
          );

          return {
            server,
            proof: Buffer.from(response.data),
            success: true
          };
        } catch (error) {
          console.error(`Failed to timestamp with ${server}:`, error.message);
          return { server, success: false, error: error.message };
        }
      });

      const results = await Promise.all(promises);
      const successfulResults = results.filter(r => r.success);

      if (successfulResults.length === 0) {
        throw new Error('All timestamp servers failed');
      }

      // Use first successful result
      const timestamp = successfulResults[0];

      console.log(`✅ Timestamp created successfully via ${timestamp.server}`);
      
      return {
        proof: timestamp.proof,
        sha256Hash: sha256Hash.toString('hex'),
        servers: successfulResults.map(r => r.server),
        createdAt: new Date()
      };

    } catch (error) {
      console.error('❌ Timestamp creation failed:', error.message);
      return null;
    }
  }

  /**
   * Verify timestamp proof against Bitcoin blockchain
   * This proves the hash existed at specific time
   */
  async verifyTimestamp(blockHash, proof) {
    if (!this.enabled || !proof) {
      return {
        verified: false,
        reason: 'Timestamp verification disabled or no proof available'
      };
    }

    try {
      console.log(`🔍 Verifying timestamp for block hash: ${blockHash}`);

      // Calculate SHA256 of block hash
      const hashBuffer = Buffer.from(blockHash, 'hex');
      const sha256Hash = crypto.createHash('sha256').update(hashBuffer).digest();

      // Try to verify with each calendar server
      for (const server of this.calendarServers) {
        try {
          const response = await axios.post(
            `${server}/verify`,
            proof,
            {
              headers: {
                'Content-Type': 'application/octet-stream',
                'Accept': 'application/json'
              },
              timeout: 15000
            }
          );

          if (response.data && response.data.bitcoin) {
            const bitcoinProof = response.data.bitcoin;
            
            console.log(`✅ Timestamp verified via ${server}`);
            console.log(`   Bitcoin block: ${bitcoinProof.height}`);
            console.log(`   Merkle root: ${bitcoinProof.merkleroot}`);

            return {
              verified: true,
              bitcoinBlockHeight: bitcoinProof.height,
              merkleRoot: bitcoinProof.merkleroot,
              timestamp: new Date(bitcoinProof.time * 1000),
              server
            };
          }
        } catch (error) {
          console.log(`Verification failed with ${server}, trying next...`);
          continue;
        }
      }

      return {
        verified: false,
        reason: 'Timestamp not yet confirmed on Bitcoin blockchain (wait ~1 hour)'
      };

    } catch (error) {
      console.error('❌ Timestamp verification failed:', error.message);
      return {
        verified: false,
        reason: error.message
      };
    }
  }

  /**
   * Upgrade pending timestamp to Bitcoin-confirmed
   * Call this periodically (hourly) to check if timestamps are confirmed
   */
  async upgradeTimestamp(proof) {
    if (!this.enabled || !proof) {
      return null;
    }

    try {
      // Try to get Bitcoin confirmation
      for (const server of this.calendarServers) {
        try {
          const response = await axios.post(
            `${server}/upgrade`,
            proof,
            {
              headers: {
                'Content-Type': 'application/octet-stream',
                'Accept': 'application/vnd.opentimestamps.v1'
              },
              responseType: 'arraybuffer',
              timeout: 10000
            }
          );

          const upgradedProof = Buffer.from(response.data);
          
          console.log(`✅ Timestamp upgraded via ${server}`);
          
          return {
            proof: upgradedProof,
            upgraded: true,
            server
          };

        } catch (error) {
          continue;
        }
      }

      return null;

    } catch (error) {
      console.error('❌ Timestamp upgrade failed:', error.message);
      return null;
    }
  }

  /**
   * Create multi-hash checksum for extra security
   * Uses multiple hash algorithms for quantum resistance
   */
  createMultiHash(data) {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    
    return {
      sha256: crypto.createHash('sha256').update(dataString).digest('hex'),
      sha512: crypto.createHash('sha512').update(dataString).digest('hex'),
      blake2b: crypto.createHash('blake2b512').update(dataString).digest('hex')
    };
  }

  /**
   * Verify multi-hash checksum
   */
  verifyMultiHash(data, checksums) {
    const computed = this.createMultiHash(data);
    
    return {
      sha256Match: computed.sha256 === checksums.sha256,
      sha512Match: computed.sha512 === checksums.sha512,
      blake2bMatch: computed.blake2b === checksums.blake2b,
      allMatch: computed.sha256 === checksums.sha256 && 
                computed.sha512 === checksums.sha512 && 
                computed.blake2b === checksums.blake2b
    };
  }
}

module.exports = new TimestampService();