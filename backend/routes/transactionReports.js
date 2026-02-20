
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getTransactionReports,
  exportTransactionsExcel,
  exportTransactionsPDF
} = require('../controllers/transactionReports');

// Protected routes for admins
router.use(protect);
router.use(admin);

// Get transaction reports with filters
router.get('/reports/all', getTransactionReports);

// Export routes
router.get('/excel', exportTransactionsExcel);
router.get('/pdf', exportTransactionsPDF);

module.exports = router;
