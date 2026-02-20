
const crypto = require('crypto');
const Booking = require('../models/Booking');
const HostelBooking = require('../models/HostelBooking');
const Seat = require('../models/Seat');
const HostelBed = require('../models/HostelBed');
const { temporaryReservations } = require('./hostelBookingController');

// RazorPay configuration
const razorpay = require('razorpay');
const Transaction = require('../models/Transaction');
const jobProcessor = require('../services/jobProcessor');
const { format } = require('date-fns');
const User = require('../models/User');
const DepositRefund = require('../models/DepositRefund');
const Settings = require('../models/Settings');

// @desc    Create a Razorpay order
// @route   POST /api/payments/razorpay/create-order
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { amount, currency, bookingId, bookingType, bookingDuration, durationCount, notes } = req.body;
    
    // Validate required fields
    if (!amount || !currency || !bookingId || !bookingType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const settings = await Settings.findOne({ category:'payment', provider:'razorpay' });
    const rzp = new razorpay({
      key_id: settings.settings.keyId,
      key_secret: settings.settings.keySecret
    });
    
    // Create the order
    const order = await rzp.orders.create({
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency,
      receipt: bookingId,
      payment_capture: 1,
      notes: {
        bookingType,
        userId: req.user.id,
        bookingDuration: bookingDuration || 'monthly',
        durationCount: durationCount || 1,
        ...notes
      }
    });

    if(order['id'] && bookingType =='hotel'){
        const booking = await HostelBooking.findById(bookingId);      
        booking.razorpay_order_id = order['id'],
        booking.paymentMethod = 'razorpay';
        await booking.save();
    }
    if(order['id'] && bookingType =='cabin'){
        const transaction = await Transaction.findById(notes.transactionId);      
        transaction.razorpay_order_id = order['id'],
        transaction.paymentMethod = 'razorpay';
        await transaction.save();
    }
    const KEY_ID = settings.settings.keyId
    res.status(201).json({
      success: true,
      data: {
        ...order,
        KEY_ID
      }
    });
  } catch (error) {
    console.error('RazorPay create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Verify a Razorpay payment
// @route   POST /api/payments/razorpay/verify-payment
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, bookingId, bookingType } = req.body;
    
    const settings = await Settings.findOne({ category:'payment', provider:'razorpay' });

    // Verify signature
    const generatedSignature = crypto.createHmac('sha256', settings.settings.keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    
    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }
    
    // Update booking status based on booking type
    if (bookingType === 'cabin') {
      const booking = await Booking.findById(bookingId)
        .populate('userId', 'name email')
        .populate('cabinId', 'cabinCode name vendorId')
        .populate('seatId', 'number');;
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
      
      booking.paymentStatus = 'completed';
      booking.paymentMethod = 'razorpay';
      booking.status = 'completed';
      booking.paymentDate = new Date();
      await booking.save();

      const depositeRefundData = await DepositRefund.findOne({bookingId: bookingId})
      depositeRefundData.isKeyDepositPaid = true;
      depositeRefundData.status = 'active';
      depositeRefundData.save();
      
      // Update seat availability until end date
      // if (booking.seatId) {
      //   await Seat.findByIdAndUpdate(booking.seatId, {
      //     isAvailable: false,
      //     unavailableUntil: booking.endDate
      //   });
      // }
       try {
          const confirmation = {
                email: booking.userId.email,
                name: booking.userId.name,
                bookingDetails: {
                  id: booking.bookingId || booking._id,
                  userName : booking.userId.name,
                  email: booking.userId.email,
                  name: booking.userId.name,
                  bookingType: 'Reading Room Booking',
                  startDate: format(new Date(booking.startDate), 'MMM dd, yyyy HH:mm:ss'),
                  endDate: format(new Date(booking.endDate), 'MMM dd, yyyy HH:mm:ss'),
                  roomName: bookingType === 'cabin' 
                    ? `${booking.cabinId?.name} - ${booking.seatId?.number}`
                    : `${booking.hostelId?.name} - ${booking.roomId?.name} - ${booking.bedId?.name}`,
                  amount: booking.totalPrice,
                  supportEmail: 'support@inhalestays.com'
                }
              };
              let user = await User.findOne(req.user._id);
        
              // Add to job queue
              const jobId = jobProcessor.addJob(
                'send_booking_confirmation',
                confirmation,
                'normal'
              );
              await User.findOneAndUpdate(user._id,{vendorIds:[booking.cabinId.vendorId]});
      } catch (emailError) {
        console.error('Failed to queue welcome email:', emailError);
      }
    } 
    else if (bookingType === 'hostel') {
      // Check if the booking ID is a reservation
      if (temporaryReservations && temporaryReservations.has(bookingId)) {
        const reservation = temporaryReservations.get(bookingId);
        
        // Create a confirmed booking from the reservation
        const booking = await HostelBooking.create({
          userId: req.user.id,
          hostelId: reservation.hostelId,
          bedId: reservation.bedId,
          startDate: reservation.startDate,
          endDate: reservation.endDate,
          months: reservation.months,
          totalPrice: reservation.totalPrice,
          paymentStatus: 'completed',
          paymentMethod: 'razorpay',
          paymentDate: new Date()
        });
        
        // Mark reservation as confirmed
        temporaryReservations.set(bookingId, {
          ...reservation,
          confirmed: true
        });
        
        // Update bed as permanently unavailable
        await HostelBed.findByIdAndUpdate(reservation.bedId, {
          isAvailable: false
        });
        
        return res.status(200).json({
          success: true,
          message: 'Payment verified successfully',
          bookingId: booking._id
        });
      }
      
      // If not a reservation, try to find an existing booking
      const booking = await HostelBooking.findOne({razorpay_order_id:razorpay_order_id});
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Hostel booking not found'
        });
      }
      
      booking.paymentStatus = 'completed';
      booking.status = 'completed';
      booking.paymentMethod = 'razorpay';
      booking.paymentDate = new Date();
      await booking.save();
      
      // Update bed availability
      if (booking.bedId) {
        await HostelBed.findByIdAndUpdate(booking.bedId, {
          isAvailable: false
        });
      }
    } 
    else if (bookingType === 'laundry') {
      // Implement laundry payment handling
      // For demonstration, we'll just log it
      console.log(`Laundry payment completed for booking ID: ${bookingId}`);
    }
    
    res.status(200).json({
      success: true,
      message: 'Payment verified successfully'
    });
  } catch (error) {
    console.error('RazorPay verify payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Check payment status
// @route   GET /api/payments/status/:bookingId
// @access  Private
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { bookingType } = req.query;
    
    let booking;
    
    if (bookingType === 'cabin') {
      booking = await Booking.findById(bookingId);
    } else if (bookingType === 'hostel') {
      booking = await HostelBooking.findById(bookingId);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking type'
      });
    }
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        paymentDate: booking.paymentDate
      }
    });
  } catch (error) {
    console.error('Check payment status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Verify a Razorpay payment
// @route   POST /api/payments/razorpay/verify-transaction-payment
// @access  Private
exports.verifyTransactionPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, bookingId, bookingType } = req.body;
    
    const settings = await Settings.findOne({ category:'payment', provider:'razorpay' });
    // Verify signature
    const generatedSignature = crypto.createHmac('sha256', settings.settings.keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    
    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }
    const transaction = await Transaction.findOne({transactionId:bookingId});

    if (razorpay_payment_id) transaction.razorpay_payment_id = razorpay_payment_id;
    if (razorpay_signature) transaction.razorpay_signature = razorpay_signature;

    await transaction.save();
    
    res.status(200).json({
      success: true,
      message: 'Payment verified successfully'
    });
  } catch (error) {
    console.error('RazorPay verify payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};