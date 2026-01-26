// CORRECTED: blockchain/middleware/blockchainMiddleware.js
// Remove the pre-flight blockchain checks that are causing failures

const blockchainService = require('../services/blockchainService');

/**
 * ✅ ENHANCED CASE FILING MIDDLEWARE
 * Simplified - no pre-flight checks that block operations
 */
const logCaseFilingMiddleware = async (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = async function(data) {
    if (res.statusCode === 201 && data.case) {
      try {
        console.log(`📋 Logging case filing to blockchain: ${data.case.case_num}`);
        
        const block = await blockchainService.logCaseFiling(
          data.case,
          req.user.party_id || req.user.advocate_id,
          req.user.user_type
        );
        
        data.blockchain = {
          logged: true,
          blockIndex: block.index,
          blockHash: block.hash,
          ipfsAnchor: block.ipfs?.cid || null,
          ipfsUrl: block.ipfs?.cid ? `https://ipfs.io/ipfs/${block.ipfs.cid}` : null,
          digitallySigned: !!block.signature?.value,
          timestamp: block.timestamp
        };
        
        console.log(`✅ Case filing logged to blockchain at block ${block.index}`);
        
      } catch (error) {
        console.error('❌ Blockchain logging error:', error);
        
        data.blockchain = {
          logged: false,
          error: error.message,
          note: 'Case created but blockchain logging failed - will retry'
        };
      }
    }
    return originalJson(data);
  };
  
  next();
};

const logStatusUpdateMiddleware = async (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = async function(data) {
    if (res.statusCode === 200 && data.case && req.body.status) {
      try {
        console.log(`📄 Logging status update to blockchain: ${req.params.caseNum}`);
        
        const block = await blockchainService.logCaseStatusUpdate(
          req.params.caseNum,
          data.case.status,
          req.body.status,
          req.body.remarks,
          req.user.clerk_id || req.user.admin_id,
          req.user.user_type
        );
        
        data.blockchain = {
          logged: true,
          blockIndex: block.index,
          blockHash: block.hash,
          ipfsAnchor: block.ipfs?.cid || null,
          ipfsUrl: block.ipfs?.cid ? `https://ipfs.io/ipfs/${block.ipfs.cid}` : null,
          digitallySigned: !!block.signature?.value,
          statusChange: {
            from: data.case.status,
            to: req.body.status
          },
          timestamp: block.timestamp
        };
        
        console.log(`✅ Status update logged to blockchain at block ${block.index}`);
        
      } catch (error) {
        console.error('❌ Blockchain logging error:', error);
        
        data.blockchain = {
          logged: false,
          error: error.message,
          note: 'Status updated but blockchain logging failed - will retry'
        };
      }
    }
    return originalJson(data);
  };
  
  next();
};

const logHearingMiddleware = async (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = async function(data) {
    if ((res.statusCode === 201 || res.statusCode === 200) && data.hearing) {
      try {
        console.log(`⚖️ Logging hearing to blockchain: ${req.params.caseNum}`);
        
        const block = await blockchainService.logHearingAdded(
          req.params.caseNum,
          data.hearing,
          req.user.clerk_id || req.user.admin_id,
          req.user.user_type
        );
        
        data.blockchain = {
          logged: true,
          blockIndex: block.index,
          blockHash: block.hash,
          ipfsAnchor: block.ipfs?.cid || null,
          ipfsUrl: block.ipfs?.cid ? `https://ipfs.io/ipfs/${block.ipfs.cid}` : null,
          digitallySigned: !!block.signature?.value,
          hearingDate: data.hearing.hearing_date,
          timestamp: block.timestamp
        };
        
        console.log(`✅ Hearing logged to blockchain at block ${block.index}`);
        
      } catch (error) {
        console.error('❌ Blockchain logging error:', error);
        
        data.blockchain = {
          logged: false,
          error: error.message,
          note: 'Hearing added but blockchain logging failed - will retry'
        };
      }
    }
    return originalJson(data);
  };
  
  next();
};

const logDocumentMiddleware = async (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = async function(data) {
    if (res.statusCode === 201 && data.document) {
      try {
        console.log(`📎 Logging document to blockchain: ${req.params.caseNum}`);
        
        const block = await blockchainService.logDocumentUpload(
          req.params.caseNum,
          data.document,
          req.user.party_id || req.user.advocate_id || req.user.admin_id,
          req.user.user_type
        );
        
        data.blockchain = {
          logged: true,
          blockIndex: block.index,
          blockHash: block.hash,
          ipfsAnchor: block.ipfs?.cid || null,
          ipfsUrl: block.ipfs?.cid ? `https://ipfs.io/ipfs/${block.ipfs.cid}` : null,
          digitallySigned: !!block.signature?.value,
          documentId: data.document.document_id,
          timestamp: block.timestamp
        };
        
        console.log(`✅ Document logged to blockchain at block ${block.index}`);
        
      } catch (error) {
        console.error('❌ Blockchain logging error:', error);
        
        data.blockchain = {
          logged: false,
          error: error.message,
          note: 'Document uploaded but blockchain logging failed - will retry'
        };
      }
    }
    return originalJson(data);
  };
  
  next();
};

const logApprovalMiddleware = async (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = async function(data) {
    if (res.statusCode === 200 && req.body.case_approved !== undefined) {
      try {
        console.log(`✔️ Logging case approval to blockchain: ${req.params.caseNum}`);
        
        const block = await blockchainService.logCaseApproval(
          req.params.caseNum,
          req.body.case_approved,
          req.user.clerk_id
        );
        
        data.blockchain = {
          logged: true,
          blockIndex: block.index,
          blockHash: block.hash,
          ipfsAnchor: block.ipfs?.cid || null,
          ipfsUrl: block.ipfs?.cid ? `https://ipfs.io/ipfs/${block.ipfs.cid}` : null,
          digitallySigned: !!block.signature?.value,
          approved: req.body.case_approved,
          timestamp: block.timestamp
        };
        
        console.log(`✅ Case approval logged to blockchain at block ${block.index}`);
        
      } catch (error) {
        console.error('❌ Blockchain logging error:', error);
        
        data.blockchain = {
          logged: false,
          error: error.message,
          note: 'Approval status changed but blockchain logging failed - will retry'
        };
      }
    }
    return originalJson(data);
  };
  
  next();
};

const logAdvocateVerificationMiddleware = async (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = async function(data) {
    if (res.statusCode === 200 && req.body.verified !== undefined) {
      try {
        console.log(`👨‍⚖️ Logging advocate verification to blockchain: ${req.params.advocate_id}`);
        
        const block = await blockchainService.logAdvocateVerification(
          req.params.advocate_id,
          req.body.verified,
          req.user.clerk_id
        );
        
        data.blockchain = {
          logged: true,
          blockIndex: block.index,
          blockHash: block.hash,
          ipfsAnchor: block.ipfs?.cid || null,
          ipfsUrl: block.ipfs?.cid ? `https://ipfs.io/ipfs/${block.ipfs.cid}` : null,
          digitallySigned: !!block.signature?.value,
          verified: req.body.verified,
          timestamp: block.timestamp
        };
        
        console.log(`✅ Advocate verification logged to blockchain at block ${block.index}`);
        
      } catch (error) {
        console.error('❌ Blockchain logging error:', error);
        
        data.blockchain = {
          logged: false,
          error: error.message,
          note: 'Verification status changed but blockchain logging failed - will retry'
        };
      }
    }
    return originalJson(data);
  };
  
  next();
};

const logVideoMeetingMiddleware = async (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = async function(data) {
    if (res.statusCode === 201 && data.videoMeeting) {
      try {
        console.log(`🎥 Logging video meeting to blockchain: ${req.params.caseNum}`);
        
        const block = await blockchainService.logVideoMeetingScheduled(
          req.params.caseNum,
          data.videoMeeting,
          req.user.clerk_id || req.user.admin_id,
          req.user.user_type
        );
        
        data.blockchain = {
          logged: true,
          blockIndex: block.index,
          blockHash: block.hash,
          ipfsAnchor: block.ipfs?.cid || null,
          ipfsUrl: block.ipfs?.cid ? `https://ipfs.io/ipfs/${block.ipfs.cid}` : null,
          digitallySigned: !!block.signature?.value,
          meetingTime: data.videoMeeting.startDateTime,
          timestamp: block.timestamp
        };
        
        console.log(`✅ Video meeting logged to blockchain at block ${block.index}`);
        
      } catch (error) {
        console.error('❌ Blockchain logging error:', error);
        
        data.blockchain = {
          logged: false,
          error: error.message,
          note: 'Video meeting scheduled but blockchain logging failed - will retry'
        };
      }
    }
    return originalJson(data);
  };
  
  next();
};

const blockchainHealthCheckMiddleware = async (req, res, next) => {
  try {
    const stats = await blockchainService.getBlockchainStats();
    req.blockchainHealthy = stats.totalBlocks > 0;
    next();
  } catch (error) {
    console.error('❌ Blockchain health check failed:', error);
    req.blockchainHealthy = false;
    next();
  }
};

const verifyIntegrityMiddleware = async (req, res, next) => {
  if (req.query.verify === 'true' && req.params.caseNum) {
    try {
      console.log(`🔍 Verifying integrity for case: ${req.params.caseNum}`);
      
      const verification = await blockchainService.verifyCaseHistory(req.params.caseNum);
      
      if (!verification.valid) {
        console.warn(`⚠️ Integrity check found issues for case: ${req.params.caseNum}`);
        
        req.integrityInfo = {
          valid: false,
          message: 'This case has some blockchain verification issues',
          details: verification.tamperingPatterns || []
        };
      } else {
        req.integrityInfo = null;
      }
      
    } catch (error) {
      console.error('❌ Integrity verification error:', error);
      req.integrityInfo = {
        valid: false,
        message: 'Unable to verify blockchain integrity',
        error: error.message
      };
    }
  }
  
  next();
};

const blockchainErrorHandler = (error, req, res, next) => {
  if (error.message && error.message.includes('blockchain')) {
    console.error('❌ Blockchain operation failed:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Operation completed but blockchain logging failed',
      error: error.message,
      note: 'Data saved to database, blockchain will retry'
    });
  }
  
  next(error);
};

module.exports = {
  logCaseFilingMiddleware,
  logStatusUpdateMiddleware,
  logHearingMiddleware,
  logDocumentMiddleware,
  logApprovalMiddleware,
  logAdvocateVerificationMiddleware,
  logVideoMeetingMiddleware,
  blockchainHealthCheckMiddleware,
  verifyIntegrityMiddleware,
  blockchainErrorHandler
};