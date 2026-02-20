
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getLaundryMenuItems,
  createLaundryMenuItem,
  deleteLaundryMenuItem,
  createLaundryOrder,
  getUserLaundryOrders,
  getAllLaundryOrders,
  updateLaundryOrderStatus,
  createLaundryComplaint,
  resolveLaundryComplaint,
  // getLaundryReports,
  // getCurrentProcessingOrders,
  // getCurrentDeliveredOrders
} = require('../controllers/laundry');

// Laundry Menu Items
router.route('/menu')
  .get(getLaundryMenuItems)
  .post(protect, admin, createLaundryMenuItem);

router.delete('/menu/:id', protect, admin, deleteLaundryMenuItem);

// Laundry Orders
router.route('/orders')
  .get(protect, admin, getAllLaundryOrders)
  .post(protect, createLaundryOrder);

// Student specific routes
router.get('/orders/user', protect, getUserLaundryOrders);
// router.get('/orders/user/processing', protect, getCurrentProcessingOrders);
// router.get('/orders/user/delivered', protect, getCurrentDeliveredOrders);

// Order status and complaints
router.put('/orders/:id/status', protect, admin, updateLaundryOrderStatus);
router.post('/orders/:id/complaints', protect, createLaundryComplaint);
router.put('/complaints/:id/resolve', protect, admin, resolveLaundryComplaint);

// Reports
// router.get('/reports', protect, getLaundryReports);

// Admin routes
router.use('/admin', require('./adminLaundry'));

module.exports = router;
