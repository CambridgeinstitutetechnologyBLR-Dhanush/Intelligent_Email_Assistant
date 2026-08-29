const gmailIntegration = require('../integrations/gmailIntegration');
const gmailService = require('./gmailService');
const activityService = require('./activityService');
const { AppError } = require('../middleware/errorHandler');

const getThread = async (userId, threadId) => {
  const tokens = await gmailService.getDecryptedTokens(userId);
  try {
    return await gmailIntegration.getThread(tokens, threadId);
  } catch (error) {
    if (error.code === 404) throw new AppError('Thread not found', 404, 'MESSAGE_NOT_FOUND');
    throw new AppError('Failed to fetch thread', 500, 'GMAIL_API_ERROR');
  }
};

const replyToThread = async (userId, threadId, { to, cc, bcc, subject, body, messageId }) => {
  const tokens = await gmailService.getDecryptedTokens(userId);
  const result = await gmailIntegration.sendReply(tokens, { to, cc, bcc, subject, body, threadId, messageId });
  await activityService.log({ owner: userId, action: 'reply', threadId, messageId: result.id, status: 'success' });
  return result;
};

module.exports = { getThread, replyToThread };
