
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const VendorEmployee = require('../models/VendorEmployee');

// Protect routes - regular authentication
exports.protect = async (req, res, next) => {
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
        const THRESHOLD_MINUTES = 5;

    if (!req.user.mobileData.lastActiveTime || (Date.now() - req.user.mobileData.lastActiveTime.getTime()) > THRESHOLD_MINUTES * 60 * 1000) {
      await User.findByIdAndUpdate(decoded.id, { lastActiveTime: new Date() });
    }
    // if(!req.user.mobileData.isSessionActive){
    //      return res.status(401).json({
    //     success: false,
    //     message: 'Invalid Session Please Login Again'
    //   });
    // }
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Admin middleware
exports.admin = (req, res, next) => {
  if (req.user && (req.user.role === 'vendor' || req.user.role === 'vendor_employee' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Admin access required for this route'
    });
  }
};

// Hostel manager middleware
exports.hostelManager = (req, res, next) => {
  if (req.user && (req.user.role === 'vendor' || req.user.role === 'vendor_employee' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Hostel manager access required for this route'
    });
  }
};
