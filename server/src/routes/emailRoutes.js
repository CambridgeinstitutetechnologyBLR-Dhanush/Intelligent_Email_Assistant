const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { authenticate } = require('../middleware/auth');
const { sendEmailRules, validate } = require('../middleware/validation');

router.get('/', authenticate, emailController.listEmails);
router.get('/search', authenticate, emailController.searchEmails);
router.get('/:id', authenticate, emailController.getEmail);
router.post('/:id/read', authenticate, emailController.markAsRead);
router.post('/:id/unread', authenticate, emailController.markAsUnread);
router.post('/:id/star', authenticate, emailController.starEmail);
router.delete('/:id/star', authenticate, emailController.unstarEmail);
router.post('/:id/archive', authenticate, emailController.archiveEmail);
router.delete('/:id', authenticate, emailController.deleteEmail);
router.post('/send', authenticate, sendEmailRules, validate, emailController.sendEmail);

module.exports = router;
