
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const jobProcessor = require('../services/jobProcessor');

// @desc    Mobile Registration
// @route   POST /api/mobile-auth/register
// @access  Public
exports.mobileRegister = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      phone, 
      gender,
      deviceType,
      deviceId,
      deviceModel,
      osVersion,
      appVersion,
      fcmToken,
      location,
      referralCode
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone || !deviceType || !deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, phone, device type and device ID are required'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check if phone number already exists
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this phone number'
      });
    }

    // Create session token for device tracking
    const sessionToken = jwt.sign(
      { deviceId, deviceType, timestamp: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: '90d' }
    );

    // Create mobile-specific user data
    const mobileUserData = {
      name,
      email,
      password,
      phone,
      gender: gender || '',
      role: 'student',
      mobileData: {
        deviceType: deviceType, // 'ios' or 'android'
        deviceId: deviceId,
        deviceModel: deviceModel || '',
        osVersion: osVersion || '',
        appVersion: appVersion || '',
        fcmToken: fcmToken || '',
        sessionToken: sessionToken,
        sessionCreatedAt: new Date(),
        registrationLocation: location || null,
        lastActiveLocation: location || null,
        registeredAt: new Date(),
        lastLoginAt: new Date(),
        isEmailVerified: false,
        isPhoneVerified: false,
        isSessionActive: true
      }
    };

    // Handle referral code if provided
    if (referralCode) {
      mobileUserData.referralCode = referralCode;
    }

    // Create user
    user = await User.create(mobileUserData);

    // Generate auth token
    const token = user.getSignedJwtToken();

    // Send welcome email asynchronously
    try {
      const jobId = jobProcessor.addJob('send_welcome_email', {
        email: user.email,
        name: user.name,
        deviceType: deviceType
      }, 'normal');
      console.log('Mobile welcome email job queued:', jobId);
    } catch (emailError) {
      console.error('Failed to queue welcome email:', emailError);
    }

    // Response with mobile-specific data
    res.status(201).json({
      success: true,
      token,
      sessionToken,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        role: user.role,
        isEmailVerified: user.mobileData?.isEmailVerified || false,
        isPhoneVerified: user.mobileData?.isPhoneVerified || false,
        profilePicture: user.profilePicture || null,
        deviceInfo: {
          deviceType: user.mobileData.deviceType,
          deviceId: user.mobileData.deviceId,
          deviceModel: user.mobileData.deviceModel,
          osVersion: user.mobileData.osVersion,
          appVersion: user.mobileData.appVersion
        }
      },
      deviceRegistered: true,
      message: 'Registration successful. Welcome to Inhale Stays!'
    });
  } catch (error) {
    console.error('Mobile registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: error.message
    });
  }
};

// @desc    Mobile Login
// @route   POST /api/mobile-auth/login
// @access  Public
exports.mobileLogin = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      deviceType, 
      deviceId, 
      fcmToken, 
      location,
      appVersion,
      deviceModel,
      osVersion,
      platform
    } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Validate device information for session tracking
    if (!deviceType || !deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device type and device ID are required for session tracking'
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

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if session is active for existing device
    const existingDeviceId = user.mobileData?.deviceId;
    const existingSessionToken = user.mobileData?.sessionToken;
    const isSessionActive = user.mobileData?.isSessionActive;

    // If device ID changed or session is not active, require re-authentication
    // if (existingDeviceId && existingDeviceId !== deviceId) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Device change detected. Please contact support.',
    //     requireDeviceVerification: true
    //   });
    // }

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
      'mobileData.deviceModel': deviceModel || user.mobileData?.deviceModel || '',
      'mobileData.osVersion': osVersion || user.mobileData?.osVersion || '',
      'mobileData.appVersion': appVersion || user.mobileData?.appVersion || '',
      'mobileData.fcmToken': fcmToken || user.mobileData?.fcmToken || '',
      'mobileData.platform': platform || user.mobileData?.platform || '',      
      'mobileData.sessionToken': sessionToken,
      'mobileData.sessionCreatedAt': new Date(),
      'mobileData.lastLoginAt': new Date(),
      'mobileData.lastActiveLocation': location || user.mobileData?.lastActiveLocation,
      'mobileData.isSessionActive': true
    };

    await User.findByIdAndUpdate(user._id, { $set: updateData });

    // Generate auth token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      sessionToken,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        role: user.role,
        isEmailVerified: user.mobileData?.isEmailVerified || false,
        isPhoneVerified: user.mobileData?.isPhoneVerified || false,
        profilePicture: user.profilePicture || null,
        deviceInfo: {
          deviceType: deviceType,
          deviceId: deviceId,
          deviceModel: deviceModel || '',
          osVersion: osVersion || '',
          appVersion: appVersion || ''
        }
      },
      sessionInfo: {
        sessionActive: true,
        lastLoginAt: new Date(),
        deviceVerified: true
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Mobile login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: error.message
    });
  }
};

// @desc    Verify Mobile Session
// @route   POST /api/mobile-auth/verify-session
// @access  Private
exports.verifySession = async (req, res) => {
  try {
    const { sessionToken, deviceId } = req.body;

    if (!sessionToken || !deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Session token and device ID are required'
      });
    }

    // Verify session token
    const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);

    if (decoded.deviceId !== deviceId) {
      return res.status(403).json({
        success: false,
        message: 'Device mismatch detected',
        requireReLogin: true
      });
    }

    // Find user and check session status
    const user = await User.findById(req.user.id);

    if (!user || !user.mobileData?.isSessionActive || user.mobileData.sessionToken !== sessionToken) {
      return res.status(403).json({
        success: false,
        message: 'Session expired or invalid',
        requireReLogin: true
      });
    }

    res.status(200).json({
      success: true,
      sessionValid: true,
      message: 'Session is active'
    });
  } catch (error) {
    console.error('Session verification error:', error);
    res.status(403).json({
      success: false,
      message: 'Invalid session',
      requireReLogin: true
    });
  }
};

// @desc    Verify Mobile Token and Get User Profile
// @route   GET /api/mobile-auth/me
// @access  Private
exports.getMobileProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if session is still active
    if (!user.mobileData?.isSessionActive) {
      return res.status(403).json({
        success: false,
        message: 'Session expired. Please login again.',
        requireReLogin: true
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        role: user.role,
        address: user.address || '',
        bio: user.bio || '',
        courseStudying: user.courseStudying || '',
        collegeStudied: user.collegeStudied || '',
        parentMobileNumber: user.parentMobileNumber || '',
        profilePicture: user.profilePicture || null,
        isEmailVerified: user.mobileData?.isEmailVerified || false,
        isPhoneVerified: user.mobileData?.isPhoneVerified || false,
        deviceInfo: {
          deviceType: user.mobileData?.deviceType || null,
          deviceId: user.mobileData?.deviceId || null,
          deviceModel: user.mobileData?.deviceModel || null,
          osVersion: user.mobileData?.osVersion || null,
          appVersion: user.mobileData?.appVersion || null
        },
        sessionInfo: {
          isActive: user.mobileData?.isSessionActive || false,
          lastLoginAt: user.mobileData?.lastLoginAt || null,
          sessionCreatedAt: user.mobileData?.sessionCreatedAt || null
        },
        registeredAt: user.mobileData?.registeredAt || user.createdAt,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get mobile profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

// @desc    Update FCM Token
// @route   POST /api/mobile-auth/update-fcm-token
// @access  Private
exports.updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    // Check if session is active
    const user = await User.findById(req.user.id);
    if (!user.mobileData?.isSessionActive) {
      return res.status(403).json({
        success: false,
        message: 'Session expired. Please login again.',
        requireReLogin: true
      });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $set: { 'mobileData.fcmToken': fcmToken }
    });

    res.status(200).json({
      success: true,
      message: 'FCM token updated successfully'
    });
  } catch (error) {
    console.error('Update FCM token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update FCM token',
      error: error.message
    });
  }
};

// @desc    Logout Mobile Session
// @route   POST /api/mobile-auth/logout
// @access  Private
exports.mobileLogout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $set: { 
        'mobileData.isSessionActive': false,
        'mobileData.fcmToken': '',
        'mobileData.sessionToken': ''
      }
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Mobile logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout',
      error: error.message
    });
  }
};
