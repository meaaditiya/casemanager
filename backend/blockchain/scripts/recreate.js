// blockchain/scripts/recreateCheckpoints.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Block = require('../models/Block');
const AuditCheckpoint = require('../models/AuditCheckpoint');
const auditService = require('../services/auditService');

/**
 * Recreate audit checkpoints for existing blocks
 * This fixes old blocks that have incorrect or missing checkpoints
 */
async function recreateCheckpoints() {
  try {
    console.log('🔄 Starting checkpoint recreation process...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all blocks
    const blocks = await Block.find().sort({ index: 1 });
    console.log(`📊 Found ${blocks.length} blocks\n`);

    // Delete all existing checkpoints
    const deletedCount = await AuditCheckpoint.deleteMany({});
    console.log(`🗑️  Deleted ${deletedCount.deletedCount} old checkpoints\n`);

    let successCount = 0;
    let failCount = 0;

    // Recreate checkpoints for each block
    for (const block of blocks) {
      try {
        console.log(`📋 Creating checkpoint for block ${block.index}...`);
        
        const checkpoint = await auditService.createCheckpoint(block);
        
        if (checkpoint) {
          console.log(`✅ Checkpoint created for block ${block.index}`);
          successCount++;
        } else {
          console.log(`❌ Failed to create checkpoint for block ${block.index}`);
          failCount++;
        }
      } catch (error) {
        console.error(`❌ Error creating checkpoint for block ${block.index}:`, error.message);
        failCount++;
      }
    }

    console.log('\n📊 Recreation Summary:');
    console.log(`   Total blocks: ${blocks.length}`);
    console.log(`   Successfully created: ${successCount}`);
    console.log(`   Failed: ${failCount}`);

    // Verify one block to test
    if (blocks.length > 1) {
      console.log('\n🔍 Testing verification on block 1...');
      const verification = await auditService.verifyAgainstCheckpoint(blocks[1]);
      
      if (verification.verified) {
        console.log('✅ Block 1 verification PASSED');
      } else {
        console.log('❌ Block 1 verification FAILED');
        console.log('   Discrepancies:', verification.discrepancies);
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Checkpoint recreation complete\n');

  } catch (error) {
    console.error('❌ Checkpoint recreation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  recreateCheckpoints()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = recreateCheckpoints;