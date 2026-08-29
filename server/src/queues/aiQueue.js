/**
 * AI processing queue — uses BullMQ when Redis is available,
 * falls back to immediate execution otherwise.
 */
const config = require('../config/env');

let queue = null;
let worker = null;

const init = () => {
  if (!config.redisUrl) {
    console.log('[Queue] Redis not configured — AI jobs will run synchronously');
    return;
  }

  try {
    const { Queue, Worker } = require('bullmq');
    const connection = { url: config.redisUrl };

    queue = new Queue('ai-jobs', { connection });
    worker = new Worker('ai-jobs', async (job) => {
      const aiService = require('../services/aiService');
      const { type, payload } = job.data;
      if (type === 'summarize') return aiService.summarizeEmail(payload);
      if (type === 'reply') return aiService.generateReply(payload);
    }, { connection, concurrency: 3 });

    worker.on('completed', (job) => console.log(`[Queue] AI job ${job.data.type} completed`));
    worker.on('failed', (job, err) => console.error(`[Queue] AI job ${job.data.type} failed:`, err.message));
    console.log('[Queue] AI queue initialized');
  } catch (error) {
    console.warn('[Queue] Failed to initialize AI queue:', error.message);
  }
};

module.exports = { init };
