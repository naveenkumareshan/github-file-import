
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const crypto = require('crypto');
const jobProcessor = require('../services/jobProcessor');

// @desc    Register vendor
// @route   POST /api/vendor-registration/register
// @access  Public
const registerVendor = async (req, res) => {
  try {
    const { 
      contactPerson, 
      email, 
      phone, 
      password, 
      businessName, 
      businessType,
      businessDetails,
      address,
      bankDetails 
    } = req.body;

    console.log('Vendor registration request:', { email, businessName, contactPerson });

    // Check if user already exists
    let existingUser = await User.findOne({ 
      $or: [
        { email },
        { phone }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or phone number'
      });
    }

    // Create user account for vendor
    const user = new User({
      name: contactPerson,
      email,
      password,
      role: 'vendor',
      phone
    });

    await user.save();
    console.log('Vendor user created:', user._id);

    // Create vendor record
    const vendor = new Vendor({
      managerId: user._id,
      contactPerson,
      businessName,
      businessType: businessType || 'individual',
      email,
      phone,
      address: address || {},
      businessDetails: businessDetails || {},
      bankDetails: bankDetails || {},
      status: 'pending',
      isActive: true
    });

    await vendor.save();
    console.log('Vendor record created:', vendor._id);

    // Update user with vendor reference
    user.vendorId = vendor._id;
    await user.save();

    // Generate token
    const token = user.getSignedJwtToken();

    // Send welcome email asynchronously
    try {
      const jobId = jobProcessor.addJob('send_welcome_email', {
        email: user.email,
        name: user.name
      }, 'normal');
      console.log('Welcome email job queued for vendor:', jobId);
    } catch (emailError) {
      console.error('Failed to queue welcome email for vendor:', emailError);
      // Don't fail registration if email queuing fails
    }

    res.status(201).json({
      success: true,
      message: 'Vendor registration submitted successfully. Your application is under review.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        vendorId: vendor._id
      },
      vendor: {
        id: vendor._id,
        businessName: vendor.businessName,
        status: vendor.status
      }
    });
  } catch (error) {
    console.error('Vendor registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// @desc    Get vendor registration status
// @route   GET /api/vendor-registration/status/:vendorId
// @access  Public
const getVendorStatus = async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const vendor = await Vendor.findById(vendorId).populate('managerId', 'name email');
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: vendor._id,
        businessName: vendor.businessName,
        status: vendor.status,
        contactPerson: vendor.contactPerson,
        email: vendor.email,
        createdAt: vendor.createdAt
      }
    });
  } catch (error) {
    console.error('Get vendor status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  registerVendor,
  getVendorStatus
};
