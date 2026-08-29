/**
 * Email sync queue — uses BullMQ when Redis is available,
 * falls back to immediate execution otherwise.
 */
const config = require('../config/env');

let queue = null;
let worker = null;

const init = () => {
  if (!config.redisUrl) {
    console.log('[Queue] Redis not configured — email sync will run synchronously');
    return;
  }

  try {
    const { Queue, Worker } = require('bullmq');
    const connection = { url: config.redisUrl };

    queue = new Queue('email-sync', { connection });
    worker = new Worker('email-sync', async (job) => {
      const syncService = require('../services/syncService');
      await syncService.syncInbox(job.data.userId);
    }, { connection, concurrency: 2 });

    worker.on('completed', (job) => console.log(`[Queue] Sync completed for user ${job.data.userId}`));
    worker.on('failed', (job, err) => console.error(`[Queue] Sync failed for user ${job.data.userId}:`, err.message));
    console.log('[Queue] Email sync queue initialized');
  } catch (error) {
    console.warn('[Queue] Failed to initialize email sync queue:', error.message);
  }
};

const addSyncJob = async (userId) => {
  if (queue) {
    await queue.add('sync', { userId }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
  } else {
    // Fallback: run synchronously
    const syncService = require('../services/syncService');
    await syncService.syncInbox(userId);
  }
};

module.exports = { init, addSyncJob };
