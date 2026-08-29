const ActivityLog = require('../models/ActivityLog');

const log = async ({ owner, action, messageId, threadId, provider, status, message, metadata }) => {
  return ActivityLog.create({
    owner,
    action,
    messageId,
    threadId,
    provider: provider || 'gmail',
    status: status || 'success',
    message,
    metadata,
  });
};

const getByUser = async (userId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const [activities, total] = await Promise.all([
    ActivityLog.find({ owner: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ActivityLog.countDocuments({ owner: userId }),
  ]);
  return { activities, total, page, totalPages: Math.ceil(total / limit) };
};

const getById = async (id, userId) => {
  return ActivityLog.findOne({ _id: id, owner: userId });
};

module.exports = { log, getByUser, getById };
