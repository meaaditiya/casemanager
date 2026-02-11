const Queue = require('bull');
const redis = require('redis');

const blockchainQueue = new Queue('blockchain-operations', process.env.REDIS_URL || 'redis://localhost:6379', {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

blockchainQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

blockchainQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

module.exports = blockchainQueue;