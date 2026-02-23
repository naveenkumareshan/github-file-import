
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Seat = require('../models/Seat');
const Cabin = require('../models/Cabin');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const DepositRefund = require('../models/DepositRefund');
const moment = require('moment-timezone');

// Generate booking ID
function generateBookingId(prefix = 'BK') {
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

// @desc    Create bulk bookings for students
// @route   POST /api/admin/bookings/bulk-create
// @access  Private/Admin
exports.createBulkBookings = async (req, res) => {
  try {
    const { cabinId, floorId, students } = req.body;

    if (!cabinId || !students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide cabin ID and students array'
      });
    }

    // Validate cabin exists
    const cabin = await Cabin.findById(cabinId);
    if (!cabin) {
      return res.status(404).json({
        success: false,
        message: 'Cabin not found'
      });
    }

    // Get available seats for the cabin
    const availableSeats = await Seat.find({ 
      cabinId: cabinId, 
      floor: floorId,
      isAvailable: true 
    }).sort({ number: 1 });

    if (availableSeats.length < students.length) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableSeats.length} seats available for ${students.length} students`
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    // Process each student
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const seat = await Seat.findOne({ 
        cabinId: cabinId, 
        isAvailable: true,
        floor : floorId,
        number: student.seat_no
      })

      try {
        // Check if user exists, create if not
        let user = await User.findOne({ phone: student.phone });
        let userWithEmail = await User.findOne({ email: student.email });
        
        if (!user && !userWithEmail) {
          // Create new user account
          const defaultPassword = require('crypto').randomBytes(16).toString('hex');

          user = await User.create({
            name: student.name,
            email: student.email,
            phone: student.phone,
            socialProvider : student.phone ? null : 'google',
            password: defaultPassword,
            role: 'student',
            isActive: true,
            vendorIds:[cabin.vendorId]
          });
        }
        if(userWithEmail){
          user = userWithEmail;
        }

        // Calculate dates
        const startDate = new Date(student.startDate);
        const endDate = new Date(student.endDate);
        // endDate.setMonth(endDate.getMonth());
        

        // // Calculate total price
        if(user && seat){        
        // // Create booking
        let bookingCheck = await Booking.findOne({ userId: user._id, cabinId: cabinId, seatId: seat._id, });
        if(!bookingCheck && seat && user){
          const seatPrice = seat.price;
          const totalPrice = student.amount + student.key_deposite;

          const bookingId = generateBookingId('CABIN');
          const booking = await Booking.create({
            bookingId,
            userId: user._id,
            cabinId: cabinId,
            seatId: seat._id,
            floor : floorId,
            startDate:student.startDate,
            endDate : student.endDate,
            months: 1,
            durationCount: 1,
            totalPrice,
            seatPrice,
            paymentStatus: 'completed',
            status: 'completed',
            createdBy: req.user.id
          });
          // await Seat.findByIdAndUpdate(seat._id, { isAvailable: false, unavailableUntil:endDate });
          await User.findOneAndUpdate(user._id,{vendorIds:[cabin.vendorId]});
          
            // Create transaction
            const transactionId = generateTransactionId('TXN');
            const transaction = await Transaction.create({
              transactionId,
              manual_transaction_id:student.transaction_id,
              receipt_no:student.receipt_no,
              userId: user._id,
              bookingId: booking._id,
              cabinId: cabinId,
              bookingType: 'cabin',
              transactionType: 'booking',
              amount: totalPrice,
              currency: 'INR',
              status: 'completed',
              paymentMethod: 'admin_created',
              keyDeposit: student.key_deposite,
              isKeyDepositPaid:true
            });

            await DepositRefund.create({
              bookingId: booking._id,
              userId: user._id,
              cabinId: cabinId,
              seatId: seat._id,
              keyDeposit: student.key_deposite,
              endDate: endDate,
              status: 'active',
              paymentStatus: 'pending',            
              isKeyDepositPaid: true
            });
            results.successful.push({
              studentName: student.name,
              bookingId: booking.bookingId,
              transactionId: transaction.transactionId,
              seatNumber: seat.number,
              totalPrice,
              userId: user._id
            });
        }
        }

      } catch (error) {
        console.error(`Error processing student ${student.name}:`, error);
        results.failed.push({
          studentName: student.name,
          error: error.message || 'Unknown error occurred'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: results,
      message: `Processed ${results.successful.length} successful and ${results.failed.length} failed bookings`
    });

  } catch (error) {
    console.error('Bulk booking creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get bulk booking status
// @route   GET /api/admin/bookings/status/:batchId
// @access  Private/Admin
exports.getBulkBookingStatus = async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // This would typically track batch operations
    // For now, return a simple status
    res.status(200).json({
      success: true,
      data: {
        batchId,
        status: 'completed',
        processedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Get bulk booking status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Generate bulk booking report
// @route   POST /api/admin/bookings/generate-report
// @access  Private/Admin
exports.generateBulkBookingReport = async (req, res) => {
  try {
    const { bookingIds } = req.body;

    if (!bookingIds || !Array.isArray(bookingIds)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide booking IDs array'
      });
    }

    // Get booking details with user and seat information
    const bookings = await Booking.find({ bookingId: { $in: bookingIds } })
      .populate('userId', 'name email phone profilePicture')
      .populate('seatId', 'number')
      .populate('cabinId', 'name');

    const report = bookings.map(booking => ({
      bookingId: booking.bookingId,
      studentName: booking.userId.name,
      email: booking.userId.email,
      phone: booking.userId.phone,
      cabinName: booking.cabinId.name,
      seatNumber: booking.seatId.number,
      startDate: booking.startDate,
      endDate: booking.endDate,
      duration: booking.months,
      totalPrice: booking.totalPrice,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt
    }));

    res.status(200).json({
      success: true,
      data: report,
      message: 'Report generated successfully'
    });

  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
