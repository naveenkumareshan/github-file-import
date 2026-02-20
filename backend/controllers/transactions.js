
const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const HostelBooking = require('../models/HostelBooking');
const { v4: uuidv4 } = require('uuid');

// Generate transaction ID
function generateTransactionId(prefix = 'TXN') {
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


// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Private
exports.createTransactionByAdmin = async (req, res) => {
  try {
    const { bookingId, bookingType, transactionType, amount, currency, additionalMonths, newEndDate } = req.body;

    // Validate required fields
    if (!bookingId || !bookingType || !transactionType || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Generate unique transaction ID
    const transactionId = generateTransactionId('TXN');

    // Get previous end date for renewal transactions
    let previousEndDate = null;
    let booking;
    if (transactionType === 'renewal') {
      if (bookingType === 'cabin') {
        booking = await Booking.findById(bookingId);
      } else if (bookingType === 'hostel') {
        booking = await HostelBooking.findById(bookingId);
      }
      
      if (booking) {
        previousEndDate = booking.endDate;
      }
    }

    // Create transaction
    const transaction = await Transaction.create({
      transactionId,
      userId: booking.userId,
      bookingId,
      bookingType,
      cabinId: booking.cabinId,
      transactionType,
      amount,
      currency: currency || 'INR',
      additionalMonths,
      newEndDate,
      previousEndDate,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Transaction created successfully'
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Private
exports.createTransaction = async (req, res) => {
  try {
    const { bookingId, bookingType, paymentMethod, transactionType, amount, currency, additionalMonths, newEndDate , appliedCoupon} = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!bookingId || !bookingType || !transactionType || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Generate unique transaction ID
    const transactionId = generateTransactionId('TXN');
   let booking;

    // Get previous end date for renewal transactions
    let previousEndDate = null;
    if (transactionType === 'renewal') {

      if (bookingType === 'cabin') {
        booking = await Booking.findById(bookingId);
      } else if (bookingType === 'hostel') {
        booking = await HostelBooking.findById(bookingId);
      }

      if (booking) {
        previousEndDate = booking.endDate;
      }
    }else{
        if (bookingType === 'cabin') {
          booking = await Booking.findById(bookingId);
        } else if (bookingType === 'hostel') {
          booking = await HostelBooking.findById(bookingId);
        }
    }

    // Create transaction
    const transaction = await Transaction.create({
      transactionId,
      userId: booking.userId,
      bookingId,
      cabinId: booking.cabinId,
      bookingType,
      transactionType,
      amount,
      paymentMethod,
      currency: currency || 'INR',
      additionalMonths,
      newEndDate,
      previousEndDate,
      appliedCoupon,
      status: 'pending'
    });

    // Add coupon to booking's coupon history if applied
    if (appliedCoupon && appliedCoupon.couponCode) {
      // If booking not already fetched (e.g., for new booking), fetch now
      if (!booking) {
        booking =
          bookingType === 'cabin'
            ? await Booking.findById(bookingId)
            : await HostelBooking.findById(bookingId);
      }

      if (booking) {
        if (!booking.couponsHistory) booking.couponsHistory = [];

        booking.couponsHistory.push({
          couponId: appliedCoupon.couponId,
          couponCode: appliedCoupon.couponCode,
          discountAmount: appliedCoupon.discountAmount,
          couponType: appliedCoupon.couponType,
          couponValue: appliedCoupon.couponValue,
          appliedAt: appliedCoupon.appliedAt || new Date(),
          transactionId: transaction._id,
          transactionType: transactionType
        });

        await booking.save();
      }
    }


    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Transaction created successfully'
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('appliedCoupon.couponId', 'code name type value');
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if transaction belongs to user
    if (transaction.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this transaction'
      });
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update transaction status
// @route   PUT /api/transactions/:id/status
// @access  Private
exports.updateTransactionStatus = async (req, res) => {
  try {
    const { bookingId, transactionId, status, razorpay_payment_id, razorpay_signature, paymentResponse, paymentMethod } = req.body;

    var booking = await Booking.findById(req.params.id);
    if(!booking){
      booking = await Booking.findOne({bookingId:bookingId});
    }

    var transaction  = null;
        if(booking){
          transaction = await Transaction.findOne({ bookingId: booking._id }).sort({ createdAt: -1 }); 
        }else{
          transaction = await Transaction.findOne({_id:transactionId}).sort({ createdAt: -1 }); 
        }
          
          if (!transaction) {
            return res.status(404).json({
              success: false,
              message: 'Transaction not found'
            });
          }

          // Check if transaction belongs to user
          if (transaction.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
              success: false,
              message: 'Not authorized to update this transaction'
            });
          }

          // Update transaction
          transaction.status = status;
          transaction.updatedAt = new Date();
          
          if (razorpay_payment_id) transaction.razorpay_payment_id = razorpay_payment_id;
          if (razorpay_signature) transaction.razorpay_signature = razorpay_signature;
          if (paymentResponse) transaction.paymentResponse = paymentResponse;
          if (paymentMethod) transaction.paymentMethod = paymentMethod;


          await transaction.save();

          res.status(200).json({
            success: true,
            data: transaction,
            message: 'Transaction status updated successfully'
          });
    
  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Process renewal after successful payment
// @route   POST /api/transactions/:id/process-renewal
// @access  Private
exports.processRenewal = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_signature } = req.body;
    
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if transaction belongs to user
    if (transaction.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process this transaction'
      });
    }

    // Verify transaction is for renewal and payment is completed
    if (transaction.transactionType !== 'renewal' || transaction.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction for renewal processing'
      });
    }

    // Process the actual booking renewal
    let booking;
    if (transaction.bookingType === 'cabin') {
      booking = await Booking.findById(transaction.bookingId);
      if (booking) {
        // Update booking with renewal data
        booking.endDate = transaction.newEndDate;
        booking.endDate = transaction.newEndDate;
        // booking.seatPrice = transaction.amount;
        booking.durationCount = (booking.durationCount || 1) + (transaction.additionalMonths || 1);
        booking.totalPrice = booking.totalPrice + transaction.amount;
        
        // Add to renewal history
        if (!booking.renewalHistory) booking.renewalHistory = [];
        booking.renewalHistory.push({
          previousEndDate: transaction.previousEndDate,
          newEndDate: transaction.newEndDate,
          additionalMonths: transaction.additionalMonths,
          additionalAmount: transaction.amount,
          previousAmount: booking.totalPrice,
          renewedAt: new Date(),
          renewedBy: req.user.id,
          transactionId: transaction._id
        });
        // Add coupon to booking's coupon history if applied
        if (transaction.appliedCoupon && transaction.appliedCoupon.couponCode) {
          if (!booking.couponsHistory) booking.couponsHistory = [];
          booking.couponsHistory.push({
            couponId: transaction.appliedCoupon.couponId,
            couponCode: transaction.appliedCoupon.couponCode,
            discountAmount: transaction.appliedCoupon.discountAmount,
            couponType: transaction.appliedCoupon.couponType,
            couponValue: transaction.appliedCoupon.couponValue,
            appliedAt: transaction.appliedCoupon.appliedAt || new Date(),
            transactionId: transaction._id,
            transactionType: 'renewal'
          });
        }
        booking.updatedAt = new Date();
        booking.bookingStatus = 'active';
        await booking.save();
      }
    } else if (transaction.bookingType === 'hostel') {
      booking = await HostelBooking.findById(transaction.bookingId);
      if (booking) {
        // Update hostel booking with renewal data
        booking.endDate = transaction.newEndDate;
        booking.months = booking.months + (transaction.additionalMonths || 1);
        booking.totalPrice = booking.totalPrice + transaction.amount;
        await booking.save();
      }
    }

    res.status(200).json({
      success: true,
      data: { transaction, booking },
      message: 'Renewal processed successfully'
    });
  } catch (error) {
    console.error('Process renewal error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get user transactions
// @route   GET /api/transactions/user
// @access  Private
exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const transactions = await Transaction.find({ userId })
    .populate('appliedCoupon.couponId', 'code name type value')
    .sort({ updatedAt: -1 });
    
    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};


// @desc    Get user transactions
// @route   GET /api/transactions/user
// @access  Private
exports.getBookingTransactions = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    
    const transactions = await Transaction.find({ bookingId })
    .populate('appliedCoupon.couponId', 'code name type value')
    .sort({ updatedAt: -1 });
    
    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
