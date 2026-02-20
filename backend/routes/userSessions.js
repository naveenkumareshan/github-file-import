
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getActiveSessions,
  getSessionStatistics,
  forceLogout,
  getUserLoginHistory
} = require('../controllers/userSessions');

// All routes require admin privileges
router.use(protect);
router.use(admin);

router.get('/', getActiveSessions);
router.get('/statistics', getSessionStatistics);
router.post('/:sessionId/logout', forceLogout);
router.get('/history/:userId', getUserLoginHistory);

module.exports = router;
