const User = require('../models/User');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const jobProcessor = require('../services/jobProcessor');
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, gender } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        success: false,
        message: 'This email may already be registered'
      });
    }

    let phonecheck = await User.findOne({ phone });

    if (phonecheck) {
      return res.status(400).json({
        success: false,
        message: 'This Mobile may already be registered'
      });
    }

    // Validate role
    const allowedRoles = ['student', 'hostel_manager'];
    const finalRole = role && allowedRoles.includes(role) ? role : 'student';

    // Create user
    user = await User.create({
      name,
      email,
      password,
      role: finalRole,
      phone,
      gender
    });

    // Generate token
    const token = user.getSignedJwtToken();

       // Send welcome email asynchronously
    try {
      const jobId = jobProcessor.addJob('send_welcome_email', {
        email: user.email,
        name: user.name
      }, 'normal');
      console.log('Welcome email job queued:', jobId);
    } catch (emailError) {
      console.error('Failed to queue welcome email:', emailError);
      // Don't fail registration if email queuing fails
    }

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, appVersion, deviceId, deviceModel, deviceType ,osVersion, platform} = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(200).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // Check for user
    var user = await User.findOne({ email }).select('+password');

    if(!user){
        user = await User.findOne({ phone:email }).select('+password');
    }
    if (!user) {
      return res.status(200).json({
        success: false,
        message: 'Invalid credentials',
        // error:'dtaat'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(200).json({
        success: false,
        message: 'Invalid credentials',
        // error:'dtaat'
      });
    }

    // Create new session token
    const sessionToken = jwt.sign(
      { 
        userId: user._id,
        deviceId, 
        deviceType, 
        timestamp: Date.now() 
      },
      process.env.JWT_SECRET,
      { expiresIn: '90d' }
    );

    // Update mobile data with new session info
    const updateData = {
      'mobileData.deviceType': deviceType,
      'mobileData.deviceId': deviceId,
      'mobileData.deviceModel': deviceModel,
      'mobileData.osVersion': osVersion,
      'mobileData.appVersion': appVersion,
      'mobileData.platform': platform,
      'mobileData.sessionToken': sessionToken,
      'mobileData.sessionCreatedAt': new Date(),
      'mobileData.lastLoginAt': new Date(),
      'mobileData.lastActiveLocation': user.mobileData?.lastActiveLocation,
      'mobileData.isSessionActive': true
    };

    await User.findByIdAndUpdate(user._id, { $set: updateData });
    
    // Generate token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: true,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update User Data
// @route   POST /api/auth/update-userdata
// @access  Private
exports.updateUserData = async (req, res) => {
  try {
    const { newName } = req.body;

    if (!newName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Name'
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id);

    // Update password
    user.name = newName;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Name updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Register as hostel manager
// @route   POST /api/auth/register-manager
// @access  Public
exports.registerManager = async (req, res) => {
  try {
    const { name, email, password, phone, hostelDetails } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user with hostel_manager role
    user = await User.create({
      name,
      email,
      password,
      role: 'hostel_manager',
      phone
    });

    // If hostel details are provided, create the hostel
    let hostel = null;
    if (hostelDetails) {
      const Hostel = require('../models/Hostel');
      hostel = await Hostel.create({
        name: hostelDetails.name,
        location: hostelDetails.location,
        description: hostelDetails.description || '',
        contactEmail: email,
        contactPhone: phone,
        isActive:false,
        vendorId: user.vendorId,
        managerIds: [user._id],
        createdBy: user._id,
        updatedBy: user._id,
        coordinatePoint: {
        type: 'Point',
        coordinates: [17, 78]
      },
      });

      // Update user with hostel reference
      user.hostelIds = [hostel._id];
      await user.save();
    }

    // Generate token
    const token = user.getSignedJwtToken();
    // Send welcome email asynchronously
    try {
      const jobId = jobProcessor.addJob('send_welcome_email', {
        email: user.email,
        name: user.name
      }, 'normal');
      console.log('Welcome email job queued for manager:', jobId);
    } catch (emailError) {
      console.error('Failed to queue welcome email for manager:', emailError);
      // Don't fail registration if email queuing fails
    }

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      hostel: hostel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email'
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${process.env.WEB_URL}/student/reset-password/${resetToken}`;

    // In production, you would send an actual email here
    // For now, we'll just log the reset URL and return success
     const jobId = jobProcessor.addJob('send_password_reset_email', {
      email: user.email,
      resetToken: resetToken,
      resetUrl: resetUrl
    }, 'high');

    console.log('Password reset email job queued:', jobId);
    
    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
      jobId: jobId
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    
    // Clear reset fields if there was an error
    if (req.user) {
      req.user.resetPasswordToken = undefined;
      req.user.resetPasswordExpire = undefined;
      await req.user.save({ validateBeforeSave: false });
    }

    res.status(500).json({
      success: false,
      message: 'Email could not be sent',
      error: error.message
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide token and new password'
      });
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Validate reset token
// @route   GET /api/auth/validate-reset-token/:token
// @access  Public
exports.validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('Validate token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
