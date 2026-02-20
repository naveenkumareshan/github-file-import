
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getAllComplaints,
  resolveComplaint,
  getOrderReports,
  getOrderStatistics,
  getRevenueByCategory,
  getBlockDistribution,
  bulkUpdateOrderStatus
} = require('../controllers/adminLaundry');

// All routes require admin privileges
router.use(protect);
router.use(admin);

// Menu Item Management
router.route('/laundry/menu')
  .get(getAllMenuItems)
  .post(createMenuItem);

router.route('/laundry/menu/:id')
  .put(updateMenuItem)
  .delete(deleteMenuItem);

// Order Management
router.route('/laundry/orders')
  .get(getAllOrders);

router.route('/laundry/orders/:id')
  .get(getOrderById)
  .put(updateOrderStatus)
  .delete(deleteOrder);

router.put('/laundry/orders/bulk-status', bulkUpdateOrderStatus);

// Complaints Management
router.get('/laundry/complaints', getAllComplaints);
router.put('/laundry/complaints/:id/resolve', resolveComplaint);

// Reports and Analytics
router.get('/laundry/reports', getOrderReports);
router.get('/laundry/statistics', getOrderStatistics);
router.get('/laundry/revenue-by-category', getRevenueByCategory);
router.get('/laundry/block-distribution', getBlockDistribution);

module.exports = router;
