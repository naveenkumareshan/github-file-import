const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getUserProfile,
  updateProfile,
  uploadProfilePicture,
  removeProfilePicture,
  updatePassword,
  getPreferences,
  updatePreferences
} = require('../controllers/userProfile');

// All routes are protected
router.use(protect);

// Profile routes
router.get('/profile', getUserProfile);
router.put('/profile', updateProfile);

// Profile picture routes
router.post('/profile/picture', uploadProfilePicture);
router.delete('/profile/picture', removeProfilePicture);

// Password route
router.put('/password', updatePassword);

// Preferences routes
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

module.exports = router;