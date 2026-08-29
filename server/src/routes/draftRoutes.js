const express = require('express');
const router = express.Router();
const draftController = require('../controllers/draftController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, draftController.createDraft);
router.get('/', authenticate, draftController.listDrafts);
router.put('/:id', authenticate, draftController.updateDraft);
router.delete('/:id', authenticate, draftController.deleteDraft);
router.post('/:id/send', authenticate, draftController.sendDraft);

module.exports = router;
