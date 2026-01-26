// FIXED: blockchain/services/blockchain.js
const Block = require('../models/Block');
const { cryptoService } = require('../utils/crypto');
const ipfsService = require('./ipfsService');
const timestampService = require('./timestampService');
const auditService = require('./auditService');
const { verifyBlockComplete } = require('../utils/verification');

class Blockchain {
  constructor() {
    this.secret = process.env.BLOCKCHAIN_SECRET;
    this.networkId = process.env.BLOCKCHAIN_NETWORK_ID;
    this.difficulty = parseInt(process.env.BLOCKCHAIN_DIFFICULTY) || 4;
    this.initialized = false;
  }

  async initialize() {
    const cryptoInitialized = cryptoService.initialize();
    
    // ✅ FIX: Ensure IPFS is properly initialized
    try {
      await ipfsService.initialize();
      console.log('✅ IPFS service initialization attempted');
    } catch (error) {
      console.error('⚠️ IPFS initialization failed:', error.message);
    }

    const blockCount = await Block.countDocuments();
    if (blockCount === 0) {
      await this.createGenesisBlock();
    } else {
      console.log('📚 Blockchain loaded - verification deferred');
    }

    this.initialized = true;
  }

  async createGenesisBlock() {
    console.log('🌱 Creating genesis block...');
    
    const genesisData = {
      message: 'E-Court Blockchain Genesis Block',
      system: 'Legal Case Management',
      version: '2.0',
      timestamp: new Date().toISOString()
    };

    const genesisHash = cryptoService.generateGenesisHash();
    
    const genesisBlock = new Block({
      index: 0,
      timestamp: new Date(),
      data: genesisData,
      previousHash: '0',
      hash: genesisHash,
      nonce: 0,
      networkId: this.networkId,
      dataType: 'case_filing',
      entityId: 'GENESIS',
      userId: 'SYSTEM',
      userType: 'admin',
      merkleRoot: cryptoService.createMerkleRoot(genesisData)
    });

    await genesisBlock.save();
    console.log('✅ Genesis block created');
  }

  async getLatestBlock() {
    const block = await Block.findOne().sort({ index: -1 });
    return block;
  }

  /**
   * ✅ FIXED MINING WITH PROPER IPFS ANCHORING
   */
  async mineBlock(data, dataType, entityId, userId, userType) {
    if (!this.initialized) {
      throw new Error('Blockchain not initialized');
    }

    // Validate transaction data
    if (!data || !dataType || !entityId || !userId || !userType) {
      throw new Error('Invalid transaction data - all fields required');
    }

    const latestBlock = await this.getLatestBlock();
    const newIndex = latestBlock.index + 1;
    
    // Use normalized timestamp
    const timestamp = new Date();
    timestamp.setMilliseconds(0);

    // Create merkle root for data integrity
    const merkleRoot = cryptoService.createMerkleRoot(data);

    let nonce = 0;
    let hash = '';

    // Mine block
    console.log(`⛏️ Mining block ${newIndex}...`);
    const miningStart = Date.now();

    do {
      hash = cryptoService.calculateHashWithMerkle(
        newIndex,
        latestBlock.hash,
        timestamp,
        data,
        nonce,
        this.secret,
        merkleRoot
      );
      nonce++;
    } while (!cryptoService.hashMatchesDifficulty(hash, this.difficulty));

    const miningTime = Date.now() - miningStart;
    console.log(`✅ Block mined in ${miningTime}ms with nonce ${nonce - 1}`);

    // Create block object
    const newBlock = new Block({
      index: newIndex,
      timestamp,
      data,
      previousHash: latestBlock.hash,
      hash,
      nonce: nonce - 1,
      networkId: this.networkId,
      dataType,
      entityId,
      userId,
      userType,
      merkleRoot: merkleRoot
    });

    // STEP 1: RSA Digital Signature
    if (cryptoService.privateKey) {
      try {
        const { signature, publicKeyFingerprint } = cryptoService.signBlock(newBlock);
        newBlock.signature.value = signature;
        newBlock.signature.publicKeyFingerprint = publicKeyFingerprint;
        console.log('✅ Block signed with RSA');
      } catch (error) {
        console.error('⚠️ Failed to sign block:', error.message);
      }
    }

    // ✅ STEP 2: IPFS Anchor - FIXED WITH BETTER ERROR HANDLING
    console.log('📌 Attempting IPFS anchoring...');
    try {
      // Check if IPFS is enabled and client is available
      if (!ipfsService.useIPFS) {
        console.warn('⚠️ IPFS is disabled in .env (ENABLE_IPFS=false)');
      } else if (!ipfsService.client) {
        console.error('❌ IPFS client not initialized - check IPFS configuration');
      } else {
        // Try to anchor with explicit error handling
        const ipfsAnchorData = await ipfsService.anchorBlock(newBlock);
        
        if (ipfsAnchorData && ipfsAnchorData.cid) {
          newBlock.ipfs.cid = ipfsAnchorData.cid;
          newBlock.ipfs.anchoredAt = new Date();
          console.log('✅ Block anchored to IPFS:', ipfsAnchorData.cid);
          console.log(`   IPFS URL: ${ipfsAnchorData.url}`);
        } else {
          console.error('❌ IPFS anchoring returned no CID');
          console.error('   Check IPFS service configuration and connectivity');
        }
      }
    } catch (error) {
      console.error('❌ IPFS anchoring failed:', error.message);
      console.error('   Stack:', error.stack);
      // Continue without IPFS - don't block the operation
    }

    // STEP 3: Save block
    let savedBlock;
    try {
      savedBlock = await newBlock.save();
      console.log(`✅ Block ${newIndex} saved to database`);
      
      // Log IPFS status
      if (savedBlock.ipfs && savedBlock.ipfs.cid) {
        console.log(`✅ Block ${newIndex} has IPFS anchor: ${savedBlock.ipfs.cid}`);
      } else {
        console.warn(`⚠️ Block ${newIndex} saved WITHOUT IPFS anchor`);
      }
    } catch (error) {
      console.error('❌ Failed to save block:', error.message);
      throw error;
    }

    // STEP 4: Immutable Audit Checkpoint
    try {
      const checkpoint = await auditService.createCheckpoint(savedBlock);
      console.log('✅ Immutable audit checkpoint created');
    } catch (error) {
      console.error('⚠️ Failed to create audit checkpoint:', error.message);
    }

    // STEP 5: OpenTimestamps (background)
    try {
      if (process.env.ENABLE_TIMESTAMP === 'true') {
        const timestampProof = await timestampService.createTimestamp(savedBlock.hash);
        if (timestampProof) {
          console.log('✅ OpenTimestamps created (will upgrade hourly)');
        }
      }
    } catch (error) {
      console.error('⚠️ Timestamping failed:', error.message);
    }

    return savedBlock;
  }

  async getBlocksByEntity(entityId) {
    return await Block.find({ entityId }).sort({ index: 1 });
  }

  async getBlocksByType(dataType) {
    return await Block.find({ dataType }).sort({ index: -1 });
  }

  async getBlockByHash(hash) {
    return await Block.findOne({ hash });
  }

  async getChainStats() {
    const totalBlocks = await Block.countDocuments();
    const latestBlock = await this.getLatestBlock();
    
    const typeCounts = await Block.aggregate([
      { $group: { _id: '$dataType', count: { $sum: 1 } } }
    ]);

    const ipfsAnchoredBlocks = await Block.countDocuments({ 
      'ipfs.cid': { $exists: true, $ne: null } 
    });

    const signedBlocks = await Block.countDocuments({ 
      'signature.value': { $exists: true, $ne: null } 
    });

    const AuditCheckpoint = require('../models/AuditCheckpoint');
    const auditCheckpoints = await AuditCheckpoint.countDocuments();
    const confirmedTimestamps = await AuditCheckpoint.countDocuments({
      'timestampProof.ots.verified': true
    });

    return {
      totalBlocks,
      latestBlockIndex: latestBlock ? latestBlock.index : 0,
      networkId: this.networkId,
      difficulty: this.difficulty,
      blocksByType: typeCounts,
      security: {
        ipfsAnchoredBlocks,
        signedBlocks,
        auditCheckpoints,
        confirmedTimestamps,
        ipfsAnchorPercentage: totalBlocks > 0 ? 
          ((ipfsAnchoredBlocks / totalBlocks) * 100).toFixed(2) : 0,
        signaturePercentage: totalBlocks > 0 ? 
          ((signedBlocks / totalBlocks) * 100).toFixed(2) : 0,
        auditCoverage: totalBlocks > 0 ? 
          ((auditCheckpoints / totalBlocks) * 100).toFixed(2) : 0
      }
    };
  }
}

module.exports = new Blockchain();
