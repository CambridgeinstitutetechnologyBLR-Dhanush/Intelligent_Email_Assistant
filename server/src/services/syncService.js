const gmailService = require('./gmailService');
const gmailIntegration = require('../integrations/gmailIntegration');
const activityService = require('./activityService');

const syncInbox = async (userId) => {
  const tokens = await gmailService.getDecryptedTokens(userId);
  const result = await gmailIntegration.listMessages(tokens, { maxResults: 50, labelIds: ['INBOX'] });
  // Update last synced timestamp
  const GmailConnection = require('../models/GmailConnection');
  await GmailConnection.findOneAndUpdate({ owner: userId }, { lastSyncedAt: new Date() });
  await activityService.log({ owner: userId, action: 'sync', status: 'success', message: `Synced ${result.messages.length} messages` });
  return result;
};

module.exports = { syncInbox };
