const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getErrorLogs,
  createErrorLog,
  deleteErrorLog,
  deleteMultipleErrorLogs,
  markAsResolved,
  getErrorLogStats
} = require('../controllers/errorLogs');

// All routes require admin privileges except createErrorLog
router.use(protect);

// Public route for creating error logs (can be called by frontend error handlers)
router.post('/', createErrorLog);

// Admin only routes
router.use(admin);
router.get('/', getErrorLogs);
router.get('/stats', getErrorLogStats);
router.delete('/bulk', deleteMultipleErrorLogs);
router.delete('/:id', deleteErrorLog);
router.patch('/:id/resolve', markAsResolved);

module.exports = router;