
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { vendorAuth, dataIsolation } = require('../middleware/vendorAuth');
const {
  getVendorIncome,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getPayouts,
  requestPayout,
  getReports,
  getVendors,
  getProfile,
  updateProfile,
  getAutoPayoutSettings,
  updateAutoPayoutSettings,
  getPayoutPreview
} = require('../controllers/vendorController');

router.use(protect);
router.route('/')
  .get(getVendors)

router.use('/', require('./vendorSeats'));

// Apply vendor authentication to all routes
router.use(vendorAuth);
router.use(dataIsolation);

// Income analytics routes
router.get('/income/analytics', getVendorIncome);

// Enhanced routes for vendor employee management
router.route('/employees')
  .get(getEmployees)
  .post(createEmployee);
  
router.route('/employees/:employeeId')
  .put(updateEmployee)
  .delete(deleteEmployee);

// Enhanced payout management routes
router.route('/payouts')
  .get(getPayouts)
  .post(requestPayout);

// Auto payout settings routes
router.route('/auto-payout-settings')
  .get(getAutoPayoutSettings)
  .put(updateAutoPayoutSettings);

// Payout preview route
router.get('/payout-preview', getPayoutPreview);

// Reports routes
router.get('/reports', getReports);

// Update vendor profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Document management routes
router.use('/documents', require('./vendorDocuments'));
module.exports = router;
