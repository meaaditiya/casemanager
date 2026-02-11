const blockchainQueue = require('../queues/blockchainQueue');
const blockchainService = require('../services/blockchainService');

blockchainQueue.process('mine-block', async (job) => {
  const { blockData, dataType, entityId, userId, userType } = job.data;
  
  console.log(`⛏️ Mining ${dataType} for ${entityId}...`);
  
  let block;
  
  switch(dataType) {
    case 'case_filing':
      block = await blockchainService.logCaseFiling(blockData, userId, userType);
      break;
    case 'case_status_update':
      block = await blockchainService.logCaseStatusUpdate(entityId, blockData.old_status, blockData.new_status, blockData.remarks, userId, userType);
      break;
    case 'hearing_added':
      block = await blockchainService.logHearingAdded(entityId, blockData, userId, userType);
      break;
    case 'document_upload':
      block = await blockchainService.logDocumentUpload(entityId, blockData, userId, userType);
      break;
    case 'case_approval':
      block = await blockchainService.logCaseApproval(entityId, blockData.approved, userId);
      break;
    case 'advocate_verification':
      block = await blockchainService.logAdvocateVerification(blockData.advocate_id, blockData.verified, userId);
      break;
    case 'video_meeting_scheduled':
      block = await blockchainService.logVideoMeetingScheduled(entityId, blockData, userId, userType);
      break;
   case 'document_requested':
  block = await blockchainService.logDocumentRequested(
    entityId,
    blockData,  
    null,       
    null,       
    userId,
    userType
  );
      break;
    default:
      throw new Error(`Unknown dataType: ${dataType}`);
  }
  
  console.log(`✅ Block ${block.index} mined`);
  return { blockIndex: block.index, blockHash: block.hash };
});

blockchainQueue.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed: Block ${result.blockIndex}`);
});

blockchainQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

console.log('🔧 Blockchain worker started');

module.exports = blockchainQueue;