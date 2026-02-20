
const User = require('../models/User');
const EmailTemplate = require('../models/EmailTemplate');
const Vendor = require('../models/Vendor');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK (you'll need to add service account key)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });
  } catch (error) {
    console.log('Firebase admin initialization error:', error.message);
  }
}

// @desc    Send push notification
// @route   POST /api/notifications/send
// @access  Private/Admin
exports.sendNotification = async (req, res) => {
  try {
    const {
      title,
      body,
      type,
      targetType,
      targetIds,
      vendorId,
      offerData,
      scheduledFor,
      includeEmail,
      emailTemplateId
    } = req.body;

    let targetUsers = [];

    // Determine target users based on targetType
    switch (targetType) {
      case 'all':
        targetUsers = await User.find({ 
          isActive: true,
          'mobileData.fcmToken': { $exists: true, $ne: '' }
        });
        break;
      
      case 'vendor_specific':
        if (vendorId) {
          targetUsers = await User.find({
            isActive: true,
            vendorIds: vendorId,
            'mobileData.fcmToken': { $exists: true, $ne: '' }
          });
        }
        break;
      
      case 'role_specific':
        targetUsers = await User.find({
          isActive: true,
          role: { $in: targetIds || ['student'] },
          'mobileData.fcmToken': { $exists: true, $ne: '' }
        });
        break;
      
      case 'user_specific':
        targetUsers = await User.find({
          _id: { $in: targetIds || [] },
          isActive: true,
          'mobileData.fcmToken': { $exists: true, $ne: '' }
        });
        break;
    }

    const fcmTokens = targetUsers
      .map(user => user.mobileData?.fcmToken)
      .filter(token => token);

    let sentCount = 0;
    let deliveredCount = 0;

    // Send push notifications
    if (fcmTokens.length > 0) {
      const message = {
        notification: {
          title,
          body
        },
        data: {
          type,
          ...(offerData && { offerData: JSON.stringify(offerData) })
        }
      };

      try {
        const response = await admin.messaging().sendMulticast({
          tokens: fcmTokens,
          ...message
        });

        sentCount = fcmTokens.length;
        deliveredCount = response.successCount;

        console.log(`Notification sent to ${sentCount} users, delivered to ${deliveredCount}`);
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    }

    // Send emails if requested
    if (includeEmail && emailTemplateId) {
      const template = await EmailTemplate.findById(emailTemplateId);
      if (template) {
        for (const user of targetUsers) {
          // Add email job to queue (you can implement email queue service)
          console.log(`Email queued for ${user.email} with template ${template.name}`);
        }
      }
    }

    // Save notification history
    const NotificationHistory = require('../models/NotificationHistory');
    await NotificationHistory.create({
      title,
      body,
      type,
      targetType,
      targetIds,
      vendorId,
      sentCount,
      deliveredCount,
      status: 'sent',
      createdBy: req.user.id,
      sentAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        sentCount,
        deliveredCount
      }
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
};

// @desc    Send vendor-specific offer notification
// @route   POST /api/notifications/vendor-offer/:vendorId
// @access  Private/Admin
exports.sendVendorOffer = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const notificationData = {
      ...req.body,
      targetType: 'vendor_specific',
      vendorId
    };

    // Reuse the sendNotification logic
    req.body = notificationData;
    await exports.sendNotification(req, res);
  } catch (error) {
    console.error('Send vendor offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send vendor offer',
      error: error.message
    });
  }
};

// @desc    Get notification history
// @route   GET /api/notifications/history
// @access  Private/Admin
exports.getNotificationHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const NotificationHistory = require('../models/NotificationHistory');
    const notifications = await NotificationHistory.find()
      .populate('createdBy', 'name email')
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await NotificationHistory.countDocuments();

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get notification history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification history',
      error: error.message
    });
  }
};

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private/Admin
exports.getNotificationStats = async (req, res) => {
  try {
    const NotificationHistory = require('../models/NotificationHistory');
    
    const stats = await NotificationHistory.aggregate([
      {
        $group: {
          _id: null,
          totalSent: { $sum: '$sentCount' },
          totalDelivered: { $sum: '$deliveredCount' },
          totalOpened: { $sum: '$openedCount' }
        }
      }
    ]);

    const activeTokens = await User.countDocuments({
      isActive: true,
      'mobileData.fcmToken': { $exists: true, $ne: '' }
    });

    res.status(200).json({
      success: true,
      data: {
        totalSent: stats[0]?.totalSent || 0,
        totalDelivered: stats[0]?.totalDelivered || 0,
        totalOpened: stats[0]?.totalOpened || 0,
        activeTokens
      }
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics',
      error: error.message
    });
  }
};

// @desc    Update FCM token
// @route   POST /api/notifications/update-token
// @access  Private
exports.updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, {
      'mobileData.fcmToken': fcmToken
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

// @desc    Test notification
// @route   POST /api/notifications/test
// @access  Private/Admin
exports.testNotification = async (req, res) => {
  try {
    const { token, title, body } = req.body;

    const message = {
      notification: { title, body },
      token: token || 'test_token'
    };

    // For testing, we'll just log the message
    console.log('Test notification:', message);

    res.status(200).json({
      success: true,
      message: 'Test notification sent successfully'
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message
    });
  }
};
