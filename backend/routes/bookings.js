
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  createBooking,
  getUserBookings,
  getBooking,
  cancelBooking,
  processPayment,
  getCurrentBookings,
  getBookingHistory,
  getBookingReports,
  renewBooking
} = require('../controllers/bookings');

// Student booking routes
router.route('/')
  .post(protect, createBooking);

router.get('/user', protect, getUserBookings);
router.get('/user/current', protect, getCurrentBookings);
router.get('/user/history', protect, getBookingHistory);
router.get('/reports', protect, getBookingReports);
router.get('/:id', protect, getBooking);
router.put('/:id/cancel', protect, cancelBooking);
router.post('/:id/payment', protect, processPayment);
router.post('/:id/renew', protect, renewBooking);
// Admin routes
// router.use('/admin/bookings', require('./adminBookings'));

module.exports = router;
