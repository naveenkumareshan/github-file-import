
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  createManualCabinBooking,
  createManualHostelBooking,
  extendBooking,
  updateBookingData,
  recordManualPayment,
  getBookingDetails
} = require('../controllers/adminManualBookingController');

// All routes require admin privileges
router.use(protect);
router.use(admin);

// Manual booking routes
router.post('/manual/cabin', createManualCabinBooking);
router.post('/manual/hostel', createManualHostelBooking);

// Booking management routes
router.put('/:id/extend', extendBooking);
router.put('/:id/update-data', updateBookingData);
router.post('/:id/payment', recordManualPayment);
router.get('/:id/details', getBookingDetails);

module.exports = router;
