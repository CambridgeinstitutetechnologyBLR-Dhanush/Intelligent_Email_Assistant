const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, activityController.getActivities);
router.get('/:id', authenticate, activityController.getActivity);

module.exports = router;
