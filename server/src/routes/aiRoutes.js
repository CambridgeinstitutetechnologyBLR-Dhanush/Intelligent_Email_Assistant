const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const { aiSummarizeRules, aiReplyRules, validate } = require('../middleware/validation');

router.post('/summarize', authenticate, aiLimiter, aiSummarizeRules, validate, aiController.summarize);
router.post('/generate-reply', authenticate, aiLimiter, aiReplyRules, validate, aiController.generateReply);

module.exports = router;
