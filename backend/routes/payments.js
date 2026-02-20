
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createOrder,
  verifyPayment,
  verifyTransactionPayment,
  checkPaymentStatus
} = require('../controllers/payments');

// All routes require authentication
router.use(protect);

// RazorPay routes
router.post('/razorpay/create-order', createOrder);
router.post('/razorpay/verify-payment', verifyPayment);
router.post('/razorpay/verify', verifyPayment);
router.post('/razorpay/verify-transaction-payment', verifyTransactionPayment);
router.get('/status/:bookingId', checkPaymentStatus);

module.exports = router;
