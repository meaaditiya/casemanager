const blockchain = require('./blockchain/services/blockchain');
const ipfsService = require('./blockchain/services/ipfsService');
const { cryptoService } = require('./blockchain/utils/crypto');

/**
 * Initialize blockchain system on server startup
 * Call this in your main server file (app.js or server.js)
 */
const initializeBlockchain = async () => {
  console.log('\n🔗 Initializing Blockchain System...\n');
  
  try {
    // Step 1: Initialize cryptographic services
    console.log('1️⃣ Loading RSA keys...');
    const cryptoInitialized = cryptoService.initialize();
    
    if (cryptoInitialized) {
      console.log('✅ RSA keys loaded successfully');
      console.log(`   Public Key Fingerprint: ${cryptoService.publicKeyFingerprint}`);
    } else {
      console.warn('⚠️  RSA keys not found');
      console.warn('   Run: node blockchain/utils/generateKeys.js');
      console.warn('   Blockchain will operate without digital signatures');
    }
    
    // Step 2: Initialize IPFS service
    console.log('\n2️⃣ Connecting to IPFS...');
    await ipfsService.initialize();
    
    const ipfsStatus = await ipfsService.getStatus();
    if (ipfsStatus.enabled && ipfsStatus.connected) {
      console.log('✅ IPFS connected successfully');
      console.log(`   Gateway: ${ipfsStatus.gateway}`);
    } else if (ipfsStatus.enabled) {
      console.warn('⚠️  IPFS enabled but connection failed');
      console.warn('   Check IPFS configuration in .env');
    } else {
      console.warn('⚠️  IPFS anchoring disabled');
      console.warn('   Set ENABLE_IPFS=true in .env to enable');
    }
    
    // Step 3: Initialize blockchain
    console.log('\n3️⃣ Initializing blockchain...');
    await blockchain.initialize();
    
    // Step 4: Get blockchain stats
    const stats = await blockchain.getChainStats();
    console.log('\n✅ Blockchain initialized successfully');
    console.log(`   Total Blocks: ${stats.totalBlocks}`);
    console.log(`   Latest Block: ${stats.latestBlockIndex}`);
    console.log(`   Network ID: ${stats.networkId}`);
    console.log(`   Mining Difficulty: ${'0'.repeat(stats.difficulty)}`);
    
    if (stats.security) {
      console.log(`\n📊 Security Status:`);
      console.log(`   IPFS Anchored: ${stats.security.ipfsAnchoredBlocks}/${stats.totalBlocks} (${stats.security.ipfsAnchorPercentage}%)`);
      console.log(`   Digitally Signed: ${stats.security.signedBlocks}/${stats.totalBlocks} (${stats.security.signaturePercentage}%)`);
    }
    
    // Step 5: Quick integrity check
    console.log('\n4️⃣ Running integrity check...');
    const { verifyChain } = require('./blockchain/utils/verification');
    const verification = await verifyChain(
      process.env.BLOCKCHAIN_SECRET,
      parseInt(process.env.BLOCKCHAIN_DIFFICULTY)
    );
    
    if (verification.valid) {
      console.log(`✅ Blockchain integrity verified (${verification.integrityScore}% valid)`);
    } else {
      console.error(`❌ Blockchain integrity check FAILED!`);
      console.error(`   Failed blocks: ${verification.failedBlocks}/${verification.totalBlocks}`);
      console.error(`   Layer failures:`, verification.summary);
      console.error('   🚨 IMMEDIATE INVESTIGATION REQUIRED 🚨');
    }
    
    console.log('\n🎉 Blockchain system ready!\n');
    
    return {
      success: true,
      stats,
      verification,
      features: {
        rsaSignatures: cryptoInitialized,
        ipfsAnchoring: ipfsStatus.enabled && ipfsStatus.connected,
        merkleTrees: true
      }
    };
    
  } catch (error) {
    console.error('\n❌ Blockchain initialization failed:', error);
    console.error('   Server will continue but blockchain features may be limited\n');
    
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Graceful shutdown handler
 */
const shutdownBlockchain = async () => {
  console.log('\n🔗 Shutting down blockchain system...');
  
  try {
    // Perform any cleanup if needed
    console.log('✅ Blockchain shutdown complete\n');
  } catch (error) {
    console.error('❌ Error during blockchain shutdown:', error);
  }
};

module.exports = {
  initializeBlockchain,
  shutdownBlockchain
};