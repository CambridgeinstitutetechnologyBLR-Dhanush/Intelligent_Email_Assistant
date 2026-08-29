const ReplyDraft = require('../models/ReplyDraft');

const createDraft = async (req, res, next) => {
  try {
    const draft = await ReplyDraft.create({ ...req.body, owner: req.userId });
    res.status(201).json(draft);
  } catch (error) {
    next(error);
  }
};

const updateDraft = async (req, res, next) => {
  try {
    const draft = await ReplyDraft.findOneAndUpdate({ _id: req.params.id, owner: req.userId }, req.body, { new: true });
    if (!draft) return res.status(404).json({ error: 'Not found' });
    res.json(draft);
  } catch (error) {
    next(error);
  }
};

const listDrafts = async (req, res, next) => {
  try {
    const drafts = await ReplyDraft.find({ owner: req.userId }).sort({ updatedAt: -1 });
    res.json({ drafts });
  } catch (error) {
    next(error);
  }
};

const deleteDraft = async (req, res, next) => {
  try {
    await ReplyDraft.findOneAndDelete({ _id: req.params.id, owner: req.userId });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const sendDraft = async (req, res, next) => {
  try {
    const draft = await ReplyDraft.findOne({ _id: req.params.id, owner: req.userId });
    if (!draft) return res.status(404).json({ error: 'Draft not found' });
    // Delegate actual sending to thread/email service
    const threadService = require('../services/threadService');
    const result = await threadService.replyToThread(req.userId, draft.threadId, {
      to: req.body.to, subject: req.body.subject, body: draft.content, messageId: draft.messageId,
    });
    await ReplyDraft.findByIdAndDelete(draft._id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { createDraft, updateDraft, listDrafts, deleteDraft, sendDraft };
