require('dotenv').config();
const mongoose = require('mongoose');
const AuditCheckpoint = require('../models/AuditCheckpoint');
const timestampService = require('../services/timestampService');

/**
 * 🔄 UPGRADE PENDING TIMESTAMPS
 * Run this script hourly to check if OpenTimestamps have been confirmed on Bitcoin
 * Once confirmed, timestamps become IMMUTABLE proof backed by Bitcoin blockchain
 */

async function upgradeTimestamps() {
  try {
    console.log('🔄 Starting timestamp upgrade process...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find checkpoints with unconfirmed timestamps
    const unconfirmedCheckpoints = await AuditCheckpoint.find({
      'timestampProof.ots.proof': { $exists: true },
      'timestampProof.ots.verified': { $ne: true }
    });

    console.log(`📊 Found ${unconfirmedCheckpoints.length} pending timestamps`);

    let upgraded = 0;
    let pending = 0;

    for (const checkpoint of unconfirmedCheckpoints) {
      try {
        console.log(`\n🔍 Checking block ${checkpoint.blockIndex}...`);

        // Try to upgrade timestamp
        const result = await timestampService.upgradeTimestamp(
          checkpoint.timestampProof.ots.proof
        );

        if (result && result.upgraded) {
          // Verify upgraded timestamp
          const verification = await timestampService.verifyTimestamp(
            checkpoint.blockHash,
            result.proof
          );

          if (verification.verified) {
            // Update checkpoint with Bitcoin confirmation
            await AuditCheckpoint.collection.updateOne(
              { _id: checkpoint._id },
              {
                $set: {
                  'timestampProof.ots.proof': result.proof,
                  'timestampProof.ots.merkleRoot': verification.merkleRoot,
                  'timestampProof.ots.bitcoinBlockHeight': verification.bitcoinBlockHeight,
                  'timestampProof.ots.verified': true,
                  'timestampProof.ots.verifiedAt': new Date()
                }
              }
            );

            console.log(`✅ Block ${checkpoint.blockIndex} timestamp confirmed!`);
            console.log(`   Bitcoin block: ${verification.bitcoinBlockHeight}`);
            console.log(`   Merkle root: ${verification.merkleRoot}`);
            upgraded++;
          } else {
            console.log(`⏳ Block ${checkpoint.blockIndex} still pending Bitcoin confirmation`);
            pending++;
          }
        } else {
          console.log(`⏳ Block ${checkpoint.blockIndex} not yet included in Bitcoin block`);
          pending++;
        }

      } catch (error) {
        console.error(`❌ Error upgrading block ${checkpoint.blockIndex}:`, error.message);
      }
    }

    console.log('\n📊 Upgrade Summary:');
    console.log(`   Upgraded: ${upgraded}`);
    console.log(`   Still pending: ${pending}`);
    console.log(`   Total: ${unconfirmedCheckpoints.length}`);

    await mongoose.connection.close();
    console.log('\n✅ Timestamp upgrade complete');

  } catch (error) {
    console.error('❌ Timestamp upgrade failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  upgradeTimestamps()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = upgradeTimestamps;