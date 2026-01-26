// blockchain/services/ipfsService.js - FILEBASE VERSION
const { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand, CreateBucketCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

class IPFSService {
  constructor() {
    this.client = null;
    this.bucketName = process.env.FILEBASE_BUCKET || 'ecourt-blockchain';
    this.useIPFS = process.env.ENABLE_IPFS === 'true';
    this.gateway = process.env.IPFS_GATEWAY || 'https://ipfs.filebase.io/ipfs/';
    this.initialized = false;
  }

  async initialize() {
    if (!this.useIPFS) {
      console.log('⚠️  IPFS anchoring disabled. Set ENABLE_IPFS=true in .env');
      return false;
    }

    try {
      console.log('🔌 Initializing Filebase IPFS client...');
      console.log(`   Bucket: ${this.bucketName}`);

      // Create S3 client for Filebase
      this.client = new S3Client({
        endpoint: 'https://s3.filebase.com',
        region: 'us-east-1',
        credentials: {
          accessKeyId: process.env.FILEBASE_ACCESS_KEY,
          secretAccessKey: process.env.FILEBASE_SECRET_KEY
        }
      });

      // Test connection by checking if bucket exists
      try {
        await this.client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
        console.log('✅ Filebase bucket exists');
      } catch (error) {
        if (error.name === 'NotFound') {
          // Create bucket if it doesn't exist
          console.log('📦 Creating new bucket...');
          await this.client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
          console.log('✅ Bucket created successfully');
        } else {
          throw error;
        }
      }

      console.log('✅ Filebase IPFS client initialized successfully');
      this.initialized = true;
      return true;

    } catch (error) {
      console.error('❌ Filebase initialization failed:', error.message);
      console.error('   Check FILEBASE_ACCESS_KEY and FILEBASE_SECRET_KEY in .env');
      this.useIPFS = false;
      return false;
    }
  }

  async anchorBlock(block) {
    if (!this.useIPFS || !this.client) {
      console.log('⚠️  IPFS not available, skipping anchor');
      return null;
    }

    try {
      // Create immutable record
      const anchorData = {
        blockIndex: block.index,
        blockHash: block.hash,
        previousHash: block.previousHash,
        timestamp: block.timestamp,
        entityId: block.entityId,
        dataType: block.dataType,
        merkleRoot: block.merkleRoot,
        networkId: block.networkId,
        anchoredAt: new Date().toISOString(),
        signature: block.signature?.value || null,
        metadata: {
          version: '1.0.0',
          purpose: 'Blockchain Integrity Anchor',
          system: 'E-Court Legal Management'
        }
      };

      const jsonString = JSON.stringify(anchorData, null, 2);
      
      // Generate unique key for this block
      const key = `blocks/block-${block.index}-${block.hash.substring(0, 16)}.json`;
      
      console.log(`📤 Uploading block ${block.index} to Filebase IPFS...`);
      
      // Upload to Filebase (automatically pins to IPFS)
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: jsonString,
        ContentType: 'application/json',
        Metadata: {
          'block-index': block.index.toString(),
          'block-hash': block.hash,
          'entity-id': block.entityId
        }
      });

      const response = await this.client.send(command);

      // Get IPFS CID from response headers
      const cid = response.Metadata?.['x-amz-meta-cid'] || response.ETag?.replace(/"/g, '');
      
      console.log(`✅ Block ${block.index} anchored to IPFS`);
      console.log(`   CID: ${cid}`);
      console.log(`   URL: ${this.gateway}${cid}`);
      
      return {
        cid: cid,
        size: jsonString.length,
        url: `${this.gateway}${cid}`,
        key: key
      };

    } catch (error) {
      console.error('❌ IPFS anchoring failed:', error.message);
      console.error('   Error details:', error);
      return null;
    }
  }

  async verifyBlockAgainstIPFS(block) {
    if (!this.useIPFS || !this.client || !block.ipfs?.cid) {
      return {
        verified: false,
        error: 'IPFS anchor not available',
        method: 'IPFS_CHECK'
      };
    }

    try {
      // Try to get object by CID
      const key = `blocks/block-${block.index}-${block.hash.substring(0, 16)}.json`;
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const response = await this.client.send(command);
      
      // Read the stream
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      const bodyString = Buffer.concat(chunks).toString('utf-8');
      const anchorData = JSON.parse(bodyString);

      const discrepancies = [];

      if (anchorData.blockHash !== block.hash) {
        discrepancies.push({
          field: 'blockHash',
          ipfs: anchorData.blockHash,
          database: block.hash
        });
      }

      if (anchorData.previousHash !== block.previousHash) {
        discrepancies.push({
          field: 'previousHash',
          ipfs: anchorData.previousHash,
          database: block.previousHash
        });
      }

      if (anchorData.blockIndex !== block.index) {
        discrepancies.push({
          field: 'blockIndex',
          ipfs: anchorData.blockIndex,
          database: block.index
        });
      }

      if (anchorData.entityId !== block.entityId) {
        discrepancies.push({
          field: 'entityId',
          ipfs: anchorData.entityId,
          database: block.entityId
        });
      }

      const verified = discrepancies.length === 0;

      return {
        verified,
        method: 'IPFS_CHECK',
        discrepancies,
        ipfsData: anchorData,
        ipfsCid: block.ipfs.cid,
        ipfsUrl: `${this.gateway}${block.ipfs.cid}`
      };

    } catch (error) {
      return {
        verified: false,
        error: `IPFS verification failed: ${error.message}`,
        method: 'IPFS_CHECK'
      };
    }
  }

  async batchVerify(blocks) {
    const results = [];
    
    for (const block of blocks) {
      const verification = await this.verifyBlockAgainstIPFS(block);
      results.push({
        blockIndex: block.index,
        blockHash: block.hash,
        ...verification
      });
    }

    return results;
  }

  async getStatus() {
    return {
      enabled: this.useIPFS,
      initialized: this.initialized,
      provider: 'Filebase',
      bucket: this.bucketName,
      gateway: this.gateway,
      connected: this.client !== null
    };
  }
}

module.exports = new IPFSService();