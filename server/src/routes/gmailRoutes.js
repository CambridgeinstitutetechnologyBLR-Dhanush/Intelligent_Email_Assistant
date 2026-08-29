const express = require('express');
const router = express.Router();
const gmailController = require('../controllers/gmailController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.get('/oauth/start', authenticate, authLimiter, gmailController.startOAuth);
router.get('/oauth/callback', gmailController.oauthCallback); // No auth — Google redirects here
router.get('/status', authenticate, gmailController.getStatus);
router.post('/reconnect', authenticate, gmailController.reconnect);
router.post('/disconnect', authenticate, gmailController.disconnect);

module.exports = router;
