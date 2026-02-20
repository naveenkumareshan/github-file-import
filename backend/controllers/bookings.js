
const Booking = require('../models/Booking');
const Cabin = require('../models/Cabin');
const Seat = require('../models/Seat');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');

const DepositRefund = require('../models/DepositRefund');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const { 
      cabinId, 
      seatId, 
      seatPrice, 
      startDate, 
      endDate, 
      totalPrice, 
      bookingDuration, 
      durationCount, 
      keyDeposit = 500,
      couponCode,
      discountAmount = 0
    } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!cabinId || !seatId || !startDate || !endDate || !totalPrice) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const CHECK_IN_HOUR = 9;   // 9 AM IST
    const CHECK_OUT_HOUR = 18; // 6 PM IST
    // Check if the seat is available
    const cabin = await Cabin.findById(cabinId);
    const user = await User.findById(userId);
    const bookings = await Booking.find({
      seatId: seatId,
      paymentStatus: { $in: ['completed', 'pending'] },
      status: { $ne: 'cancelled' },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    });

    if(bookings.length > 0){
      return res.status(400).json({
        success: false,
        message: 'The selected seat is not available for selected period'
      });
    }

    let totalPriceAmount = (totalPrice + discountAmount);
    let appliedCoupon = null;
    let finalTotalPrice = totalPriceAmount;
    let originalPrice = totalPriceAmount;

    // Handle coupon validation and application
    if (couponCode) {
      const coupon = await Coupon.findOne({ 
        code: couponCode.toUpperCase(),
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      });

      if (!coupon) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired coupon code'
        });
      }

      // Check if coupon is applicable for this booking type
      if (!coupon.applicableFor.includes('cabin') && !coupon.applicableFor.includes('all')) {
        return res.status(400).json({
          success: false,
          message: 'This coupon is not applicable for cabin bookings'
        });
      }

      // Check minimum order amount
      if (coupon.minOrderAmount && totalPriceAmount < coupon.minOrderAmount) {
        return res.status(400).json({
          success: false,
          message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`
        });
      }

      // Check usage limits
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return res.status(400).json({
          success: false,
          message: 'This coupon has reached its usage limit'
        });
      }

      // Check user-specific usage limits
      const userUsage = coupon.usedBy.find(usage => usage.userId.toString() === userId);
      if (userUsage && userUsage.usageCount >= coupon.userUsageLimit) {
        return res.status(400).json({
          success: false,
          message: 'You have already used this coupon the maximum number of times'
        });
      }

      // Check if user is eligible for this coupon
      if (coupon.specificUsers && coupon.specificUsers.length > 0) {
        if (!coupon.specificUsers.includes(userId)) {
          return res.status(400).json({
            success: false,
            message: 'You are not eligible for this coupon'
          });
        }
      }

      // Check if user is excluded
      if (coupon.excludeUsers && coupon.excludeUsers.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: 'You are not eligible for this coupon'
        });
      }

      // Check first-time user restriction
      if (coupon.firstTimeUserOnly) {
        const previousBookings = await Booking.countDocuments({
          userId: userId,
          paymentStatus: 'completed'
        });
        if (previousBookings > 0) {
          return res.status(400).json({
            success: false,
            message: 'This coupon is only for first-time users'
          });
        }
      }

      // Calculate discount
      let calculatedDiscount = 0;
      if (coupon.type === 'percentage') {
        calculatedDiscount = (totalPriceAmount * coupon.value) / 100;
        if (coupon.maxDiscountAmount && calculatedDiscount > coupon.maxDiscountAmount) {
          calculatedDiscount = coupon.maxDiscountAmount;
        }
      } else {
        calculatedDiscount = coupon.value;
      }

      // Ensure discount doesn't exceed total price
      calculatedDiscount = Math.min(calculatedDiscount, totalPriceAmount);
      finalTotalPrice = totalPriceAmount - calculatedDiscount;

      // Set applied coupon data
      appliedCoupon = {
        couponId: coupon._id,
        couponCode: coupon.code,
        discountAmount: calculatedDiscount,
        couponType: coupon.type,
        couponValue: coupon.value
      };
    }
    
    const bookingId = generateBookingId('CABIN');

    // Create booking with coupon data
    const booking = await Booking.create({
      userId,
      bookingId: bookingId,
      cabinId,
      seatPrice: seatPrice,
      seatId,
      startDate:moment.tz(startDate, 'Asia/Kolkata').utc().set({ hour: CHECK_IN_HOUR, minute: 0, second: 0, millisecond: 0 }).toDate(),
      endDate : moment.tz(endDate, 'Asia/Kolkata').utc().set({ hour: CHECK_OUT_HOUR, minute: 0, second: 0, millisecond: 0 }).toDate(),
      bookingDuration: bookingDuration || 'monthly',
      durationCount: durationCount || 1,
      originalPrice: originalPrice,
      totalPrice: finalTotalPrice,
      appliedCoupon: appliedCoupon,
      paymentStatus: 'pending',
      keyDeposit: keyDeposit,
      isKeyDepositPaid: true
    });

    // Update coupon usage if coupon was applied
    if (appliedCoupon && appliedCoupon.couponId) {
      const coupon = await Coupon.findById(appliedCoupon.couponId);
      
      // Update overall usage count
      coupon.usageCount = (coupon.usageCount || 0) + 1;
      
      // Update user-specific usage
      const existingUserUsage = coupon.usedBy.find(usage => 
        usage.userId.toString() === userId.toString() && 
        usage.bookingId && usage.bookingId.toString() === booking._id.toString()
      );
      
      if (existingUserUsage) {
        existingUserUsage.usageCount += 1;
        existingUserUsage.usedAt = new Date();
        existingUserUsage.bookingId = booking._id;
      } else {
        coupon.usedBy.push({
          userId: userId,
          usageCount: 1,
          usedAt: new Date(),
          bookingId: booking._id
        });
      }
      
      await coupon.save();
    }

    // Create deposit refund record for new booking
    await DepositRefund.create({
      bookingId: booking._id,
      userId: userId,
      cabinId: cabinId,
      seatId: seatId,
      keyDeposit: keyDeposit,
      endDate: endDate,
      status: 'active',
      paymentStatus: 'pending'
    });

    // Update seat availability
    // await Seat.findByIdAndUpdate(seatId, { isAvailable: false, unavailableUntil: endDate });

    // Update user vendor relationship
    await User.findOneAndUpdate(user._id, { vendorIds: [cabin.vendorId] });
   
    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully'
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

function generateBookingId(prefix) {
  const now = new Date();

  const year = now.getFullYear().toString().slice(-2); // last two digits
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 01-12
  const day = String(now.getDate()).padStart(2, '0'); // 01-31
  const hour = String(now.getHours()).padStart(2, '0'); // 00-23
  const min = String(now.getMinutes()).padStart(2, '0'); // 00-59
  const sec = String(now.getSeconds()).padStart(2, '0'); // 00-59

  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number

  return `${prefix}-${year}${month}${day}-${hour}${min}${sec}-${random}`;
}

// @desc    Get user bookings
// @route   GET /api/bookings/user
// @access  Private
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const bookings = await Booking.find({ userId })
      .populate('cabinId','name category cabinCode')
      .populate('seatId')
      .populate('appliedCoupon.couponId', 'code name type value')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get a single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('cabinId','name category cabinCode')
      .populate('seatId')
      .populate('userId', 'name email userID profilePicture')
      .populate('appliedCoupon.couponId', 'code name type value description')
      .populate('transferredHistory.cabinId', 'name category cabinCode')
      .populate('transferredHistory.seatId','number price')
      .populate('transferredHistory.transferredBy', 'name email phoneNumber');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if the booking belongs to the user or the user is an admin
    if (booking.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking'
      });
    }
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Cancel a booking
// @route   POST /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if the booking belongs to the user or the user is an admin
    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Revert coupon usage if coupon was applied
    if (booking.appliedCoupon && booking.appliedCoupon.couponId) {
      const coupon = await Coupon.findById(booking.appliedCoupon.couponId);
      if (coupon) {
        // Decrease overall usage count
        coupon.usageCount = Math.max(0, (coupon.usageCount || 0) - 1);
        
        // Decrease user-specific usage
        const userUsage = coupon.usedBy.find(usage => 
          usage.userId.toString() === booking.userId.toString() && 
          usage.bookingId && usage.bookingId.toString() === booking._id.toString()
        );
        
        if (userUsage) {
          if (userUsage.usageCount > 1) {
            userUsage.usageCount -= 1;
          } else {
            // Remove the usage record if count becomes 0
            coupon.usedBy = coupon.usedBy.filter(usage => 
              !(usage.userId.toString() === booking.userId.toString() && 
                usage.bookingId && usage.bookingId.toString() === booking._id.toString())
            );
          }
        }
        
        await coupon.save();
      }
    }
    
    // Update booking status
    booking.paymentStatus = 'cancelled';
    booking.status = 'cancelled';
    await booking.save();

    // Update deposit refund record
    const depositRefundData = await DepositRefund.findOne({ bookingId: req.params.id });
    if (depositRefundData) {
      depositRefundData.isKeyDepositPaid = false;
      depositRefundData.status = 'expired';
      await depositRefundData.save();
    }

    // Update seat availability
    // await Seat.findByIdAndUpdate(booking.seatId, { isAvailable: true, unavailableUntil: null });
    
    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Process payment for a booking
// @route   POST /api/bookings/:id/payment
// @access  Private
exports.processPayment = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if the booking belongs to the user
    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process payment for this booking'
      });
    }
    
    // In a real app, you would integrate with a payment gateway here
    // For now, just mark the booking as paid
    booking.paymentStatus = 'completed';
    booking.paymentMethod = paymentMethod;
    booking.paymentDate = new Date();
    
    await booking.save();
    
    res.status(200).json({
      success: true,
      data: booking,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get current bookings (active)
// @route   GET /api/bookings/user/current
// @access  Private
exports.getCurrentBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    
    const bookings = await Booking.find({ 
      userId, 
      endDate: { $gte: currentDate }, 
      display:true,
      status: ['pending', 'completed']
    })
    .populate('cabinId','name category cabinCode imageSrc location')
    .populate('seatId','number price')
    .populate('userId','name profilePicture email phone')
    .populate('appliedCoupon.couponId', 'code name type value')
    .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Get current bookings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get booking history (past bookings)
// @route   GET /api/bookings/user/history
// @access  Private
exports.getBookingHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    
    const bookings = await Booking.find({ 
      userId, 
      endDate: { $lt: currentDate },
      display: true
    })
    .populate('cabinId','name category cabinCode')
    .populate('seatId','number price')
    .populate('userId','name profilePicture email phone')
    .populate('appliedCoupon.couponId', 'code name type value')
    .sort({ endDate: -1 });
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Get booking history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get booking reports
// @route   GET /api/bookings/reports
// @access  Private
exports.getBookingReports = async (req, res) => {
  try {
    // This endpoint would be more complex in a real application
    // For now, we'll just return some basic stats
    const userId = req.user.id;
    
    const totalBookings = await Booking.countDocuments({ userId });
    const completedBookings = await Booking.countDocuments({ userId, paymentStatus: 'completed' });
    const pendingBookings = await Booking.countDocuments({ userId, paymentStatus: 'pending' });
    
    // Calculate total spent
    const bookings = await Booking.find({ userId, paymentStatus: 'completed' });
    const totalSpent = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    
    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        completedBookings,
        pendingBookings,
        totalSpent
      }
    });
  } catch (error) {
    console.error('Get booking reports error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Renew a booking (extend end date with additional payment)
// @route   POST /api/bookings/:id/renew
// @access  Private
exports.renewBooking = async (req, res) => {
  try {
    const { additionalMonths, newEndDate, additionalAmount } = req.body;
    
    if (!newEndDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide new end date'
      });
    }
    
    const booking = await Booking.findById(req.params.id).populate('cabinId','name category cabinCode').populate('seatId');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if the booking belongs to the user or user is admin
    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to renew this booking'
      });
    }
    
    // Calculate additional months if not provided
    const currentEndDate = new Date(booking.endDate);
    const newEndDateObj = new Date(newEndDate);
    let calculatedAdditionalMonths = additionalMonths;
    
    if (!additionalMonths) {
      const monthsDiff = (newEndDateObj.getFullYear() - currentEndDate.getFullYear()) * 12 + 
                        (newEndDateObj.getMonth() - currentEndDate.getMonth());
      calculatedAdditionalMonths = Math.max(1, Math.ceil(monthsDiff));
    }
    
    // Calculate additional amount if not provided
    let calculatedAdditionalAmount = additionalAmount;
    if (!additionalAmount) {
      const monthlyRate = booking.seatId.price;
      calculatedAdditionalAmount = monthlyRate * calculatedAdditionalMonths;
    }
    
    // Store previous values for history
    const previousEndDate = booking.endDate;
    const previousTotalPrice = booking.totalPrice;
    
    // Update the booking
    booking.endDate = newEndDate;
    booking.updatedAt = new Date();
    booking.durationCount = (booking.durationCount || 1) + calculatedAdditionalMonths;
    booking.totalPrice = previousTotalPrice + calculatedAdditionalAmount;
    
    // Initialize renewal history if it doesn't exist
    if (!booking.renewalHistory) {
      booking.renewalHistory = [];
    }
    
    // Add renewal record to history
    booking.renewalHistory.push({
      previousEndDate: previousEndDate,
      newEndDate: newEndDate,
      additionalMonths: calculatedAdditionalMonths,
      additionalAmount: calculatedAdditionalAmount,
      previousAmount: previousTotalPrice,
      renewedAt: new Date(),
      renewedBy: req.user.id
    });
    
    await booking.save();
    
      // Update corresponding deposit refund record
    await DepositRefund.findOneAndUpdate(
      { bookingId: booking._id },
      { endDate: newEndDate }
    );
    
    res.status(200).json({
      success: true,
      data: booking,
      message: 'Booking renewed successfully'
    });
  } catch (error) {
    console.error('Renew booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
