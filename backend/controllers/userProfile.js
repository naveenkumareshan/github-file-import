const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        bio: user.bio || '',
        profilePicture: user.profilePicture || '',
        gender: user.gender || '',
        role: user.role,
        isActive: user.isActive,
        userId: user.userId || '',
        createdAt: user.createdAt,
        courseStudying: user.courseStudying,
        collegeStudied: user.collegeStudied,
        parentMobileNumber: user.parentMobileNumber,
        profileEditCount: user.profileEditCount,
        remainingEdits: 2 - user.profileEditCount,
        remainingPhotoEdits: 2 - user.PhotoEditsCount,
        PhotoEditsCount: user.PhotoEditsCount,
        dateOfBirth : user.dateOfBirth,
        city : user.city,
        state : user.state,
        pincode : user.pincode,
        alternatePhone : user.alternatePhone,
        coursePreparingFor : user.coursePreparingFor,
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address, bio, courseStudying, dateOfBirth, coursePreparingFor, collegeStudied, parentMobileNumber, city, state, pincode, alternatePhone } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check edit count restriction
    if (user.profileEditCount >= 2) {
      return res.status(400).json({
        success: false,
        message: 'Profile edit limit reached. You can only edit your profile 2 times.'
      });
    }

    // Track changes for edit history
    const changedFields = [];

    if (name && name !== user.name) {
      changedFields.push({
        fieldName: 'name',
        oldValue: user.name,
        newValue: name
      });
      user.name = name;
    }

    if (phone && phone !== user.phone) {
      changedFields.push({
        fieldName: 'phone',
        oldValue: user.phone || '',
        newValue: phone
      });
      user.phone = phone;
    }

    if (address && address !== user.address) {
      changedFields.push({
        fieldName: 'address',
        oldValue: user.address || '',
        newValue: address
      });
      user.address = address;
    }

    if (bio && bio !== user.bio) {
      changedFields.push({
        fieldName: 'bio',
        oldValue: user.bio || '',
        newValue: bio
      });
      user.bio = bio;
    }

    if (courseStudying && courseStudying !== user.courseStudying) {
      changedFields.push({
        fieldName: 'courseStudying',
        oldValue: user.courseStudying || '',
        newValue: courseStudying
      });
      user.courseStudying = courseStudying;
    }

    if (collegeStudied && collegeStudied !== user.collegeStudied) {
      changedFields.push({
        fieldName: 'collegeStudied',
        oldValue: user.collegeStudied || '',
        newValue: collegeStudied
      });
      user.collegeStudied = collegeStudied;
    }

    if (parentMobileNumber && parentMobileNumber !== user.parentMobileNumber) {
      changedFields.push({
        fieldName: 'parentMobileNumber',
        oldValue: user.parentMobileNumber || '',
        newValue: parentMobileNumber
      });
      user.parentMobileNumber = parentMobileNumber;
    }
    if (city && city !== user.city) {
      changedFields.push({
        fieldName: 'city',
        oldValue: user.city || '',
        newValue: city
      });
      user.city = city;
    }
    if (state && state !== user.state) {
      changedFields.push({
        fieldName: 'state',
        oldValue: user.state || '',
        newValue: state
      });
      user.state = state;
    }
    if (pincode && pincode !== user.pincode) {
      changedFields.push({
        fieldName: 'pincode',
        oldValue: user.pincode || '',
        newValue: pincode
      });
      user.pincode = pincode;
    }
    if (alternatePhone && alternatePhone !== user.alternatePhone) {
      changedFields.push({
        fieldName: 'alternatePhone',
        oldValue: user.alternatePhone || '',
        newValue: alternatePhone
      });
      user.alternatePhone = alternatePhone;
    }
    if (dateOfBirth && dateOfBirth !== user.dateOfBirth) {
      changedFields.push({
        fieldName: 'dateOfBirth',
        oldValue: user.dateOfBirth || '',
        newValue: dateOfBirth
      });
      user.dateOfBirth = dateOfBirth;
    }
    if (coursePreparingFor && coursePreparingFor !== user.coursePreparingFor) {
      changedFields.push({
        fieldName: 'coursePreparingFor',
        oldValue: user.coursePreparingFor || '',
        newValue: coursePreparingFor
      });
      user.coursePreparingFor = coursePreparingFor;
    }

    // Only increment edit count and add to history if there were actual changes
    if (changedFields.length > 0) {
      user.profileEditCount += 1;
      user.profileEditHistory.push({
        editedAt: new Date(),
        changedFields
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        bio: user.bio,
        courseStudying: user.courseStudying,
        collegeStudied: user.collegeStudied,
        parentMobileNumber: user.parentMobileNumber,
        profilePicture: user.profilePicture,
        profileEditCount: user.profileEditCount,
        remainingEdits: 2 - user.profileEditCount
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Upload profile picture
// @route   POST /api/users/profile/picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
  try {

    // Update user profile picture
    const user = await User.findById(req.user.id);
    user.PhotoEditsCount += 1;
    user.profilePicture = req.body.profilePicture;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        url: req.body.profilePicture
      }
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Remove profile picture
// @route   DELETE /api/users/profile/picture
// @access  Private
exports.removeProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove file if exists
    if (user.profilePicture) {
      const filePath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    user.profilePicture = '';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture removed successfully'
    });
  } catch (error) {
    console.error('Remove profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update password
// @route   PUT /api/users/password
// @access  Private
exports.updatePassword = async (req, res) => {
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
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user preferences
// @route   GET /api/users/preferences
// @access  Private
exports.getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        preferences: user.preferences || {}
      }
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
exports.updatePreferences = async (req, res) => {
  try {
    const { preferences } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.preferences = preferences || {};
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};