
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getDeposits,
  getRefunds,
  processRefund,
  bulkProcessRefunds,
  exportDepositsReport
} = require('../controllers/depositRefundController');

// All routes require admin authentication
router.use(protect);
router.use(admin);

// Deposit routes
router.get('/', getDeposits);
router.get('/refunds', getRefunds);
router.post('/:depositId/refund', processRefund);
router.post('/bulk-refund', bulkProcessRefunds);
router.get('/export', exportDepositsReport);

module.exports = router;
