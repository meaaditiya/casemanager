const blockchainQueue = require('../queues/blockchainQueue');
const blockchainService = require('../services/blockchainService');

const logCaseFilingMiddleware = async (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = async function(data) {
    if (res.statusCode === 201 && data.case) {
      try {
        console.log(`📋 Queueing case filing: ${data.case.case_num}`);
        
        await blockchainQueue.add('mine-block', {
          blockData: data.case,
          dataType: 'case_filing',
          entityId: data.case.case_num,
          userId: req.user.party_id || req.user.advocate_id,
          userType: req.user.user_type
        });
        
        data.blockchain = { queued: true, message: 'Blockchain logging queued' };
        
      } catch (error) {
        console.error('❌ Queue error:', error);
        data.blockchain = { queued: false, error: error.message };
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
        console.log(`📄 Queueing status update: ${req.params.caseNum}`);
        
        await blockchainQueue.add('mine-block', {
          blockData: {
            case_num: req.params.caseNum,
            old_status: data.case.status,
            new_status: req.body.status,
            remarks: req.body.remarks
          },
          dataType: 'case_status_update',
          entityId: req.params.caseNum,
          userId: req.user.clerk_id || req.user.admin_id,
          userType: req.user.user_type
        });
        
        data.blockchain = { queued: true, message: 'Status update queued' };
        
      } catch (error) {
        console.error('❌ Queue error:', error);
        data.blockchain = { queued: false, error: error.message };
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
        console.log(`⚖️ Queueing hearing: ${req.params.caseNum}`);
        
        await blockchainQueue.add('mine-block', {
          blockData: data.hearing,
          dataType: 'hearing_added',
          entityId: req.params.caseNum,
          userId: req.user.clerk_id || req.user.admin_id,
          userType: req.user.user_type
        });
        
        data.blockchain = { queued: true, message: 'Hearing logging queued' };
        
      } catch (error) {
        console.error('❌ Queue error:', error);
        data.blockchain = { queued: false, error: error.message };
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
        console.log(`📎 Queueing document: ${req.params.caseNum}`);
        
     // In blockchainMiddleware.js - logDocumentRequestMiddleware
// In blockchainMiddleware.js
await blockchainQueue.add('mine-block', {
  blockData: {
    action: 'document_requested',  // ✅ Add action HERE
    case_num: req.params.caseNum,
    document_id: data.document_request.document_id,
    document_type: data.document_request.document_type,
    requested_from: data.document_request.requested_from,
    requested_from_type: data.document_request.requested_from_type,
    submission_deadline: data.document_request.submission_deadline,
    requested_at: new Date()
  },
  dataType: 'document_requested',
  entityId: req.params.caseNum,
  userId: req.user.admin_id,
  userType: req.user.user_type
});
        data.blockchain = { queued: true, message: 'Document logging queued' };
        
      } catch (error) {
        console.error('❌ Queue error:', error);
        data.blockchain = { queued: false, error: error.message };
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
        console.log(`✔️ Queueing approval: ${req.params.caseNum}`);
        
        await blockchainQueue.add('mine-block', {
          blockData: {
            case_num: req.params.caseNum,
            approved: req.body.case_approved
          },
          dataType: 'case_approval',
          entityId: req.params.caseNum,
          userId: req.user.clerk_id,
          userType: 'clerk'
        });
        
        data.blockchain = { queued: true, message: 'Approval logging queued' };
        
      } catch (error) {
        console.error('❌ Queue error:', error);
        data.blockchain = { queued: false, error: error.message };
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
        console.log(`👨‍⚖️ Queueing advocate verification: ${req.params.advocate_id}`);
        
        await blockchainQueue.add('mine-block', {
          blockData: {
            advocate_id: req.params.advocate_id,
            verified: req.body.verified
          },
          dataType: 'advocate_verification',
          entityId: req.params.advocate_id,
          userId: req.user.clerk_id,
          userType: 'clerk'
        });
        
        data.blockchain = { queued: true, message: 'Verification logging queued' };
        
      } catch (error) {
        console.error('❌ Queue error:', error);
        data.blockchain = { queued: false, error: error.message };
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
        console.log(`🎥 Queueing video meeting: ${req.params.caseNum}`);
        
        await blockchainQueue.add('mine-block', {
          blockData: data.videoMeeting,
          dataType: 'video_meeting_scheduled',
          entityId: req.params.caseNum,
          userId: req.user.clerk_id || req.user.admin_id,
          userType: req.user.user_type
        });
        
        data.blockchain = { queued: true, message: 'Video meeting logging queued' };
        
      } catch (error) {
        console.error('❌ Queue error:', error);
        data.blockchain = { queued: false, error: error.message };
      }
    }
    return originalJson(data);
  };
  
  next();
};

const logDocumentRequestMiddleware = async (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = async function(data) {
    if (res.statusCode === 201 && data.document_request) {
      try {
        console.log(`📄 Queueing document request: ${req.params.caseNum}`);
        
        await blockchainQueue.add('mine-block', {
          blockData: data.document_request,
          dataType: 'document_requested',
          entityId: req.params.caseNum,
          userId: req.user.admin_id,
          userType: req.user.user_type
        });
        
        data.blockchain = { queued: true, message: 'Document request queued' };
        
      } catch (error) {
        console.error('❌ Queue error:', error);
        data.blockchain = { queued: false, error: error.message };
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
    console.error('❌ Health check failed:', error);
    req.blockchainHealthy = false;
    next();
  }
};

const verifyIntegrityMiddleware = async (req, res, next) => {
  if (req.query.verify === 'true' && req.params.caseNum) {
    try {
      console.log(`🔍 Verifying integrity: ${req.params.caseNum}`);
      const verification = await blockchainService.verifyCaseHistory(req.params.caseNum);
      req.integrityInfo = !verification.valid ? {
        valid: false,
        message: 'Blockchain verification issues',
        details: verification.tamperingPatterns || []
      } : null;
    } catch (error) {
      console.error('❌ Integrity error:', error);
      req.integrityInfo = { valid: false, message: 'Unable to verify', error: error.message };
    }
  }
  next();
};

const blockchainErrorHandler = (error, req, res, next) => {
  if (error.message && error.message.includes('blockchain')) {
    console.error('❌ Blockchain error:', error);
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
  logDocumentRequestMiddleware,
  blockchainHealthCheckMiddleware,
  verifyIntegrityMiddleware,
  blockchainErrorHandler
};