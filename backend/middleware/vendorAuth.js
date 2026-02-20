
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');

// Vendor authentication middleware
exports.vendorAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from the token
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is vendor or vendor employee
    if (req.user.role !== 'vendor' && req.user.role !== 'vendor_employee') {
      return res.status(403).json({
        success: false,
        message: 'Vendor access required for this route'
      });
    }

    // Get vendor information
    let vendor;
    if (req.user.role === 'vendor') {
      vendor = await Vendor.findOne({ managerId: req.user._id });
    } else if (req.user.role === 'vendor_employee') {
      vendor = await Vendor.findOne(req.user.vendorId);
    }

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    req.vendor = vendor;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Data isolation middleware - ensures vendors can only access their own data
exports.dataIsolation = (req, res, next) => {
  // Add vendor ID filter to queries
  req.vendorFilter = { vendorId: req.vendor._id };
  next();
};
