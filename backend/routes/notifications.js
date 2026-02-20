
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendNotification,
  sendVendorOffer,
  getNotificationHistory,
  getNotificationStats,
  updateFcmToken,
  testNotification
} = require('../controllers/notificationController');

// Check if user is admin
const adminAccess = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  next();
};

// All routes require authentication
router.use(protect);

// Admin only routes
router.post('/send', adminAccess, sendNotification);
router.post('/vendor-offer/:vendorId', adminAccess, sendVendorOffer);
router.get('/history', adminAccess, getNotificationHistory);
router.get('/stats', adminAccess, getNotificationStats);
router.post('/test', adminAccess, testNotification);

// User routes
router.post('/update-token', updateFcmToken);

module.exports = router;
