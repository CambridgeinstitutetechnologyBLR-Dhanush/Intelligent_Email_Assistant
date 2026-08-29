const express = require('express');
const router = express.Router();
const threadController = require('../controllers/threadController');
const { authenticate } = require('../middleware/auth');

router.get('/:threadId', authenticate, threadController.getThread);
router.post('/:threadId/reply', authenticate, threadController.replyToThread);

module.exports = router;
