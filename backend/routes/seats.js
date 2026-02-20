
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getSeats,
  getSeatsCount,
  getSeatsAdmin,
  getSeatsByCabinAdmin,
  getSeatsByCabin,
  getSeat,
  createSeat,
  updateSeat,
  deleteSeat,
  checkSeatAvailability,
  bulkCreateSeats,
  bulkUpdateSeats,
  getSeatBookingHistory,
  checkSeatsAvailabilityBulk,
  getAvailableSeatsForDateRange
} = require('../controllers/seats');

// Public routes
router.get('/', getSeats);
router.get('/cabin/:cabinId/:floor', getSeatsByCabin);
router.get('/cabin/:cabinId/available', getAvailableSeatsForDateRange);
router.get('/cabin/:cabinId/floor/:floor/available', getAvailableSeatsForDateRange);
router.get('/:id', getSeat);
router.get('/:id/availability', checkSeatAvailability);
router.post('/check-availability-bulk', checkSeatsAvailabilityBulk);

// Admin routes
router.post('/', protect, admin, createSeat);
router.get('/get/count',protect, admin, getSeatsCount);
router.get('/seats/get', admin, getSeatsAdmin);
router.get('/admin/cabin/:cabinId', getSeatsByCabinAdmin);
router.put('/:id', protect, admin, updateSeat);
router.delete('/:id', protect, admin, deleteSeat);
router.post('/bulk-create', protect, admin, bulkCreateSeats);
router.post('/bulk-update', protect, admin, bulkUpdateSeats);
router.get('/:id/booking-history', protect, admin, getSeatBookingHistory);

module.exports = router;
