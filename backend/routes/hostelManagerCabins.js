
const express = require('express');
const router = express.Router();
const { protect, hostelManager } = require('../middleware/auth');
const {
  getManagedCabins,
  getCabinRevenueStats,
  getCabinBookingStats,
  getCabinSeatsStats
} = require('../controllers/hostelManagerCabinsController');

// All routes require hostel manager privileges
router.use(protect);
router.use(hostelManager);

router.get('/', getManagedCabins);
router.get('/revenue', getCabinRevenueStats);
router.get('/bookings-stats', getCabinBookingStats);
router.get('/seats-stats', getCabinSeatsStats);

module.exports = router;
