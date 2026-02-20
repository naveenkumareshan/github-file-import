
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  createBulkBookings,
  getBulkBookingStatus,
  generateBulkBookingReport
} = require('../controllers/adminBulkBookings');

// All routes require admin authentication
router.use(protect, admin);

// Bulk booking routes
router.post('/bulk-create', createBulkBookings);
router.get('/status/:batchId', getBulkBookingStatus);
router.post('/generate-report', generateBulkBookingReport);

module.exports = router;
