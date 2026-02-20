
const express = require('express');
const router = express.Router();
const { protect, admin, hostelManager } = require('../middleware/auth');
const {
  getHostels,
  getHostel,
  createHostel,
  updateHostel,
  deleteHostel,
  addRoomToHostel,
  getHostelAvailability,
  getNearbyHostels
} = require('../controllers/hostelController');

const {
  getUserHostels,
  addManager,
  removeManager
} = require('../controllers/hostelManagerController');

const { 
  getHostelRooms,
  getHostelRoomStats,
  createHostelRoom
} = require('../controllers/hostelRoomsController');

const {
  uploadHostelLogo
} = require('../controllers/hostelMediaController');

// Public routes
router.get('/', getHostels);
router.get('/nearby', getNearbyHostels);
router.get('/:id/hostel', getHostel);
router.get('/:id/availability', getHostelAvailability);

// Protected routes
router.get('/my-hostels', protect, getUserHostels);

// Hostel manager and admin routes
router.use(protect);
router.post('/', hostelManager, createHostel);
router.put('/:id', hostelManager, updateHostel);
router.delete('/:id', admin, deleteHostel);
router.get('/:id/rooms', getHostelRooms);
router.get('/:id/rooms/stats', hostelManager, getHostelRoomStats);
router.post('/:id/logo', hostelManager, uploadHostelLogo);
router.post('/:id/rooms', hostelManager, createHostelRoom);

// Manager management (admin only)
router.post('/:id/managers', admin, addManager);
router.delete('/:id/managers/:userId', admin, removeManager);

module.exports = router;
