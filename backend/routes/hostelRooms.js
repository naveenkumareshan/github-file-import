
const express = require('express');
const router = express.Router();
const { protect, admin, hostelManager } = require('../middleware/auth');
const {
  getHostelRoom,
  updateHostelRoom,
  deleteHostelRoom,
} = require('../controllers/hostelRoomsController');

// All routes require authentication
router.use(protect);

// Individual room routes
router.route('/:id')
  .get(hostelManager, getHostelRoom)
  .put(hostelManager, updateHostelRoom)
  .delete(hostelManager, deleteHostelRoom);

module.exports = router;
