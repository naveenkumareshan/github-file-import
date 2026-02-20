
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
// const { vendorAuth, dataIsolation } = require('../middleware/vendorAuth');
const {
  getVendorCabins,
  getVendorSeats,
  getCabinSeats,
  updateSeatPrice,
  toggleSeatAvailability,
  toggleHotSelling,
  getSeatBookingDetails
} = require('../controllers/vendorSeatsController');

// Apply authentication middleware
router.use(protect);
router.use(admin);
// router.use(dataIsolation);

// Vendor cabin routes
router.get('/cabins', getVendorCabins);
router.get('/cabins/:cabinId/seats', getCabinSeats);

// Vendor seat routes
router.get('/seats', getVendorSeats);
router.put('/seats/:seatId/price', updateSeatPrice);
router.put('/seats/:seatId/availability', toggleSeatAvailability);
router.put('/seats/:seatId/hot-selling', toggleHotSelling);
router.get('/seats/:seatId/booking', getSeatBookingDetails);

module.exports = router;
