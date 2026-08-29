const emailService = require('../services/emailService');

const listEmails = async (req, res, next) => {
  try {
    const { maxResults = 20, pageToken, labelIds, q } = req.query;
    const parsedLabels = labelIds ? labelIds.split(',') : undefined;
    const result = await emailService.listEmails(req.userId, { maxResults: parseInt(maxResults), pageToken, labelIds: parsedLabels, q });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const searchEmails = async (req, res, next) => {
  try {
    const { q, maxResults = 20, pageToken } = req.query;
    const result = await emailService.searchEmails(req.userId, { q, maxResults: parseInt(maxResults), pageToken });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getEmail = async (req, res, next) => {
  try {
    const email = await emailService.getEmail(req.userId, req.params.id);
    res.json(email);
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    await emailService.markAsRead(req.userId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const markAsUnread = async (req, res, next) => {
  try {
    await emailService.markAsUnread(req.userId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const starEmail = async (req, res, next) => {
  try {
    await emailService.starMessage(req.userId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const unstarEmail = async (req, res, next) => {
  try {
    await emailService.unstarMessage(req.userId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const archiveEmail = async (req, res, next) => {
  try {
    await emailService.archiveMessage(req.userId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const deleteEmail = async (req, res, next) => {
  try {
    await emailService.deleteMessage(req.userId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const sendEmail = async (req, res, next) => {
  try {
    const { to, cc, bcc, subject, body } = req.body;
    const result = await emailService.sendEmail(req.userId, { to, cc, bcc, subject, body });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { listEmails, searchEmails, getEmail, markAsRead, markAsUnread, starEmail, unstarEmail, archiveEmail, deleteEmail, sendEmail };
