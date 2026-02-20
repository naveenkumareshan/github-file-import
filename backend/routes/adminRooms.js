
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  restoreRoom,
  uploadRoomImage,
  getRoomStats,
  bulkUpdateRooms
} = require('../controllers/adminRooms');

// All routes are protected with admin middleware
router.use(protect);
router.use(admin);

router.get('/', getAllRooms);
router.get('/stats', getRoomStats);
router.get('/:id', getRoomById);
router.post('/', createRoom);
router.put('/:id', updateRoom);
router.delete('/:id', deleteRoom);
router.put('/:id/restore', restoreRoom);
router.post('/:id/image', uploadRoomImage);
router.post('/bulk-update', bulkUpdateRooms);

module.exports = router;
