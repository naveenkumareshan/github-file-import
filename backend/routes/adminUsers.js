
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getAllUsers,
  CreateUser,
  updateUser,
  getUserBookings
} = require('../controllers/adminUsers');

// All routes require admin privileges
router.use(protect);
router.use(admin);

router.route('/')
  .get(getAllUsers);

router.route('/:id')
  // .get(getUserById)
  .put(updateUser);

router.route('/')
  .post(CreateUser);

router.route('/bookings')
  .get(getUserBookings);

module.exports = router;
