const { body, param, query, validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Auth validation rules
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Email validation rules
const sendEmailRules = [
  body('to').isArray({ min: 1 }).withMessage('At least one recipient is required'),
  body('to.*').isEmail().withMessage('Invalid recipient email'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('body').trim().notEmpty().withMessage('Message body is required'),
];

const aiSummarizeRules = [
  body('threadId').optional({ nullable: true }).trim().notEmpty(),
  body('messageId').optional({ nullable: true }).trim().notEmpty(),
  body().custom((value) => {
    if (!value.threadId && !value.messageId) {
      throw new Error('Thread ID or message ID is required');
    }
    return true;
  }),
];

const aiReplyRules = [
  body().custom((value) => {
    if (!value.threadId && !value.messageId && !value.prompt) {
      throw new Error('Thread ID, message ID, or prompt is required');
    }
    return true;
  }),
  body('threadId').optional({ nullable: true }).trim().notEmpty().withMessage('Thread ID cannot be empty'),
  body('messageId').optional({ nullable: true }).trim().notEmpty().withMessage('Message ID cannot be empty'),
  body('prompt').optional({ nullable: true }).trim().isLength({ max: 15000 }).withMessage('Prompt must be at most 15,000 characters'),
  body('tone').optional().isIn(['professional', 'friendly', 'concise', 'formal', 'appreciative', 'casual', 'urgent']),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  sendEmailRules,
  aiSummarizeRules,
  aiReplyRules,
};
