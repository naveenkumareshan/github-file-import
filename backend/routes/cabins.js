
const express = require('express');
const router = express.Router();
const { protect, admin, hostelManager } = require('../middleware/auth');
const {
  getCabins,
  getCabinsSearch,
  getAdminCabins,
  getFeaturedCabins,
  getCabin,
  createCabin,
  updateCabin,
  deleteCabin,
  getCabinsByCategory,
  getCabinStats,
  bulkUpdateCabins,
  getCabinWithSeats,
  restoreCabin,
  uploadCabinImage,
  uploadCabinImages,
  deleteCabinImage,
  updateRoomLayout,
  getNearbyCabins,
  searchCabins,
  getCabinWithRole,
  addOrUpdateCabinFloor
  // getCabinsByHostel
} = require('../controllers/cabins');

// Public routes
router.get('/', getCabins);
router.get('/featured-cabins', getFeaturedCabins);
// Public routes
router.get('/filter', getCabinsSearch);
router.get('/nearby', getNearbyCabins);
router.get('/search', searchCabins);

router.get('/:id', getCabin);
router.put("/:id/floors", addOrUpdateCabinFloor);
router.get('/category/:category', getCabinsByCategory);
// router.get('/hostel/:hostelId', getCabinsByHostel);

// Protected routes for hostel managers and admins
router.use(protect);
router.get('/for-reviews/all', getCabinWithRole);
router.get('/list/all', getAdminCabins);
router.post('/', hostelManager, createCabin);
router.put('/:id', hostelManager, updateCabin);
router.delete('/:id', hostelManager, deleteCabin);
router.get('/stats/summary', hostelManager, getCabinStats);
router.post('/bulk-update', hostelManager, bulkUpdateCabins);
router.get('/:id/with-seats', hostelManager, getCabinWithSeats);
router.put('/:id/restore', hostelManager, restoreCabin);
router.put('/:id/room-layout', hostelManager, updateRoomLayout);

// Image management routes
router.post('/:id/image', hostelManager, uploadCabinImage);
router.post('/:id/images', hostelManager, uploadCabinImages);
router.delete('/:id/image/:filename', hostelManager, deleteCabinImage);

module.exports = router;
