
const express = require('express');
const router = express.Router();
const { protect, admin, hostelManager } = require('../middleware/auth');
const {
  exportBookingsAsExcel,
  exportRevenueAsExcel, 
  exportBookingsAsPDF,
  getOccupancyReports
} = require('../controllers/reportsExport');
const {
  exportTransactionsExcel,
  exportTransactionsPDF
} = require('../controllers/transactionReports');

// Protected routes for admins and hostel managers
router.use(protect);

// Export routes
router.get('/export/excel', exportBookingsAsExcel);
router.get('/export/revenue', exportRevenueAsExcel);
router.get('/export/pdf', exportBookingsAsPDF);

// Transaction export routes
router.get('/transactions/excel', admin, exportTransactionsExcel);
router.get('/transactions/pdf', admin, exportTransactionsPDF);

// Occupancy reports route - accessible to both admins and hostel managers
router.get('/occupancy', protect, getOccupancyReports);

module.exports = router;
