
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @desc    Get all active user sessions
// @route   GET /api/admin/user-sessions
// @access  Private/Admin
exports.getActiveSessions = async (req, res) => {
  try {
    const {
      deviceType,
      platform,
      role,
      isActive = true,
      page = 1,
      limit = 20,
      search
    } = req.query;

    // Build query
    let query = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
      // Also check for active mobile sessions
      query['mobileData.isSessionActive'] = true;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { 'name': { $regex: search, $options: 'i' } },
        { 'email': { $regex: search, $options: 'i' } },
        { 'userId': { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    // Device type filtering
    if (deviceType) {
      if (deviceType === 'mobile') {
        query['mobileData.deviceType'] = { $in: ['ios', 'android'] };
        query['mobileData.isSessionActive'] = true;
      } else if (deviceType === 'web') {
        query.$or = [
          { 'mobileData.deviceType': deviceType },
          { 'mobileData.isSessionActive': true }
        ];
      }
    }

    // Platform filtering
    // if (platform) {
    //   query['mobileData.platform'] = platform;
    //   query['mobileData.isSessionActive'] = true;
    // }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Get users with active sessions
    const users = await User.find(query)
      .select('userId name email phone role mobileData createdAt isActive')
      .sort({ 'mobileData.lastLoginAt': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Transform data to session format with enhanced session info
    const sessions = users.map(user => {
      const isMobileActive = user.mobileData?.isSessionActive && user.mobileData?.deviceType;
      const deviceType = user.mobileData?.deviceType;
      const platform = user.mobileData?.platform
      
      return {
        _id: user._id.toString() + '_session',
        userId: {
          _id: user._id,
          userId: user.userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        deviceType,
        platform,
        deviceInfo: user.mobileData ? {
          deviceId: user.mobileData.deviceId,
          deviceModel: user.mobileData.deviceModel,
          osVersion: user.mobileData.osVersion,
          appVersion: user.mobileData.appVersion,
          sessionActive: user.mobileData.isSessionActive || false,
          sessionCreatedAt: user.mobileData.sessionCreatedAt
        } : {},
        loginTime: user.mobileData?.lastLoginAt || user.createdAt,
        lastActiveTime: user.mobileData?.lastActiveTime || user.createdAt,
        location: user.mobileData?.lastActiveLocation,
        isActive: user.isActive && (isMobileActive || !user.mobileData?.deviceType),
        sessionToken: isMobileActive ? 'active' : 'inactive'
      };
    });

    res.status(200).json({
      success: true,
      data: sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user sessions',
      error: error.message
    });
  }
};

// @desc    Get session statistics
// @route   GET /api/admin/user-sessions/statistics
// @access  Private/Admin
exports.getSessionStatistics = async (req, res) => {
  try {
    // Get total active users with active sessions
    const totalActive = await User.countDocuments({ 
      isActive: true,
      role:'student',
      $or: [
        { 'mobileData.isSessionActive': true },
        { 'mobileData.deviceType': { $exists: false } }
      ]
    });
    
    // Get mobile users with active sessions
    const mobileUsers = await User.countDocuments({ 
      isActive: true,
      role:'student',
      'mobileData.deviceType': { $exists: true, $ne: '' },
      'mobileData.isSessionActive': true
    });
    
    // Get iOS users with active sessions
    const iosUsers = await User.countDocuments({ 
      isActive: true,
      'mobileData.deviceType': 'ios',
      'mobileData.isSessionActive': true
    });
    
    // Get Android users with active sessions
    const androidUsers = await User.countDocuments({ 
      isActive: true,
      role:'student',
      'mobileData.deviceType': 'android',
      'mobileData.isSessionActive': true
    });
    
    // Web users = users without mobile sessions or with inactive mobile sessions
    const webUsers = await User.countDocuments({
      isActive: true,
      role:'student',
      $or: [
        { 'mobileData.deviceType': { $exists: false } },
        { 'mobileData.deviceType': '' },
        { 'mobileData.isSessionActive': { $ne: true } }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        totalActive,
        webUsers,
        mobileUsers,
        iosUsers,
        androidUsers
      }
    });
  } catch (error) {
    console.error('Get session statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session statistics',
      error: error.message
    });
  }
};

// @desc    Force logout a user session
// @route   POST /api/admin/user-sessions/:sessionId/logout
// @access  Private/Admin
exports.forceLogout = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Extract user ID from session ID (since we're using userId_session format)
    const userId = sessionId.replace('_session', '');
    
    // Clear user session data
    await User.findByIdAndUpdate(userId, {
      $set: {
        'mobileData.isSessionActive': false,
        'mobileData.sessionToken': '',
        'mobileData.fcmToken': ''
      }
    });

    res.status(200).json({
      success: true,
      message: 'User session cleared successfully. User will need to re-login with device information.'
    });
  } catch (error) {
    console.error('Force logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout user',
      error: error.message
    });
  }
};

// @desc    Get user login history
// @route   GET /api/admin/user-sessions/history/:userId
// @access  Private/Admin
exports.getUserLoginHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId)
      .select('name email mobileData createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Enhanced login history with session information
    const history = [];
    
    if (user.mobileData?.lastLoginAt) {
      history.push({
        loginTime: user.mobileData.lastLoginAt,
        deviceType: user.mobileData.deviceType ? 'mobile' : 'web',
        platform: user.mobileData.deviceType || 'web',
        deviceInfo: {
          deviceId: user.mobileData.deviceId,
          deviceModel: user.mobileData.deviceModel,
          osVersion: user.mobileData.osVersion,
          appVersion: user.mobileData.appVersion
        },
        location: user.mobileData.lastActiveLocation,
        sessionActive: user.mobileData.isSessionActive || false,
        sessionCreatedAt: user.mobileData.sessionCreatedAt,
        logoutTime: user.mobileData.isSessionActive ? null : 'Session ended',
        duration: null
      });
    }

    // Add registration as first login
    history.push({
      loginTime: user.mobileData?.registeredAt || user.createdAt,
      deviceType: user.mobileData?.deviceType ? 'mobile' : 'web',
      platform: user.mobileData?.deviceType || 'web',
      location: user.mobileData?.registrationLocation,
      sessionActive: false,
      logoutTime: 'Registration',
      duration: null
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        },
        history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: history.length,
          pages: 1
        }
      }
    });
  } catch (error) {
    console.error('Get user login history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch login history',
      error: error.message
    });
  }
};
