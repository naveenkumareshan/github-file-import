
const User = require('../models/User');
const Hostel = require('../models/Hostel');

// @desc    Get hostels for current user
// @route   GET /api/hostels/my-hostels
// @access  Private
exports.getUserHostels = async (req, res) => {
  try {
    
    const query = { ...req.query };
    
     if (req.user.role !== 'admin') {
      query.vendorId = req.user.vendorId;
    }

    // Create query string
    let queryStr = JSON.stringify(query);
    
    // Create operators ($gt, $lt, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // Finding resource
    let hostels =await Hostel.find(JSON.parse(queryStr)).populate('vendorId', 'businessName email phone')
      .populate('state', 'name code')
      .populate('city', 'name')
      .populate('area', 'name')
      .select('name images isActive imageUrl location contactEmail locality contactPhone amenities logoImage description state hostelCode')

      res.status(200).json({
        success: true,
        count: hostels.length,
        data: hostels
      });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Add manager to hostel
// @route   POST /api/hostels/:id/managers
// @access  Private/Admin
exports.addManager = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a user ID'
      });
    }
    
    const hostel = await Hostel.findById(req.params.id);
    const user = await User.findById(userId);
    
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user is already a manager
    if (hostel.managerIds.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a manager for this hostel'
      });
    }
    
    // Add user to hostel managers
    hostel.managerIds.push(userId);
    await hostel.save();
    
    // Update user role if needed
    if (user.role !== 'hostel_manager' && user.role !== 'admin') {
      user.role = 'hostel_manager';
    }
    
    // Add hostel to user's hostels
    if (!user.hostelIds.includes(hostel._id)) {
      user.hostelIds.push(hostel._id);
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      data: hostel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Remove manager from hostel
// @route   DELETE /api/hostels/:id/managers/:userId
// @access  Private/Admin
exports.removeManager = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    const user = await User.findById(req.params.userId);
    
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Remove user from hostel managers
    hostel.managerIds = hostel.managerIds.filter(
      id => id.toString() !== req.params.userId
    );
    await hostel.save();
    
    // Remove hostel from user's hostels
    user.hostelIds = user.hostelIds.filter(
      id => id.toString() !== req.params.id
    );
    
    // If user has no more hostels, change role back to student
    if (user.hostelIds.length === 0 && user.role === 'hostel_manager') {
      user.role = 'student';
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
