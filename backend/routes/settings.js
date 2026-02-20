
const express = require('express');
const router = express.Router();
const { protect ,admin} = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

// Get all settings or by category
router.get('/', protect, admin, settingsController.getSettings);

// Get settings by category and provider
router.get('/:category/:provider', protect, admin, settingsController.getSettingsByProvider);

// Create or update settings
router.post('/', protect, admin, settingsController.upsertSettings);
router.put('/:category/:provider?', protect, admin, settingsController.upsertSettings);

// Delete settings
router.delete('/:category/:provider?', protect, admin, settingsController.deleteSettings);

// Test configurations
router.post('/test/email', protect, admin, settingsController.testEmailSettings);
router.post('/test/sms', protect, admin, settingsController.testSmsSettings);

module.exports = router;
