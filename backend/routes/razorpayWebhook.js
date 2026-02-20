const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  handleRazorpayWebhook,
  getWebhookLogs
} = require('../controllers/razorpayWebhook');

// Webhook endpoint (no auth required, verified by signature)
router.post('/', handleRazorpayWebhook);

// Admin routes for webhook logs
router.get('/logs', protect, admin, getWebhookLogs);

module.exports = router;