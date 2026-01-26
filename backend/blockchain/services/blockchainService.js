const blockchain = require('./blockchain');
const { 
  verifyChain, 
  verifyEntityHistory, 
  verifyBlockComplete,
  detectTamperingPatterns 
} = require('../utils/verification');
const Block = require('../models/Block');

const logCaseFiling = async (caseData, userId, userType) => {
  const blockData = {
    action: 'case_filed',
    case_num: caseData.case_num,
    case_type: caseData.case_type,
    district: caseData.district,
    court: caseData.court,
    plaintiff: caseData.plaintiff_details.name,
    respondent: caseData.respondent_details.name,
    filed_at: new Date()
  };

  return await blockchain.mineBlock(
    blockData,
    'case_filing',
    caseData.case_num,
    userId,
    userType
  );
};

const logCaseStatusUpdate = async (caseNum, oldStatus, newStatus, remarks, userId, userType) => {
  const blockData = {
    action: 'status_updated',
    case_num: caseNum,
    old_status: oldStatus,
    new_status: newStatus,
    remarks,
    updated_at: new Date()
  };

  return await blockchain.mineBlock(
    blockData,
    'case_status_update',
    caseNum,
    userId,
    userType
  );
};

const logHearingAdded = async (caseNum, hearingData, userId, userType) => {
  const blockData = {
    action: 'hearing_added',
    case_num: caseNum,
    hearing_date: hearingData.hearing_date,
    hearing_type: hearingData.hearing_type,
    remarks: hearingData.remarks,
    added_at: new Date()
  };

  return await blockchain.mineBlock(
    blockData,
    'hearing_added',
    caseNum,
    userId,
    userType
  );
};

const logDocumentUpload = async (caseNum, documentData, userId, userType) => {
  const blockData = {
    action: 'document_uploaded',
    case_num: caseNum,
    document_id: documentData.document_id,
    document_type: documentData.document_type,
    file_name: documentData.file_name,
    file_size: documentData.size,
    uploaded_at: new Date()
  };

  return await blockchain.mineBlock(
    blockData,
    'document_upload',
    caseNum,
    userId,
    userType
  );
};

const logCaseApproval = async (caseNum, approved, userId) => {
  const blockData = {
    action: 'case_approval',
    case_num: caseNum,
    approved,
    approved_at: new Date()
  };

  return await blockchain.mineBlock(
    blockData,
    'case_approval',
    caseNum,
    userId,
    'clerk'
  );
};

const logAdvocateVerification = async (advocateId, verified, userId) => {
  const blockData = {
    action: 'advocate_verification',
    advocate_id: advocateId,
    verified,
    verified_at: new Date()
  };

  return await blockchain.mineBlock(
    blockData,
    'advocate_verification',
    advocateId,
    userId,
    'clerk'
  );
};

const logVideoMeetingScheduled = async (caseNum, meetingData, userId, userType) => {
  const blockData = {
    action: 'video_meeting_scheduled',
    case_num: caseNum,
    meeting_link: meetingData.meetingLink,
    start_time: meetingData.startDateTime,
    end_time: meetingData.endDateTime,
    scheduled_at: new Date()
  };

  return await blockchain.mineBlock(
    blockData,
    'video_meeting_scheduled',
    caseNum,
    userId,
    userType
  );
};

/**
 * 🆕 GET CASE HISTORY WITH VERIFICATION
 * Returns blockchain history with verification status
 */
const getCaseHistory = async (caseNum) => {
  const blocks = await blockchain.getBlocksByEntity(caseNum);
  
  // Add verification status to each block
  const allBlocks = await Block.find().sort({ index: 1 });
  
  const historyWithVerification = [];
  
  for (const block of blocks) {
    const previousBlock = allBlocks.find(b => b.index === block.index - 1);
    
    let verification = { overall: true, note: 'Genesis or standalone block' };
    
    if (previousBlock) {
      verification = await verifyBlockComplete(
        block,
        previousBlock,
        process.env.BLOCKCHAIN_SECRET,
        parseInt(process.env.BLOCKCHAIN_DIFFICULTY)
      );
    }
    
    historyWithVerification.push({
      ...block.toObject(),
      verification
    });
  }
  
  return historyWithVerification;
};

/**
 * 🆕 VERIFY BLOCKCHAIN INTEGRITY
 * Comprehensive multi-layer verification
 */
const verifyBlockchainIntegrity = async () => {
  return await verifyChain(
    process.env.BLOCKCHAIN_SECRET,
    parseInt(process.env.BLOCKCHAIN_DIFFICULTY)
  );
};

/**
 * 🆕 VERIFY CASE HISTORY WITH TAMPERING DETECTION
 * Enhanced verification with pattern detection
 */
const verifyCaseHistory = async (caseNum) => {
  const verification = await verifyEntityHistory(caseNum);
  
  // Detect tampering patterns for failed blocks
  if (!verification.valid) {
    verification.tamperingPatterns = [];
    
    for (const historyItem of verification.history) {
      if (!historyItem.verification.overall) {
        const patterns = detectTamperingPatterns(historyItem.verification);
        if (patterns.detected.length > 0) {
          verification.tamperingPatterns.push({
            blockIndex: historyItem.index,
            blockHash: historyItem.hash,
            patterns: patterns.detected,
            riskLevel: patterns.riskLevel
          });
        }
      }
    }
  }
  
  return verification;
};

/**
 * 🆕 GET BLOCKCHAIN STATS WITH SECURITY METRICS
 */
const getBlockchainStats = async () => {
  const stats = await blockchain.getChainStats();
  
  // Add verification summary
  const verificationResult = await verifyBlockchainIntegrity();
  
  stats.verification = {
    chainValid: verificationResult.valid,
    integrityScore: verificationResult.integrityScore,
    verifiedBlocks: verificationResult.verifiedBlocks,
    failedBlocks: verificationResult.failedBlocks,
    layerFailures: verificationResult.summary
  };
  
  return stats;
};

/**
 * 🆕 VERIFY SPECIFIC BLOCK
 * Deep verification of a single block
 */
const verifySpecificBlock = async (blockIndex) => {
  const block = await Block.findOne({ index: blockIndex });
  if (!block) {
    return {
      valid: false,
      error: 'Block not found'
    };
  }
  
  const previousBlock = await Block.findOne({ index: blockIndex - 1 });
  if (!previousBlock && blockIndex !== 0) {
    return {
      valid: false,
      error: 'Previous block not found - chain broken'
    };
  }
  
  if (blockIndex === 0) {
    return {
      valid: true,
      note: 'Genesis block',
      block: block.toObject()
    };
  }
  
  const verification = await verifyBlockComplete(
    block,
    previousBlock,
    process.env.BLOCKCHAIN_SECRET,
    parseInt(process.env.BLOCKCHAIN_DIFFICULTY)
  );
  
  // Detect tampering patterns
  const patterns = detectTamperingPatterns(verification);
  
  return {
    ...verification,
    tamperingPatterns: patterns,
    block: block.toObject(),
    previousBlock: {
      index: previousBlock.index,
      hash: previousBlock.hash
    }
  };
};

/**
 * 🆕 GET TAMPERED BLOCKS
 * Find all blocks that fail verification
 */
const getTamperedBlocks = async () => {
  const verificationResult = await verifyBlockchainIntegrity();
  
  if (verificationResult.valid) {
    return {
      tamperedBlocks: [],
      count: 0,
      message: 'No tampering detected'
    };
  }
  
  const tamperedBlocks = verificationResult.blockResults
    .filter(result => !result.overall)
    .map(result => ({
      blockIndex: result.blockIndex,
      blockHash: result.blockHash,
      entityId: result.entityId,
      failedLayers: result.failedLayers,
      criticalFailures: result.criticalFailures,
      layers: result.layers,
      tamperingPatterns: detectTamperingPatterns(result)
    }));
  
  return {
    tamperedBlocks,
    count: tamperedBlocks.length,
    totalBlocks: verificationResult.totalBlocks,
    message: `${tamperedBlocks.length} tampered block(s) detected`
  };
};
/**
 * NEW: Verify database-blockchain synchronization
 * Call this periodically (e.g., daily cron job)
 */
const verifyDatabaseBlockchainSync = async (caseNum) => {
  const case_ = await LegalCase.findOne({ case_num: caseNum });
  if (!case_) {
    return { valid: false, error: 'Case not found in database' };
  }

  const blocks = await blockchain.getBlocksByEntity(caseNum);
  if (blocks.length === 0) {
    return { valid: false, error: 'No blockchain records found' };
  }

  const discrepancies = [];

  // Find filing block
  const filingBlock = blocks.find(b => b.dataType === 'case_filing');
  if (filingBlock) {
    // Compare plaintiff
    if (filingBlock.data.plaintiff !== case_.plaintiff_details.name) {
      discrepancies.push({
        field: 'plaintiff_name',
        blockchain: filingBlock.data.plaintiff,
        database: case_.plaintiff_details.name,
        severity: 'CRITICAL'
      });
    }

    // Compare respondent
    if (filingBlock.data.respondent !== case_.respondent_details.name) {
      discrepancies.push({
        field: 'respondent_name',
        blockchain: filingBlock.data.respondent,
        database: case_.respondent_details.name,
        severity: 'CRITICAL'
      });
    }

    // Compare case type
    if (filingBlock.data.case_type !== case_.case_type) {
      discrepancies.push({
        field: 'case_type',
        blockchain: filingBlock.data.case_type,
        database: case_.case_type,
        severity: 'HIGH'
      });
    }
  }

  // Find latest approval block
  const approvalBlocks = blocks
    .filter(b => b.dataType === 'case_approval')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  if (approvalBlocks.length > 0) {
    const latestApproval = approvalBlocks[0];
    if (latestApproval.data.approved !== case_.case_approved) {
      discrepancies.push({
        field: 'case_approved',
        blockchain: latestApproval.data.approved,
        database: case_.case_approved,
        blockchain_timestamp: latestApproval.timestamp,
        severity: 'CRITICAL'
      });
    }
  }

  // Find latest status update
  const statusBlocks = blocks
    .filter(b => b.dataType === 'case_status_update')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  if (statusBlocks.length > 0) {
    const latestStatus = statusBlocks[0];
    if (latestStatus.data.new_status !== case_.status) {
      discrepancies.push({
        field: 'status',
        blockchain: latestStatus.data.new_status,
        database: case_.status,
        blockchain_timestamp: latestStatus.timestamp,
        severity: 'HIGH'
      });
    }
  }

  // Verify document count
  const documentBlocks = blocks.filter(b => b.dataType === 'document_upload');
  if (documentBlocks.length !== (case_.documents?.length || 0)) {
    discrepancies.push({
      field: 'document_count',
      blockchain: documentBlocks.length,
      database: case_.documents?.length || 0,
      severity: 'HIGH',
      message: 'Document count mismatch - possible deletion or addition without blockchain entry'
    });
  }

  // Verify hearing count
  const hearingBlocks = blocks.filter(b => b.dataType === 'hearing_added');
  if (hearingBlocks.length !== (case_.hearings?.length || 0)) {
    discrepancies.push({
      field: 'hearing_count',
      blockchain: hearingBlocks.length,
      database: case_.hearings?.length || 0,
      severity: 'MEDIUM',
      message: 'Hearing count mismatch'
    });
  }

  return {
    valid: discrepancies.length === 0,
    case_num: caseNum,
    total_blockchain_entries: blocks.length,
    discrepancies,
    last_blockchain_update: blocks[blocks.length - 1]?.timestamp,
    database_last_modified: case_.updatedAt
  };
}
module.exports = {
  logCaseFiling,
  logCaseStatusUpdate,
  logHearingAdded,
  logDocumentUpload,
  logCaseApproval,
  logAdvocateVerification,
  logVideoMeetingScheduled,
  getCaseHistory,
  verifyBlockchainIntegrity,
  verifyCaseHistory,
  getBlockchainStats,
  verifySpecificBlock,
  getTamperedBlocks,
  verifyDatabaseBlockchainSync
};