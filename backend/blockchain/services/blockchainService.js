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
// Add after line 87 in blockchainService.js

// Line 124-143 - Replace the entire logDocumentRequested function:

const logDocumentRequested = async (caseNum, documentData, requestedFrom, requestedFromType, userId, userType) => {
  // ✅ Use documentData AS-IS from middleware (already has all fields)
  const blockData = documentData;

  return await blockchain.mineBlock(
    blockData,
    'document_requested',
    caseNum,
    userId,
    userType
  );
};
const logDocumentVerified = async (caseNum, documentData, userId, userType) => {
  const blockData = {
    action: 'document_verified',
    case_num: caseNum,
    document_id: documentData.document_id,
    document_type: documentData.document_type,
    file_name: documentData.file_name,
    verified_by: documentData.verified_by_name,
    signature_hash: documentData.digital_signature?.signature_hash,
    verified_at: new Date()
  };

  return await blockchain.mineBlock(
    blockData,
    'document_verified',
    caseNum,
    userId,
    userType
  );
};

const logDocumentRejected = async (caseNum, documentData, rejectionReason, userId, userType) => {
  const blockData = {
    action: 'document_rejected',
    case_num: caseNum,
    document_id: documentData.document_id,
    document_type: documentData.document_type,
    file_name: documentData.file_name,
    rejection_reason: rejectionReason,
    rejected_by: documentData.verified_by_name,
    rejected_at: new Date()
  };

  return await blockchain.mineBlock(
    blockData,
    'document_rejected',
    caseNum,
    userId,
    userType
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
// FIXED: The frontend code that calls the tampering investigation
// This needs to be corrected in your React/frontend component

// BACKEND FIX - Update blockchainService.js
// Replace the verifyDatabaseBlockchainSync function completely:

const verifyDatabaseBlockchainSync = async (caseNum) => {
  const LegalCase = require('../models/LegalCase');
  const case_ = await LegalCase.findOne({ case_num: caseNum });
  
  if (!case_) {
    return { valid: false, error: 'Case not found in database' };
  }

  const blocks = await blockchain.getBlocksByEntity(caseNum);
  if (blocks.length === 0) {
    return { valid: false, error: 'No blockchain records found' };
  }

  const discrepancies = [];

  // ✅ FIX 1: Only compare IMMUTABLE fields from filing block
  const filingBlock = blocks.find(b => b.dataType === 'case_filing');
  if (filingBlock) {
    // Plaintiff (should NEVER change)
    if (filingBlock.data.plaintiff !== case_.plaintiff_details.name) {
      discrepancies.push({
        field: 'plaintiff_name',
        blockchain_value: filingBlock.data.plaintiff,
        database_value: case_.plaintiff_details.name,
        severity: 'CRITICAL',
        block_index: filingBlock.index,
        reason: 'Plaintiff name is immutable'
      });
    }

    // Respondent (should NEVER change)
    if (filingBlock.data.respondent !== case_.respondent_details.name) {
      discrepancies.push({
        field: 'respondent_name',
        blockchain_value: filingBlock.data.respondent,
        database_value: case_.respondent_details.name,
        severity: 'CRITICAL',
        block_index: filingBlock.index,
        reason: 'Respondent name is immutable'
      });
    }

    // Case type (should NEVER change)
    if (filingBlock.data.case_type !== case_.case_type) {
      discrepancies.push({
        field: 'case_type',
        blockchain_value: filingBlock.data.case_type,
        database_value: case_.case_type,
        severity: 'HIGH',
        block_index: filingBlock.index,
        reason: 'Case type is immutable'
      });
    }
  }

  // ✅ FIX 2: Get LATEST status from status update blocks
  const statusBlocks = blocks
    .filter(b => b.dataType === 'case_status_update')
    .sort((a, b) => b.index - a.index); // Sort by block index (most recent first)
  
  let expectedStatus = 'Filed'; // Default from filing
  
  if (statusBlocks.length > 0) {
    // Get the most recent status from blockchain
    expectedStatus = statusBlocks[0].data.new_status;
    
    // Compare with database
    if (expectedStatus !== case_.status) {
      discrepancies.push({
        field: 'status',
        blockchain_value: expectedStatus,
        database_value: case_.status,
        severity: 'CRITICAL',
        block_index: statusBlocks[0].index,
        blockchain_timestamp: statusBlocks[0].timestamp,
        reason: 'Current status does not match latest blockchain entry'
      });
    }
  } else if (filingBlock) {
    // No status updates, should be "Filed"
    if (case_.status !== 'Filed') {
      discrepancies.push({
        field: 'status',
        blockchain_value: 'Filed',
        database_value: case_.status,
        severity: 'CRITICAL',
        block_index: filingBlock.index,
        reason: 'Status changed without blockchain record'
      });
    }
  }

  // ✅ FIX 3: Get LATEST approval status
  const approvalBlocks = blocks
    .filter(b => b.dataType === 'case_approval')
    .sort((a, b) => b.index - a.index);
  
  if (approvalBlocks.length > 0) {
    const latestApproval = approvalBlocks[0];
    if (latestApproval.data.approved !== case_.case_approved) {
      discrepancies.push({
        field: 'case_approved',
        blockchain_value: latestApproval.data.approved,
        database_value: case_.case_approved,
        severity: 'CRITICAL',
        block_index: latestApproval.index,
        blockchain_timestamp: latestApproval.timestamp,
        reason: 'Approval status does not match latest blockchain entry'
      });
    }
  }

  // Document count verification
  const documentBlocks = blocks.filter(b => b.dataType === 'document_upload');
  const currentDocCount = case_.documents?.length || 0;
  
  if (documentBlocks.length > currentDocCount) {
    discrepancies.push({
      field: 'document_count',
      blockchain_value: documentBlocks.length,
      database_value: currentDocCount,
      severity: 'HIGH',
      block_index: 'N/A',
      message: `${documentBlocks.length - currentDocCount} document(s) deleted without blockchain record`
    });
  }

  // Hearing count verification
  const hearingBlocks = blocks.filter(b => b.dataType === 'hearing_added');
  const currentHearingCount = case_.hearings?.length || 0;
  
  if (hearingBlocks.length > currentHearingCount) {
    discrepancies.push({
      field: 'hearing_count',
      blockchain_value: hearingBlocks.length,
      database_value: currentHearingCount,
      severity: 'MEDIUM',
      block_index: 'N/A',
      message: `${hearingBlocks.length - currentHearingCount} hearing(s) deleted without blockchain record`
    });
  }

  // ✅ Determine overall status
  const criticalDiscrepancies = discrepancies.filter(d => d.severity === 'CRITICAL');
  const status = criticalDiscrepancies.length > 0 
    ? 'CRITICAL_DATABASE_TAMPERING'
    : discrepancies.length > 0 
      ? 'MINOR_DISCREPANCIES'
      : 'VERIFIED';

  return {
    valid: discrepancies.length === 0,
    status,
    case_num: caseNum,
    total_blockchain_entries: blocks.length,
    discrepancies,
    last_blockchain_update: blocks[blocks.length - 1]?.timestamp,
    database_last_modified: case_.updatedAt,
    blockchain_state: {
      latest_status: expectedStatus,
      latest_approval: approvalBlocks.length > 0 ? approvalBlocks[0].data.approved : null,
      total_status_updates: statusBlocks.length,
      total_approvals: approvalBlocks.length
    }
  };
};
// REPLACE the existing module.exports (around line 500+) with:
module.exports = {
  logCaseFiling,
  logCaseStatusUpdate,
  logHearingAdded,
  logDocumentUpload,
  logCaseApproval,
  logAdvocateVerification,
  logVideoMeetingScheduled,
  logDocumentRequested,      
  logDocumentVerified,       
  logDocumentRejected,       
  getCaseHistory,
  verifyBlockchainIntegrity,
  verifyCaseHistory,
  getBlockchainStats,
  verifySpecificBlock,
  getTamperedBlocks,
  verifyDatabaseBlockchainSync
};