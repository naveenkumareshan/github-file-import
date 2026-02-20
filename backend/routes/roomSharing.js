
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  getRoomSharingOptions, 
  getAllSharingOptions 
} = require('../controllers/roomSharingController');

// Public routes
router.get('/rooms/:id/sharing', getRoomSharingOptions);
router.get('/rooms/sharing-options', getAllSharingOptions);

module.exports = router;
