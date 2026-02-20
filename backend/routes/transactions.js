
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createTransaction,
  createTransactionByAdmin,
  getTransaction,
  updateTransactionStatus,
  processRenewal,
  getUserTransactions,
  getBookingTransactions
} = require('../controllers/transactions');


router.route('/by-admin').post(createTransactionByAdmin);

// All routes require authentication
router.use(protect);

// Transaction routes
router.route('/')
  .post(createTransaction);

router.get('/user-transactions', getUserTransactions);
router.get('/booking/:bookingId', getBookingTransactions);
router.get('/:id', getTransaction);
router.put('/:id/status', updateTransactionStatus);
router.post('/:id/process-renewal', processRenewal);

module.exports = router;
