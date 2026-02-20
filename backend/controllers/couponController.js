const Coupon = require('../models/Coupon');
const User = require('../models/User');

// @desc    Get all coupons (admin/vendor)
// @route   GET /api/coupons/admin
// @access  Private/Admin/Vendor
exports.getCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type, applicableFor, isActive, scope } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by vendor for non-admin users
    if (req.user.role === 'vendor' || req.user.role === 'vendor_employee') {
      const vendorId = req.user.vendorId || req.user.vendorIds?.[0];
      query.$or = [
        { vendorId: vendorId },
        { scope: 'global' }
      ];
    }
    
    if (type && type !== 'all') {
      query.type = type;
    }
    if (scope && scope !== 'all') {
      query.scope = scope;
    }
    if (applicableFor) query.applicableFor = { $in: [applicableFor] };
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const coupons = await Coupon.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('vendorId', 'businessName vendorId')
      .populate('generatedBy', 'name email')
      .populate('specificUsers', 'name email phone')
      .populate('excludeUsers', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Coupon.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: coupons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Create coupon
// @route   POST /api/coupons/admin
// @access  Private/Admin/Vendor
exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      type,
      value,
      maxDiscountAmount,
      minOrderAmount,
      applicableFor,
      usageLimit,
      userUsageLimit,
      startDate,
      endDate,
      firstTimeUserOnly,
      specificUsers,
      excludeUsers,
      scope,
      vendorId
    } = req.body;

    // Validate required fields
    if (!code || !name || !type || value === undefined || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
    }

    // Validate user assignments
    if (specificUsers && specificUsers.length > 0) {
      const validUsers = await User.find({ _id: { $in: specificUsers } });
      if (validUsers.length !== specificUsers.length) {
        return res.status(400).json({
          success: false,
          message: 'Some selected users are invalid'
        });
      }
    }

    if (excludeUsers && excludeUsers.length > 0) {
      const validUsers = await User.find({ _id: { $in: excludeUsers } });
      if (validUsers.length !== excludeUsers.length) {
        return res.status(400).json({
          success: false,
          message: 'Some excluded users are invalid'
        });
      }
    }

    // Set vendor-specific data
    let couponData = {
      code: code.toUpperCase(),
      name,
      description,
      type,
      value,
      maxDiscountAmount,
      minOrderAmount: minOrderAmount || 0,
      applicableFor: applicableFor || ['cabin'],
      usageLimit,
      userUsageLimit: userUsageLimit || 1,
      startDate,
      endDate,
      firstTimeUserOnly: firstTimeUserOnly || false,
      specificUsers: specificUsers || [],
      excludeUsers: excludeUsers || [],
      createdBy: req.user.id,
      scope: scope || 'global'
    };

    // Handle vendor-specific coupons
    if (req.user.role === 'vendor' || req.user.role === 'vendor_employee') {
      couponData.scope = 'vendor';
      couponData.vendorId = req.user.vendorId || req.user.vendorIds?.[0];
    } else if (req.user.role === 'admin' && scope === 'vendor' && vendorId) {
      couponData.vendorId = vendorId;
    }

    const coupon = await Coupon.create(couponData);

    res.status(201).json({
      success: true,
      data: coupon,
      message: 'Coupon created successfully'
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Generate referral coupon for user
// @route   POST /api/coupons/generate-referral
// @access  Private
exports.generateReferralCoupon = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'user_generated' } = req.body;

    // Check if user already has an active referral coupon
    const existingCoupon = await Coupon.findOne({
      generatedBy: userId,
      isReferralCoupon: true,
      isActive: true,
      endDate: { $gte: new Date() }
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active referral coupon'
      });
    }

    // Generate unique referral code
    const user = await User.findById(userId);
    const userName = user.name.replace(/\s+/g, '').toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const referralCode = `${userName}${randomSuffix}`;

    // Create referral coupon
    const referralCoupon = await Coupon.create({
      code: referralCode,
      name: `${user.name}'s Referral Discount`,
      description: 'Special discount for referred friends',
      type: 'percentage',
      value: 10, // 10% discount
      maxDiscountAmount: 500,
      minOrderAmount: 1000,
      applicableFor: ['cabin'],
      scope: 'user_referral',
      isReferralCoupon: true,
      referralType: type,
      generatedBy: userId,
      usageLimit: 10, // Can be used 10 times
      userUsageLimit: 1,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      createdBy: userId
    });

    res.status(201).json({
      success: true,
      data: referralCoupon,
      message: 'Referral coupon generated successfully'
    });
  } catch (error) {
    console.error('Generate referral coupon error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get single coupon
// @route   GET /api/coupons/admin/:id
// @access  Private/Admin
exports.getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('specificUsers', 'name email')
      .populate('excludeUsers', 'name email')
      .populate('usedBy.userId', 'name email');
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: coupon
    });
  } catch (error) {
    console.error('Get coupon error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update coupon
// @route   PUT /api/coupons/admin/:id
// @access  Private/Admin
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    const {
      name,
      description,
      type,
      value,
      maxDiscountAmount,
      minOrderAmount,
      applicableFor,
      usageLimit,
      userUsageLimit,
      startDate,
      endDate,
      isActive,
      firstTimeUserOnly,
      specificUsers,
      excludeUsers,
      scope,
      vendorId
    } = req.body;

    // Validate dates if provided
    const newStartDate = startDate || coupon.startDate;
    const newEndDate = endDate || coupon.endDate;
    
    if (new Date(newStartDate) >= new Date(newEndDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Validate user assignments if provided
    if (specificUsers && specificUsers.length > 0) {
      const validUsers = await User.find({ _id: { $in: specificUsers } });
      if (validUsers.length !== specificUsers.length) {
        return res.status(400).json({
          success: false,
          message: 'Some selected users are invalid'
        });
      }
    }

    if (excludeUsers && excludeUsers.length > 0) {
      const validUsers = await User.find({ _id: { $in: excludeUsers } });
      if (validUsers.length !== excludeUsers.length) {
        return res.status(400).json({
          success: false,
          message: 'Some excluded users are invalid'
        });
      }
    }

    const updateData = {
      name: name || coupon.name,
      description,
      type: type || coupon.type,
      value: value !== undefined ? value : coupon.value,
      maxDiscountAmount,
      minOrderAmount: minOrderAmount !== undefined ? minOrderAmount : coupon.minOrderAmount,
      applicableFor: applicableFor || coupon.applicableFor,
      usageLimit,
      userUsageLimit: userUsageLimit !== undefined ? userUsageLimit : coupon.userUsageLimit,
      startDate: newStartDate,
      endDate: newEndDate,
      isActive: isActive !== undefined ? isActive : coupon.isActive,
      firstTimeUserOnly: firstTimeUserOnly !== undefined ? firstTimeUserOnly : coupon.firstTimeUserOnly,
      specificUsers: specificUsers !== undefined ? specificUsers : coupon.specificUsers,
      excludeUsers: excludeUsers !== undefined ? excludeUsers : coupon.excludeUsers,
      updatedBy: req.user.id,
      scope: scope || coupon.scope
    };

    // Handle vendor ID for admin updates
    if (req.user.role === 'admin' && scope === 'vendor' && vendorId) {
      updateData.vendorId = vendorId;
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedCoupon,
      message: 'Coupon updated successfully'
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Delete coupon
// @route   DELETE /api/coupons/admin/:id
// @access  Private/Admin
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    await Coupon.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Validate coupon for booking with enhanced user eligibility
// @route   POST /api/coupons/validate
// @access  Private
exports.validateCoupon = async (req, res) => {
  try {
    const { code, bookingType, amount, cabinId } = req.body;
    const userId = req.user.id;

    if (!code || !bookingType || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide coupon code, booking type, and amount'
      });
    }

    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      isActive: true 
    }).populate('vendorId')
      .populate('specificUsers', 'name email')
      .populate('excludeUsers', 'name email');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    // Check if coupon is expired
    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Coupon has expired or not yet active'
      });
    }

    // Check vendor scope for vendor-specific coupons
    if (coupon.scope === 'vendor' && cabinId) {
      const Cabin = require('../models/Cabin');
      const cabin = await Cabin.findById(cabinId);
      if (cabin && cabin.vendorId.toString() !== coupon.vendorId._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'This coupon is not valid for this property'
        });
      }
    }

    // Check if applicable for booking type
    if (!coupon.applicableFor.includes('all') && !coupon.applicableFor.includes(bookingType)) {
      return res.status(400).json({
        success: false,
        message: `Coupon not applicable for ${bookingType} bookings`
      });
    }

    // Check minimum order amount
    if (amount < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ₹${coupon.minOrderAmount}`
      });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Coupon usage limit exceeded'
      });
    }

    const user = await User.findById(userId);
    
    // Enhanced user eligibility checks
    
    // Check if user is excluded
    if (coupon.excludeUsers.some(excludedUser => excludedUser._id.toString() === userId)) {
      return res.status(400).json({
        success: false,
        message: 'This coupon is not available for your account'
      });
    }

    // Check if coupon is restricted to specific users
    if (coupon.specificUsers.length > 0) {
      const isSpecificUser = coupon.specificUsers.some(specificUser => specificUser._id.toString() === userId);
      if (!isSpecificUser) {
        return res.status(400).json({
          success: false,
          message: 'This coupon is only available to selected users'
        });
      }
    }
    
    // Check first time user only
    if (coupon.firstTimeUserOnly && user) {
      const Booking = require('../models/Booking');
      const HostelBooking = require('../models/HostelBooking');
      
      const [cabinBookings, hostelBookings] = await Promise.all([
        Booking.countDocuments({ userId: user._id }),
        HostelBooking.countDocuments({ userId: user._id })
      ]);
      
      if (cabinBookings > 0 || hostelBookings > 0) {
        return res.status(400).json({
          success: false,
          message: 'This coupon is only for first-time users'
        });
      }
    }

    // Check user usage limit
    const userUsage = coupon.usedBy.find(usage => usage.userId.toString() === user._id.toString());
    if (userUsage && userUsage.usageCount >= coupon.userUsageLimit) {
      return res.status(400).json({
        success: false,
        message: `You have already used this coupon ${coupon.userUsageLimit} time(s)`
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (amount * coupon.value) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = coupon.value;
    }

    const finalAmount = Math.max(0, amount - discountAmount);

    res.status(200).json({
      success: true,
      data: {
        coupon: {
          _id: coupon._id,
          code: coupon.code,
          name: coupon.name,
          type: coupon.type,
          value: coupon.value,
          scope: coupon.scope,
          isReferralCoupon: coupon.isReferralCoupon,
          userEligibility: {
            isSpecificUser: coupon.specificUsers.length > 0,
            remainingUses: coupon.userUsageLimit - (userUsage?.usageCount || 0),
            isFirstTimeOnly: coupon.firstTimeUserOnly
          }
        },
        originalAmount: amount,
        discountAmount,
        finalAmount,
        savings: discountAmount
      },
      message: 'Coupon is valid and you are eligible to use it'
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Apply coupon to booking
// @route   POST /api/coupons/apply
// @access  Private
exports.applyCoupon = async (req, res) => {
  try {
    const { code, bookingId, bookingType, amount } = req.body;
    const userId = req.user.id;

    // First validate the coupon
    const validationResult = await this.validateCoupon({
      body: { code, bookingType, amount, userId },
      user: req.user
    }, {
      status: (statusCode) => ({
        json: (data) => {
          if (statusCode !== 200) {
            throw new Error(data.message);
          }
          return data;
        }
      })
    });

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    
    // Update coupon usage
    const userUsageIndex = coupon.usedBy.findIndex(
      usage => usage.userId.toString() === userId
    );

    if (userUsageIndex >= 0) {
      coupon.usedBy[userUsageIndex].usageCount += 1;
      coupon.usedBy[userUsageIndex].usedAt = new Date();
    } else {
      coupon.usedBy.push({
        userId,
        usageCount: 1,
        usedAt: new Date()
      });
    }

    coupon.usageCount += 1;
    await coupon.save();

    res.status(200).json({
      success: true,
      data: validationResult.data,
      message: 'Coupon applied successfully'
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get active coupons for user with eligibility check
// @route   GET /api/coupons/available
// @access  Private
exports.getAvailableCoupons = async (req, res) => {
  try {
    const { bookingType } = req.query;
    const userId = req.user.id;
    const now = new Date();

    const query = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    };

    if (bookingType) {
      query.$or = [
        { applicableFor: { $in: ['all'] } },
        { applicableFor: { $in: [bookingType] } }
      ];
    }

    const coupons = await Coupon.find(query)
      .populate('specificUsers', 'name email')
      .populate('excludeUsers', 'name email')
      .select('code name description type value maxDiscountAmount minOrderAmount applicableFor usageLimit usageCount userUsageLimit firstTimeUserOnly specificUsers excludeUsers')
      .sort({ createdAt: -1 });

    // Filter coupons based on user eligibility
    const eligibleCoupons = [];
    
    for (const coupon of coupons) {
      // Check if user is excluded
      if (coupon.excludeUsers.some(excludedUser => excludedUser._id.toString() === userId)) {
        continue;
      }

      // Check if coupon is restricted to specific users
      if (coupon.specificUsers.length > 0) {
        const isSpecificUser = coupon.specificUsers.some(specificUser => specificUser._id.toString() === userId);
        if (!isSpecificUser) {
          continue;
        }
      }

      // Check usage limit
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        continue;
      }

      // Check user usage limit
      const userUsage = coupon.usedBy?.find(usage => usage.userId.toString() === userId);
      if (userUsage && userUsage.usageCount >= coupon.userUsageLimit) {
        continue;
      }

      // Add eligibility info to coupon
      const couponWithEligibility = {
        ...coupon.toObject(),
        userEligibility: {
          isSpecificUser: coupon.specificUsers.length > 0,
          remainingUses: coupon.userUsageLimit - (userUsage?.usageCount || 0),
          isFirstTimeOnly: coupon.firstTimeUserOnly
        }
      };

      eligibleCoupons.push(couponWithEligibility);
    }

    res.status(200).json({
      success: true,
      data: eligibleCoupons,
      count: eligibleCoupons.length,
      message: `Found ${eligibleCoupons.length} eligible coupons for you`
    });
  } catch (error) {
    console.error('Get available coupons error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
