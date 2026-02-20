
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  applyCoupon,
  getAvailableCoupons,
  generateReferralCoupon
} = require('../controllers/couponController');

// Public routes for users
router.use(protect);
router.get('/available', getAvailableCoupons);
router.post('/validate', validateCoupon);
router.post('/apply', applyCoupon);
router.post('/generate-referral', generateReferralCoupon);

// Admin/Vendor routes
router.get('/admin', admin, getCoupons);
router.post('/admin', admin, createCoupon);
router.get('/admin/:id', admin, getCoupon);
router.put('/admin/:id', admin, updateCoupon);
router.delete('/admin/:id', admin, deleteCoupon);

module.exports = router;
