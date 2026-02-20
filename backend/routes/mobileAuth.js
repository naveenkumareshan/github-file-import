
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  mobileRegister,
  mobileLogin,
  getMobileProfile,
  updateFcmToken,
  verifySession,
  mobileLogout
} = require('../controllers/mobileAuth');

// Public routes
router.post('/register', mobileRegister);
router.post('/login', mobileLogin);

// Protected routes
router.use(protect);
router.get('/me', getMobileProfile);
router.post('/verify-session', verifySession);
router.post('/update-fcm-token', updateFcmToken);
router.post('/logout', mobileLogout);

module.exports = router;
