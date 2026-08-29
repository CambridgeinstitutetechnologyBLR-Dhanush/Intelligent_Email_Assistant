const threadService = require('../services/threadService');

const getThread = async (req, res, next) => {
  try {
    const thread = await threadService.getThread(req.userId, req.params.threadId);
    res.json(thread);
  } catch (error) {
    next(error);
  }
};

const replyToThread = async (req, res, next) => {
  try {
    const { to, cc, bcc, subject, body, messageId, inReplyTo } = req.body;
    const resolvedMessageId = messageId || inReplyTo;
    const result = await threadService.replyToThread(req.userId, req.params.threadId, {
      to,
      cc,
      bcc,
      subject,
      body,
      messageId: resolvedMessageId,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getThread, replyToThread };
