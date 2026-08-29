const gmailIntegration = require('../integrations/gmailIntegration');
const gmailService = require('./gmailService');
const activityService = require('./activityService');
const { AppError } = require('../middleware/errorHandler');

const listEmails = async (userId, { maxResults, pageToken, labelIds, q }) => {
  const tokens = await gmailService.getDecryptedTokens(userId);
  try {
    return await gmailIntegration.listMessages(tokens, { maxResults, pageToken, labelIds, q });
  } catch (error) {
    if (error.code === 429) throw new AppError('Gmail rate limit exceeded', 429, 'GMAIL_RATE_LIMIT');
    throw new AppError('Failed to fetch emails', 500, 'GMAIL_API_ERROR');
  }
};

const getEmail = async (userId, messageId) => {
  const tokens = await gmailService.getDecryptedTokens(userId);
  try {
    return await gmailIntegration.getMessage(tokens, messageId);
  } catch (error) {
    if (error.code === 404) throw new AppError('Message not found', 404, 'MESSAGE_NOT_FOUND');
    throw new AppError('Failed to fetch email', 500, 'GMAIL_API_ERROR');
  }
};

const markAsRead = async (userId, messageId) => {
  const tokens = await gmailService.getDecryptedTokens(userId);
  await gmailIntegration.modifyMessage(tokens, messageId, { removeLabelIds: ['UNREAD'] });
  await activityService.log({ owner: userId, action: 'mark_read', messageId, status: 'success' });
};

const markAsUnread = async (userId, messageId) => {
  const tokens = await gmailService.getDecryptedTokens(userId);
  await gmailIntegration.modifyMessage(tokens, messageId, { addLabelIds: ['UNREAD'] });
  await activityService.log({ owner: userId, action: 'mark_unread', messageId, status: 'success' });
};

const starMessage = async (userId, messageId) => {
  const tokens = await gmailService.getDecryptedTokens(userId);
  await gmailIntegration.modifyMessage(tokens, messageId, { addLabelIds: ['STARRED'] });
  await activityService.log({ owner: userId, action: 'star', messageId, status: 'success' });
};

const unstarMessage = async (userId, messageId) => {
  const tokens = await gmailService.getDecryptedTokens(userId);
  await gmailIntegration.modifyMessage(tokens, messageId, { removeLabelIds: ['STARRED'] });
  await activityService.log({ owner: userId, action: 'unstar', messageId, status: 'success' });
};

const archiveMessage = async (userId, messageId) => {
  const tokens = await gmailService.getDecryptedTokens(userId);
  await gmailIntegration.archiveMessage(tokens, messageId);
  await activityService.log({ owner: userId, action: 'archive', messageId, status: 'success' });
};

const deleteMessage = async (userId, messageId) => {
  const tokens = await gmailService.getDecryptedTokens(userId);
  await gmailIntegration.deleteMessage(tokens, messageId);
  await activityService.log({ owner: userId, action: 'delete', messageId, status: 'success' });
};

const sendEmail = async (userId, { to, cc, bcc, subject, body }) => {
  const tokens = await gmailService.getDecryptedTokens(userId);
  const result = await gmailIntegration.sendMessage(tokens, { to, cc, bcc, subject, body });
  await activityService.log({ owner: userId, action: 'send_email', messageId: result.id, status: 'success' });
  return result;
};

const searchEmails = async (userId, { q, maxResults, pageToken }) => {
  const tokens = await gmailService.getDecryptedTokens(userId);
  return gmailIntegration.searchMessages(tokens, q, { maxResults, pageToken });
};

module.exports = { listEmails, getEmail, markAsRead, markAsUnread, starMessage, unstarMessage, archiveMessage, deleteMessage, sendEmail, searchEmails };
