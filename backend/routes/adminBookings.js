
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getAllBookings,
  getBookingById,
  updateBooking,
  updateTransferBooking,
  cancelBookingByAdmin,
  getBookingReports,
  getBookingStatistics,
  getOccupancyRates,
  getRevenueReports,
  getExpiringBookings,
  getTopFillingRooms,
  getMonthlyRevenue,
  getMonthlyOccupancy,
  getActiveResidents,
  getRevenueByTransaction,
  getAllTransactions
} = require('../controllers/adminBookings');

// All routes require admin privileges
router.use(protect);
router.use(admin);

router.route('/')
  .get(getAllBookings);

router.route('/all/transactions')
  .get(getAllTransactions);
  

router.get('/reports', getBookingReports);
router.get('/statistics', getBookingStatistics);
router.get('/occupancy', getOccupancyRates);
router.get('/revenue', getRevenueReports);
router.get('/transaction-revenue', getRevenueByTransaction);

router.get('/expiring', getExpiringBookings);
router.get('/top-filling-rooms', getTopFillingRooms);
router.get('/monthly-revenue', getMonthlyRevenue);
router.get('/monthly-occupancy', getMonthlyOccupancy);
router.get('/active-residents', getActiveResidents);
router.route('/:id')
  .get(getBookingById)
  .put(updateBooking);

router.route('/transfer/:id').put(updateTransferBooking);
router.post('/:id/cancel', cancelBookingByAdmin);

module.exports = router;
