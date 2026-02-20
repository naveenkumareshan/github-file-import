
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  createHostelBooking,
  getUserHostelBookings,
  getHostelBooking,
  cancelHostelBooking,
  processHostelPayment,
  getHostelBedAvailability,
  reserveBed,
  confirmPayment,
  getHostelBookingsAdmin,
  getHostelBookingsByRoom,
  updateOrderRazorpay
} = require('../controllers/hostelBookingController');

// Public routes
router.get('/:hostelId/availability', getHostelBedAvailability);

// Protected routes
router.use(protect);
router.post('/', createHostelBooking);
router.post('/update-order/:id/order', updateOrderRazorpay);
router.post('/reserve', reserveBed);
router.post('/confirm-payment', confirmPayment);
router.get('/user', getUserHostelBookings);
router.get('/:id', getHostelBooking);
router.post('/:id/cancel', cancelHostelBooking);
router.post('/:id/payment', processHostelPayment);

// Admin routes for hostel bookings
router.get('/admin/current', admin, getHostelBookingsAdmin);
router.get('/admin/room/:roomId/bookings', admin, getHostelBookingsByRoom);

module.exports = router;
