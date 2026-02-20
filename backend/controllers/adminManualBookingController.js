
const Booking = require('../models/Booking');
const HostelBooking = require('../models/HostelBooking');
const Seat = require('../models/Seat');
const HostelBed = require('../models/HostelBed');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Cabin = require('../models/Cabin');
const moment = require('moment-timezone');
const Transaction = require('../models/Transaction');
const DepositRefund = require('../models/DepositRefund');

// Generate booking ID based on type
function generateBookingId(prefix) {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const sec = String(now.getSeconds()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);

  return `${prefix}-${year}${month}${day}-${hour}${min}${sec}-${random}`;
}
// Generate transaction ID
function generateTransactionId(prefix = 'TXN') {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const sec = String(now.getSeconds()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 90000);
  return `${prefix}-${year}${month}${day}-${hour}${min}${sec}-${random}`;
}


// @desc    Manually create cabin seat booking by admin
// @route   POST /api/admin/bookings/manual/cabin
// @access  Private/Admin
exports.createManualCabinBooking = async (req, res) => {
  try {
    const { 
      userId, 
      cabinId, 
      seatId, 
      startDate, 
      endDate, 
      bookingDuration, 
      durationCount, 
      totalPrice, 
      paymentStatus, 
      paymentMethod,
      notes,
      key_deposite,
      transaction_id,
      receipt_no
    } = req.body;

    if (!userId || !cabinId || !seatId || !startDate || !endDate || !totalPrice || !transaction_id || !key_deposite || !receipt_no) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if the seat is available
    const user = await User.findById(userId);
    const seat = await Seat.findById(seatId);
    const cabin = await Cabin.findById(cabinId);
    if (!seat) {
      return res.status(400).json({
        success: false,
        message: 'The selected seat is not available'
      });
    }

     // Check for overlapping bookings
    const overlappingBooking = await Booking.findOne({
      seatId,
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) }
        }
      ],
      status: { $nin: ['cancelled', 'expired'] }
    });

    if (overlappingBooking) {
      return res.status(400).json({
        success: false,
        message: `Seat is already booked from ${overlappingBooking.startDate.toDateString()} to ${overlappingBooking.endDate.toDateString()}`
      });
    }

    // Generate booking ID
    const bookingId = generateBookingId('CABIN');
    
    
    // Create booking with admin-specific fields
    const booking = await Booking.create({
      userId,
      bookingId,
      cabinId,
      seatId,
      startDate:moment.tz(`${startDate} 00:00:00`, 'Asia/Kolkata').utc().toDate(),
      endDate : moment.tz(`${endDate} 23:59:59`, 'Asia/Kolkata').utc().toDate(),
      bookingDuration: bookingDuration || 'monthly',
      durationCount: durationCount || 1,
      totalPrice,
      status: paymentStatus || 'pending',
      paymentStatus: paymentStatus || 'pending',
      paymentMethod: paymentMethod || 'cash',
      createdBy: req.user.id,
      isAdminCreated: true,
      adminNotes: notes,
      keyDeposit: key_deposite,
      isKeyDepositPaid: true
    });
   const transactionId = generateTransactionId('TXN');
        const transaction = await Transaction.create({
          transactionId,
          manual_transaction_id:transaction_id,
          receipt_no:receipt_no || booking._id,
          userId: user._id,
          cabinId: cabinId,
          bookingId: booking._id,
          bookingType: 'cabin',
          transactionType: 'booking',
          amount: totalPrice,
          currency: 'INR',
          status: 'completed',
          paymentMethod: paymentMethod ||'admin_created',
          keyDeposit: key_deposite,
          isKeyDepositPaid:true
        });

        await DepositRefund.create({
          bookingId: booking._id,
          userId: user._id,
          cabinId: cabinId,
          seatId: seatId,
          keyDeposit: key_deposite,
          endDate: endDate,
          status: 'active',
          paymentStatus: 'pending',            
          isKeyDepositPaid: true
        });

    // Update seat availability
    // await Seat.findByIdAndUpdate(seatId, { isAvailable: false, unavailableUntil:endDate });
    await User.findOneAndUpdate(user._id,{vendorIds:[cabin.vendorId]});

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Manual cabin booking created successfully'
    });
  } catch (error) {
    console.error('Create manual cabin booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Manually create hostel bed booking by admin
// @route   POST /api/admin/bookings/manual/hostel
// @access  Private/Admin
exports.createManualHostelBooking = async (req, res) => {
  try {
    const { 
      userId, 
      hostelId, 
      roomId, 
      bedId, 
      startDate, 
      endDate, 
      months, 
      totalPrice, 
      paymentStatus, 
      paymentMethod,
      sharingType,
      sharingOptionId,
      notes 
    } = req.body;

    if (!userId || !hostelId || !roomId || !bedId || !startDate || !endDate || !totalPrice) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if the bed is available
    const bed = await HostelBed.findById(bedId);
    if (!bed || !bed.isAvailable) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found or not available'
      });
    }

    // Generate booking ID
    const bookingId = generateBookingId('HOSTEL');
    
    // Create booking with admin-specific fields
    const booking = await HostelBooking.create({
      userId,
      bookingId,
      hostelId,
      roomId,
      bedId,
      sharingOptionId: sharingOptionId || null,
      sharingType: sharingType || bed.sharingType,
      startDate,
      endDate,
      months: months || 1,
      totalPrice,
      paymentStatus: paymentStatus || 'pending',
      paymentMethod: paymentMethod || 'cash',
      createdBy: req.user.id,
      isAdminCreated: true,
      adminNotes: notes
    });

    // Update bed availability
    await HostelBed.findByIdAndUpdate(bedId, { isAvailable: false });

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Manual hostel booking created successfully'
    });
  } catch (error) {
    console.error('Create manual hostel booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Extend booking validity
// @route   PUT /api/admin/bookings/:id/extend
// @access  Private/Admin
exports.extendBooking = async (req, res) => {
  try {
    const { newEndDate, additionalAmount, paymentMethod, paymentStatus, notes } = req.body;
    const { id } = req.params;
    const { bookingType } = req.query; // 'cabin' or 'hostel'

    if (!newEndDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new end date'
      });
    }

    let booking;
    let originalEndDate;

    // Find the booking based on type
    if (bookingType === 'cabin') {
      booking = await Booking.findById(id);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Cabin booking not found'
        });
      }
      originalEndDate = new Date(booking.endDate);
      
      // Calculate new duration in months if monthly booking
      if (booking.bookingDuration === 'monthly') {
        const originalStartDate = new Date(booking.startDate);
        const newEnd = new Date(newEndDate);
        const monthDiff = (newEnd.getFullYear() - originalStartDate.getFullYear()) * 12 + 
                          (newEnd.getMonth() - originalStartDate.getMonth());
        booking.durationCount = monthDiff;
      }

      booking.endDate = new Date(newEndDate);
      booking.totalPrice = additionalAmount ? booking.totalPrice + additionalAmount : booking.totalPrice;
      if (paymentMethod) booking.paymentMethod = paymentMethod;
      if (paymentStatus) booking.paymentStatus = paymentStatus;
      booking.lastExtendedBy = req.user.id;
      booking.updatedAt = new Date();
      booking.extensionNotes = notes || 'Booking extended by admin';
      booking.bookingStatus = 'active';
      await booking.save();
    } else if (bookingType === 'hostel') {
      booking = await HostelBooking.findById(id);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Hostel booking not found'
        });
      }
      originalEndDate = new Date(booking.endDate);
      
      // Calculate new duration in months
      const originalStartDate = new Date(booking.startDate);
      const newEnd = new Date(newEndDate);
      const monthDiff = (newEnd.getFullYear() - originalStartDate.getFullYear()) * 12 + 
                        (newEnd.getMonth() - originalStartDate.getMonth());
      
      booking.endDate = new Date(newEndDate);
      booking.months = monthDiff > 0 ? monthDiff : 1;
      booking.totalPrice = additionalAmount ? booking.totalPrice + additionalAmount : booking.totalPrice;
      if (paymentMethod) booking.paymentMethod = paymentMethod;
      if (paymentStatus) booking.paymentStatus = paymentStatus;
      booking.lastExtendedBy = req.user.id;
      booking.updatedAt = new Date();
      booking.extensionNotes = notes || 'Booking extended by admin';
      booking.bookingStatus = 'active';
      await booking.save();
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking type. Must be "cabin" or "hostel"'
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
      originalEndDate: originalEndDate.toISOString(),
      message: 'Booking extended successfully'
    });
  } catch (error) {
    console.error('Extend booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Extend booking validity
// @route   PUT /api/admin/bookings/:id/extend
// @access  Private/Admin
exports.updateBookingData = async (req, res) => {
  try {
    const { startDate, endDate, notes } = req.body;
    const { id } = req.params;
    const { bookingType } = req.query; // 'cabin' or 'hostel'

    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new end date'
      });
    }

    let booking;
    let originalEndDate;

    // Find the booking based on type
    if (bookingType === 'cabin') {
      booking = await Booking.findById(id);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Cabin booking not found'
        });
      }
      booking.startDate = moment.tz(`${startDate} 00:00:00`, 'Asia/Kolkata').utc().toDate();
      booking.endDate = moment.tz(`${endDate} 23:59:59`, 'Asia/Kolkata').utc().toDate();

      booking.status = 'completed';
      booking.updatedBy = req.user.id;
      booking.extensionNotes = notes || 'Booking extended by admin';
      booking.updatedAt = new Date();
      booking.bookingStatus = 'active';
      await booking.save();
    } else if (bookingType === 'hostel') {
      
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking type. Must be "cabin" or "hostel"'
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
      originalEndDate: new Date(booking.endDate).toISOString(),
      message: 'Booking extended successfully'
    });
  } catch (error) {
    console.error('Extend booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Record manual payment for booking
// @route   POST /api/admin/bookings/:id/payment
// @access  Private/Admin
exports.recordManualPayment = async (req, res) => {
  try {
    const { paymentAmount, paymentMethod, paymentStatus, notes } = req.body;
    const { id } = req.params;
    const { bookingType } = req.query; // 'cabin' or 'hostel'

    if (!paymentAmount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Please provide payment amount and method'
      });
    }

    let booking;
    
    // Update booking based on type
    if (bookingType === 'cabin') {
      booking = await Booking.findById(id);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Cabin booking not found'
        });
      }

      // Record payment details
      const paymentRecord = {
        amount: paymentAmount,
        method: paymentMethod,
        date: new Date(),
        recordedBy: req.user.id,
        notes: notes || 'Manual payment recorded by admin'
      };

      // Add payment record to booking
      if (!booking.paymentRecords) {
        booking.paymentRecords = [];
      }
      booking.paymentRecords.push(paymentRecord);
      
      // Update payment status if provided
      if (paymentStatus) {
        booking.paymentStatus = paymentStatus;
      } else if (paymentAmount >= booking.totalPrice) {
        booking.paymentStatus = 'completed';
      }
      
      booking.paymentMethod = paymentMethod;
      booking.paymentDate = new Date();
      
      await booking.save();
    } else if (bookingType === 'hostel') {
      booking = await HostelBooking.findById(id);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Hostel booking not found'
        });
      }

      // Record payment details
      const paymentRecord = {
        amount: paymentAmount,
        method: paymentMethod,
        date: new Date(),
        recordedBy: req.user.id,
        notes: notes || 'Manual payment recorded by admin'
      };

      // Add payment record to booking
      if (!booking.paymentRecords) {
        booking.paymentRecords = [];
      }
      booking.paymentRecords.push(paymentRecord);
      
      // Update payment status if provided
      if (paymentStatus) {
        booking.paymentStatus = paymentStatus;
      } else if (paymentAmount >= booking.totalPrice) {
        booking.paymentStatus = 'completed';
      }
      
      booking.paymentMethod = paymentMethod;
      booking.paymentDate = new Date();
      
      await booking.save();
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking type. Must be "cabin" or "hostel"'
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get booking details with payment history
// @route   GET /api/admin/bookings/:id/details
// @access  Private/Admin
exports.getBookingDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { bookingType } = req.query; // 'cabin' or 'hostel'
    
    let booking;
    
    if (bookingType === 'cabin') {
      booking = await Booking.findById(id)
        .populate('userId', 'name email phone profilePicture')
        .populate('cabinId', 'name category cabinCode')
        .populate('seatId', 'number price')
        .populate('createdBy', 'name')
        .populate('lastExtendedBy', 'name');
    } else if (bookingType === 'hostel') {
      booking = await HostelBooking.findById(id)
        .populate('userId', 'name email phone profilePicture')
        .populate('hostelId', 'name location')
        .populate('roomId', 'roomNumber floor')
        .populate('bedId', 'number price')
        .populate('createdBy', 'name')
        .populate('lastExtendedBy', 'name');
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking type. Must be "cabin" or "hostel"'
      });
    }
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `${bookingType === 'cabin' ? 'Cabin' : 'Hostel'} booking not found`
      });
    }
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

