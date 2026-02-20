
const express = require('express');
const router = express.Router();
const { protect, admin, hostelManager } = require('../middleware/auth');
const {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  approveReview,
  getEntityRating,
  getUserReviews,
  getAdminReviews
} = require('../controllers/reviews');

// Public routes
router.get('/', getReviews);
router.get('/:id', getReview);
router.get('/rating/:entityType/:entityId', getEntityRating);

// Protected routes
router.use(protect);
router.get('/list/admin', getAdminReviews);
router.post('/', createReview);
router.get('/user/me', getUserReviews);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

// Admin/HostelManager routes
router.put('/:id/approve', hostelManager, approveReview);

module.exports = router;
