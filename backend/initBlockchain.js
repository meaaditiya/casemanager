const blockchain = require('./blockchain/services/blockchain');
const ipfsService = require('./blockchain/services/ipfsService');
const { cryptoService } = require('./blockchain/utils/crypto');

/**
 * Initialize blockchain system on server startup
 * Call this in your main server file (app.js or server.js)
 */
const initializeBlockchain = async () => {
  console.log('🔗 Initializing Blockchain System...');
  
  try {
    // Step 1: Initialize cryptographic services
    cryptoService.initialize();
    
    // Step 2: Initialize IPFS service
    await ipfsService.initialize();
    
    // Step 3: Initialize blockchain
    await blockchain.initialize();
    
    console.log('✅ Blockchain system ready!');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Blockchain initialization failed:', error);
    throw error; // Propagate error instead of silently continuing
  }
};

/**
 * Graceful shutdown handler
 */
const shutdownBlockchain = async () => {
  console.log('🔗 Shutting down blockchain system...');
  // Add cleanup if services need it in the future
  console.log('✅ Blockchain shutdown complete');
};

module.exports = {
  initializeBlockchain,
  shutdownBlockchain
};