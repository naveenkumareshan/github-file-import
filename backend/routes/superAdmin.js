
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getAllVendors,
  getVendorById,
  updateVendorStatus,
  updateVendorDetails,
  getVendorStats,
  exportVendorsData,
  getAllPayouts,
  processPayout,
  getSystemAnalytics
} = require('../controllers/superAdminController');

const {
  getVendorsWithPayoutSettings,
  updateVendorAutoPayoutSettings,
  getVendorAutoPayoutSettings,
  toggleVendorAutoPayout,
  getAutoPayoutStats
} = require('../controllers/adminVendorSettingsController');

// Super admin middleware
const superAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Admin access required for this route'
    });
  }
};

// All routes require admin privileges
router.use(protect);
router.use(superAdmin);

// Vendor management routes
router.get('/vendors', getAllVendors);
router.get('/vendors/stats', getVendorStats);
router.get('/vendors/export', exportVendorsData);
router.get('/vendors/:id', getVendorById);
router.put('/vendors/:id', updateVendorDetails);
router.put('/vendors/:id/status', updateVendorStatus);

// Payout management routes
router.get('/payouts', getAllPayouts);
router.put('/payouts/:id/process', processPayout);

// Analytics routes
router.get('/analytics', getSystemAnalytics);

// Admin vendor payout settings routes
router.get('/vendors-payout/payout-settings', getVendorsWithPayoutSettings);
router.put('/vendors-payout/:vendorId/auto-payout-settings', updateVendorAutoPayoutSettings);
router.get('/vendors-payout/:vendorId/auto-payout-settings', getVendorAutoPayoutSettings);
router.put('/vendors-payout/:vendorId/auto-payout-toggle', toggleVendorAutoPayout);
router.get('/vendors-payout/auto-payout-stats', getAutoPayoutStats);

module.exports = router;
