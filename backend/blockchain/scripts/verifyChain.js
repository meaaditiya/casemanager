require('dotenv').config();
const mongoose = require('mongoose');
const Block = require('../models/Block');
const AuditCheckpoint = require('../models/AuditCheckpoint');
const { verifyChain } = require('../utils/verification');
const auditService = require('../services/auditService');

/**
 * 🔍 BLOCKCHAIN VERIFICATION DEMO
 * Demonstrates tampering detection with all 5 security layers
 */

async function verifyBlockchain() {
  try {
    console.log('🔍 Starting blockchain verification...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get chain statistics
    const totalBlocks = await Block.countDocuments();
    const totalCheckpoints = await AuditCheckpoint.countDocuments();
    const confirmedTimestamps = await AuditCheckpoint.countDocuments({
      'timestampProof.ots.verified': true
    });

    console.log('📊 Blockchain Statistics:');
    console.log(`   Total Blocks: ${totalBlocks}`);
    console.log(`   Audit Checkpoints: ${totalCheckpoints}`);
    console.log(`   Bitcoin-Confirmed: ${confirmedTimestamps}`);
    console.log(`   Coverage: ${((totalCheckpoints / totalBlocks) * 100).toFixed(1)}%\n`);

    // Verify entire chain
    console.log('🔍 Running 5-layer verification on entire chain...\n');
    
    const verificationResult = await verifyChain(
      process.env.BLOCKCHAIN_SECRET,
      parseInt(process.env.BLOCKCHAIN_DIFFICULTY)
    );

    console.log('📊 Verification Results:');
    console.log(`   Chain Valid: ${verificationResult.valid ? '✅ YES' : '❌ NO'}`);
    console.log(`   Integrity Score: ${verificationResult.integrityScore}%`);
    console.log(`   Verified Blocks: ${verificationResult.verifiedBlocks}`);
    console.log(`   Failed Blocks: ${verificationResult.failedBlocks}\n`);

    if (verificationResult.summary) {
      console.log('🔍 Layer-by-Layer Failures:');
      console.log(`   Hash Chain: ${verificationResult.summary.hashChainFailures}`);
      console.log(`   Merkle Tree: ${verificationResult.summary.merkleTreeFailures}`);
      console.log(`   Digital Signature: ${verificationResult.summary.signatureFailures}`);
      console.log(`   IPFS Anchor: ${verificationResult.summary.ipfsAnchorFailures}`);
      console.log(`   🆕 Audit Checkpoint: ${verificationResult.summary.auditCheckpointFailures}\n`);
    }

    // Show failed blocks if any
    if (verificationResult.failedBlocks > 0) {
      console.log('⚠️  FAILED BLOCKS:\n');
      
      const failedBlocks = verificationResult.blockResults.filter(r => !r.overall);
      
      for (const result of failedBlocks) {
        console.log(`\n🚨 Block ${result.blockIndex} (${result.blockHash.substring(0, 16)}...)`);
        console.log(`   Entity: ${result.entityId}`);
        console.log(`   Failed Layers: ${result.failedLayers}`);
        console.log(`   Critical Failures: ${result.criticalFailures}`);
        
        Object.entries(result.layers).forEach(([layer, status]) => {
          if (!status.valid) {
            console.log(`   ❌ ${layer.toUpperCase()}: ${status.error}`);
            if (status.severity === 'CRITICAL') {
              console.log(`      🔴 CRITICAL SECURITY VIOLATION`);
            }
          }
        });
      }
    } else {
      console.log('✅ All blocks verified successfully!');
      console.log('🔒 Blockchain integrity: PERFECT');
    }

    // Demonstrate checkpoint verification for a specific block
    if (totalBlocks > 1) {
      console.log('\n\n🔍 Detailed Checkpoint Verification (Block 1):');
      const block = await Block.findOne({ index: 1 });
      
      if (block) {
        const checkpointResult = await auditService.verifyAgainstCheckpoint(block);
        
        console.log(`   Verified: ${checkpointResult.verified ? '✅' : '❌'}`);
        console.log(`   Checkpoint Created: ${checkpointResult.checkpoint?.createdAt}`);
        
        if (checkpointResult.timestampVerification?.verified) {
          console.log(`   🔗 Bitcoin Block: ${checkpointResult.timestampVerification.bitcoinBlockHeight}`);
          console.log(`   📅 Timestamp: ${checkpointResult.timestampVerification.timestamp}`);
        }
        
        if (checkpointResult.discrepancies?.length > 0) {
          console.log('\n   🚨 DISCREPANCIES FOUND:');
          checkpointResult.discrepancies.forEach(d => {
            console.log(`      - ${d.field}: ${d.severity}`);
            console.log(`        Expected: ${d.checkpoint}`);
            console.log(`        Current:  ${d.current}`);
          });
        }
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Verification complete\n');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  verifyBlockchain()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = verifyBlockchain;