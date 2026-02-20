
const express = require('express');
const router = express.Router();
const {
  registerVendor,
  getVendorStatus
} = require('../controllers/vendorRegistrationController');

// Public routes for vendor registration
router.post('/register', registerVendor);
router.get('/status/:vendorId', getVendorStatus);

module.exports = router;
