// NEW FILE: blockchain/jobs/scheduler.js

const cron = require('node-cron');
const upgradeTimestamps = require('../scripts/upgradeTimestamps');
const { verifyChain } = require('../utils/verification');
const blockchainService = require('../services/blockchainService');

/**
 * Schedule blockchain maintenance jobs
 */
function initializeScheduler() {
  // Check for Bitcoin timestamp confirmations every hour
  cron.schedule('0 * * * *', async () => {
    console.log('🕐 Running hourly timestamp upgrade check...');
    try {
      await upgradeTimestamps();
    } catch (error) {
      console.error('Timestamp upgrade failed:', error);
    }
  });

  // Full chain verification every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('🔍 Running 6-hour blockchain integrity check...');
    try {
      const verification = await verifyChain(
        process.env.BLOCKCHAIN_SECRET,
        parseInt(process.env.BLOCKCHAIN_DIFFICULTY)
      );

      if (!verification.valid) {
        console.error('🚨 CRITICAL: Blockchain verification failed!');
        // Send alert to administrators
        // Log to security audit
      } else {
        console.log(`✅ Blockchain verified - Integrity: ${verification.integrityScore}%`);
      }
    } catch (error) {
      console.error('Blockchain verification failed:', error);
    }
  });

  // Database-blockchain sync check daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('🔄 Running daily database-blockchain sync check...');
    try {
      // Get all cases
      const LegalCase = require('../models/LegalCase');
      const cases = await LegalCase.find().limit(1000); // Process in batches

      let syncIssues = 0;
      for (const case_ of cases) {
        const syncCheck = await blockchainService.verifyDatabaseBlockchainSync(case_.case_num);
        if (!syncCheck.valid) {
          syncIssues++;
          console.error(`Sync issue for case ${case_.case_num}:`, syncCheck.discrepancies);
        }
      }

      if (syncIssues > 0) {
        console.error(`🚨 Found ${syncIssues} cases with sync issues`);
        // Send alert to administrators
      } else {
        console.log('✅ All cases in sync with blockchain');
      }
    } catch (error) {
      console.error('Sync check failed:', error);
    }
  });

  console.log('✅ Blockchain maintenance jobs scheduled');
}

module.exports = { initializeScheduler };