const aiService = require('../services/aiService');
const threadService = require('../services/threadService');
const emailService = require('../services/emailService');
const EmailSummary = require('../models/EmailSummary');
const activityService = require('../services/activityService');
const config = require('../config/env');

const summarize = async (req, res, next) => {
  try {
    const { threadId, messageId } = req.body;
    let result;

    if (threadId) {
      const thread = await threadService.getThread(req.userId, threadId);
      result = await aiService.summarizeThread(thread.messages);
      await EmailSummary.findOneAndUpdate(
        { owner: req.userId, threadId },
        { owner: req.userId, threadId, summary: result.summary, actionItems: result.actionItems, model: config.ai.model, generatedAt: new Date() },
        { upsert: true, new: true }
      );
    } else if (messageId) {
      const email = await emailService.getEmail(req.userId, messageId);
      result = await aiService.summarizeEmail({
        subject: email.subject,
        body: email.body?.text || email.body?.html || '',
        from: email.from,
        date: email.date,
      });
      await EmailSummary.findOneAndUpdate(
        { owner: req.userId, messageId },
        { owner: req.userId, messageId, summary: result.summary, actionItems: result.actionItems, model: config.ai.model, generatedAt: new Date() },
        { upsert: true, new: true }
      );
    } else {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'threadId or messageId is required' });
    }

    await activityService.log({ owner: req.userId, action: 'ai_summarize', threadId, messageId, status: 'success' });
    res.json({ ...result, isAIGenerated: true });
  } catch (error) {
    next(error);
  }
};

const generateReply = async (req, res, next) => {
  try {
    const { threadId, messageId, prompt, tone = 'professional' } = req.body;
    // A selected email takes precedence: reply from its content only, not from
    // an entire conversation that may include the user's earlier messages.
    const threadMessages = messageId
      ? [await emailService.getEmail(req.userId, messageId)]
      : threadId
        ? (await threadService.getThread(req.userId, threadId)).messages
        : null;
    const result = await aiService.generateReply({ threadMessages, prompt, tone });
    await activityService.log({ owner: req.userId, action: 'ai_generate_reply', threadId, messageId, status: 'success' });
    res.json({ ...result, reply: result.content, isAIGenerated: true });
  } catch (error) {
    next(error);
  }
};

module.exports = { summarize, generateReply };
