const Booking = require('../models/Booking');
const User = require('../models/User');
const Seat = require('../models/Seat');
const Cabin = require('../models/Cabin');
const Transaction = require('../models/Transaction');
const { default: mongoose } = require('mongoose');
const DepositRefund = require('../models/DepositRefund');
// @desc    Get all bookings (admin)
// @route   GET /api/admin/bookings
// @access  Private/Admin
exports.getAllBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      bookingStatus,
      paymentStatus,
      search,
      order = 'desc',
      startDate,
      endDate,
      cabinId,
      userId,
      sortBy = 'updatedAt'
    } = req.query;

    const matchStage = {};

    // Direct filters
    if (status && status !='all'){
      matchStage.status = status
    };
    if (bookingStatus) matchStage.bookingStatus = bookingStatus;
    if (paymentStatus) matchStage.paymentStatus = paymentStatus;
    if (cabinId) matchStage.cabinId = new mongoose.Types.ObjectId(cabinId);
    if (userId) matchStage.userId = new mongoose.Types.ObjectId(userId);


    // Date range
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) matchStage.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    // Role-based access
    if (req.user.role !== 'admin') {
      var vendorId = req.user.vendorId;
      const cabins = await Cabin.find({ vendorId: vendorId }, '_id');
      const cabinIds = cabins.map(c => c._id);
      matchStage.cabinId = { $in: cabinIds };
    }

    // Aggregation pipeline
    const pipeline = [
      { $match: matchStage },

      // Lookups (populates)
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId'
        }
      },
      { $unwind: '$userId' },

      {
        $lookup: {
          from: 'coupons',
          localField: 'appliedCoupon.couponId',
          foreignField: '_id',
          as: 'couponDetails'
        }
      },
      { $unwind: { path: '$couponDetails', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'cabins',
          localField: 'cabinId',
          foreignField: '_id',
          as: 'cabinId'
        }
      },
      { $unwind: '$cabinId' },

      // Step 1: Unwind transferredHistory
      { $unwind: { path: '$transferredHistory', preserveNullAndEmptyArrays: true } },

      // Step 2: Lookup Cabin
      {
        $lookup: {
          from: 'cabins',
          localField: 'transferredHistory.cabinId',
          foreignField: '_id',
          as: 'cabinLookup'
        }
      },
      { $unwind: { path: '$cabinLookup', preserveNullAndEmptyArrays: true } },

      // Step 3: Lookup Seat
      {
        $lookup: {
          from: 'seats',
          localField: 'transferredHistory.seatId',
          foreignField: '_id',
          as: 'seatLookup'
        }
      },
      { $unwind: { path: '$seatLookup', preserveNullAndEmptyArrays: true } },

      // Step 4: Lookup User
      {
        $lookup: {
          from: 'users',
          localField: 'transferredHistory.transferredBy',
          foreignField: '_id',
          as: 'userLookup'
        }
      },
      { $unwind: { path: '$userLookup', preserveNullAndEmptyArrays: true } },

      // Step 5: Add fields to transferredHistory
      {
        $addFields: {
          'transferredHistory.cabin': '$cabinLookup',
          'transferredHistory.seat': '$seatLookup',
          'transferredHistory.transferredBy': '$userLookup'
        }
      },

      // Step 6: Remove temporary fields
      {
        $project: {
          cabinLookup: 0,
          seatLookup: 0,
          userLookup: 0
        }
      },

      // Step 7: Group back the history
      {
        $group: {
          _id: '$_id',
          doc: { $first: '$$ROOT' },
          transferredHistory: { $push: '$transferredHistory' }
        }
      },

      // Step 8: Reconstruct final object
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$doc', { transferredHistory: '$transferredHistory' }]
          }
        }
      },
      {
        $lookup: {
          from: 'seats',
          localField: 'seatId',
          foreignField: '_id',
          as: 'seatId'
        }
      },
      { $unwind: '$seatId' },

      {
        $project: {
          'bookingId':1,
          'payoutStatus':1,
          'bookingDuration':1,
          'bookingStatus':1,
          'cabinId._id': 1,
          'cabinId.name': 1,
          'cabinId.cabinCode': 1,
          'endDate': 1,
          'startDate': 1,
          'seatPrice': 1,
          'status': 1,
          'totalPrice': 1,
          'originalPrice': 1,
          'userId._id': 1,
          'userId.name': 1,
          'userId.email': 1,
          'userId.userId': 1,
          'userId.profilePicture': 1,
          'seatId.number': 1,
          'seatId._id': 1,
          'createdAt': 1,
          'transferredHistory.cabin.name':1,
          'transferredHistory.cabin._id':1,
          'transferredHistory.cabin.cabinCode':1,
          'transferredHistory.seat._id':1,
          'transferredHistory.seat.number':1,
          'transferredHistory.transferredBy.name':1,
          'transferredHistory.transferredBy.email':1,
          'transferredHistory.transferredAt':1,
          'couponDetails.code':1,
          'couponDetails.name':1,
          'couponDetails.type':1,
          'couponDetails.value':1,
          'couponDetails.description':1,
          'appliedCoupon':1
        }
      },

      // Optional search filter
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { bookingId: new RegExp(search, 'i') },
                  { 'userId.name': new RegExp(search, 'i') },
                  { 'userId.email': new RegExp(search, 'i') },
                  { 'userId.phone': new RegExp(search, 'i') },
                  { 'userId.userId': new RegExp(search, 'i') },
                  { 'cabinId.name': new RegExp(search, 'i') },
                  { 'cabinId.cabinCode': new RegExp(search, 'i') }
                ]
              }
            }
          ]
        : []),

      // Sorting
      {
        $sort: {
          [sortBy]: order === 'asc' ? 1 : -1
        }
      },

      // Pagination
      {
        $facet: {
          data: [
            { $skip: (page - 1) * limit },
            { $limit: limit * 1 }
          ],
          total: [{ $count: 'count' }]
        }
      }
    ];

    const result = await Booking.aggregate(pipeline);
    const bookings = result[0].data;
    const totalDocs = result[0].total[0]?.count || 0;

    res.json({
      success: true,
      count: bookings.length,
      totalDocs,
      totalPages: Math.ceil(totalDocs / limit),
      currentPage: Number(page),
      data: bookings
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get single booking (admin)
// @route   GET /api/admin/bookings/:id
// @access  Private/Admin
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('cabinId', 'name category cabinCode')
      .populate('seatId', 'number price')
      .populate('userId', 'name email phone profilePicture')
      .populate('appliedCoupon.couponId', 'code name type value description')
      .populate('transferredHistory.cabinId', 'name category cabinCode')
      .populate('transferredHistory.seatId', 'number price')
      .populate('transferredHistory.transferredBy', 'name email phone profilePicture');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
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

// @desc    Update booking (admin)
// @route   PUT /api/admin/bookings/:id
// @access  Private/Admin
exports.updateBooking = async (req, res) => {
  try {
    const { paymentStatus, status, startDate, endDate, months, totalPrice } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update fields if provided
    if (paymentStatus) booking.paymentStatus = paymentStatus;
    if (status) booking.status = status;
    if (startDate) booking.startDate = startDate;
    if (endDate) booking.endDate = endDate;
    if (months) booking.months = months;
    if (totalPrice) booking.totalPrice = totalPrice;

    await booking.save();

    res.status(200).json({
      success: true,
      data: booking,
      message: 'Booking updated successfully'
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};


// @desc    Update booking (admin)
// @route   PUT /api/admin/bookings/:id
// @access  Private/Admin
exports.updateTransferBooking = async (req, res) => {
  try {

    const { cabinId, seatId } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!cabinId && !seatId) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    // Add renewal record to history
    booking.transferredHistory.push({
      cabinId: booking.cabinId,
      seatId: booking.seatId,
      transferredAt: new Date(),
      transferredBy: req.user.id
    });
    booking.bookingStatus = 'transferred'

    if (cabinId) booking.cabinId = cabinId;
    if (seatId) booking.seatId = seatId;

    // Initialize renewal history if it doesn't exist
    if (!booking.transferredHistory) {
      booking.transferredHistory = [];
    }

    await booking.save();

    res.status(200).json({
      success: true,
      data: booking,
      message: 'Booking updated successfully'
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
// @desc    Cancel booking (admin)
// @route   POST /api/admin/bookings/:id/cancel
// @access  Private/Admin
exports.cancelBookingByAdmin = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Free up the seat
    if (booking.seatId) {
      await Seat.findByIdAndUpdate(booking.seatId, { isAvailable: true });
    }

    // Delete the booking
    await Booking.findByIdAndDelete(req.params.id);

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

// @desc    Get booking reports (admin)
// @route   GET /api/admin/bookings/reports
// @access  Private/Admin
exports.getBookingReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const queryOptions = {};

    // Date range filtering
    if (startDate || endDate) {
      queryOptions.createdAt = {};
      if (startDate) queryOptions.createdAt.$gte = new Date(startDate);
      if (endDate) queryOptions.createdAt.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(queryOptions);

    // Calculate statistics
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.paymentStatus === 'completed').length;
    const pendingBookings = bookings.filter(b => b.paymentStatus === 'pending').length;
    const failedBookings = bookings.filter(b => b.paymentStatus === 'failed').length;

    // Calculate total revenue
    const totalRevenue = bookings
      .filter(b => b.paymentStatus === 'completed')
      .reduce((sum, booking) => sum + booking.totalPrice, 0);

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        completedBookings,
        pendingBookings,
        failedBookings,
        totalRevenue
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

// @desc    Get booking statistics (admin)
// @route   GET /api/admin/bookings/statistics
// @access  Private/Admin
exports.getBookingStatistics = async (req, res) => {
  try {
    const { timeRange = 'monthly' } = req.query;

    let dateFormat;
    let groupBy;

    // Set date format based on time range
    switch (timeRange) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        groupBy = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } };
        break;
      case 'weekly':
        dateFormat = '%Y-W%U';
        groupBy = { year: { $year: '$createdAt' }, week: { $week: '$createdAt' } };
        break;
      case 'yearly':
        dateFormat = '%Y';
        groupBy = { year: { $year: '$createdAt' } };
        break;
      case 'monthly':
      default:
        dateFormat = '%Y-%m';
        groupBy = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
    }

    // Aggregate bookings by time period
    const bookingStats = await Booking.aggregate([
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'completed'] }, '$totalPrice', 0]
            }
          },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'completed'] }, 1, 0]
            }
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0]
            }
          },
          failed: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'failed'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);

    res.status(200).json({
      success: true,
      timeRange,
      data: bookingStats
    });
  } catch (error) {
    console.error('Get booking statistics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get occupancy rates (admin)
// @route   GET /api/admin/bookings/occupancy
// @access  Private/Admin
exports.getOccupancyRates = async (req, res) => {
  try {
    const { timeframe = 'weekly', startDate, endDate, cabinId } = req.query;

    // Query to find all active cabins
    var cabinsQuery = null;

    if (req.user.role !== 'admin') {
      cabinsQuery = cabinId ? { _id: cabinId, isActive: true, vendorId: req.user.vendorId, } : { vendorId: req.user.vendorId, isActive: true };
    } else {
      cabinsQuery = cabinId ? { _id: cabinId, isActive: true } : { isActive: true };
    }

    const cabins = await Cabin.find(cabinsQuery);

    if (!cabins.length) {
      return res.status(200).json({
        success: true,
        data: {
          cabins: [],
          overall: {
            totalSeats: 0,
            occupiedSeats: 0,
            availableSeats: 0,
            occupancyRate: 0
          },
          trend: []
        }
      });
    }

    // Get all seats grouped by cabin
    const allSeats = await Seat.find({
      cabinId: { $in: cabins.map(cabin => cabin._id) }
    });

    // Current date range for bookings
    const now = new Date();
    const queryDateStart = startDate ? new Date(startDate) : new Date(now.setDate(now.getDate() - 30));
    const queryDateEnd = endDate ? new Date(endDate) : new Date();

    // Find active bookings
    const activeBookings = await Booking.find({
      endDate: { $gte: now },
      paymentStatus: 'completed',
    }).populate('seatId').populate('cabinId', 'name category cabinCode')

    // Process data for each cabin
    const cabinsData = [];
    let totalSeats = 0;
    let totalOccupiedSeats = 0;

    for (const cabin of cabins) {
      const cabinSeats = allSeats.filter(seat => seat.cabinId.toString() === cabin._id.toString());
      const cabinBookings = activeBookings.filter(booking =>
        booking.cabinId && booking.cabinId._id.toString() === cabin._id.toString()
      );

      // Count distinct booked seats (in case of overlapping bookings)
      const bookedSeatIds = new Set();
      cabinBookings.forEach(booking => {
        if (booking.seatId) {
          bookedSeatIds.add(booking.seatId._id.toString());
        }
      });

      const seatsCount = cabinSeats.length;
      const occupiedSeats = bookedSeatIds.size;
      const availableSeats = Math.max(0, seatsCount - occupiedSeats);
      const occupancyRate = seatsCount > 0 ? (occupiedSeats / seatsCount) * 100 : 0;

      // Count pending bookings for this cabin
      const pendingBookings = await Booking.countDocuments({
        cabinId: cabin._id,
        paymentStatus: 'pending',
        endDate: { $gte: now }
      });

      cabinsData.push({
        cabinId: cabin._id,
        cabinName: cabin.name,
        category: cabin.category,
        totalSeats: seatsCount,
        occupiedSeats,
        availableSeats,
        occupancyRate,
        pendingBookings
      });

      totalSeats += seatsCount;
      totalOccupiedSeats += occupiedSeats;
    }

    // Calculate overall statistics
    const overallAvailableSeats = Math.max(0, totalSeats - totalOccupiedSeats);
    const overallOccupancyRate = totalSeats > 0 ? (totalOccupiedSeats / totalSeats) * 100 : 0;

    // Generate trend data
    const trendData = [];

    // Simple trend data generation for now - in a real app this would be more sophisticated
    // and based on historical bookings
    if (timeframe === 'daily') {
      // Last 24 hours in hourly intervals
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        trendData.push({
          time: `${hour}:00`,
          occupancyRate: 70 + Math.sin(i * 0.5) * 10 // Generate a wave pattern
        });
      }
    } else if (timeframe === 'weekly') {
      // Days of the week
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      days.forEach((day, i) => {
        trendData.push({
          day,
          occupancyRate: 65 + Math.sin(i) * 15
        });
      });
    } else {
      // Monthly - last 30 days
      for (let i = 1; i <= 30; i++) {
        trendData.push({
          date: i.toString(),
          occupancyRate: 65 + Math.sin(i * 0.2) * 20
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        cabins: cabinsData,
        overall: {
          totalSeats,
          occupiedSeats: totalOccupiedSeats,
          availableSeats: overallAvailableSeats,
          occupancyRate: overallOccupancyRate
        },
        trend: trendData
      }
    });
  } catch (error) {
    console.error('Get occupancy rates error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};


// @desc    Get revenue reports (admin)
// @route   GET /api/admin/bookings/revenue
// @access  Private/Admin
exports.getRevenueByTransaction = async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Financial year from April 1 (month 3) to March 31 (month 2 of next year)
    const fyStart = new Date(currentMonth >= 3 ? currentYear : currentYear - 1, 3, 1);
    const fyEnd = new Date(currentMonth >= 3 ? currentYear + 1 : currentYear, 2, 31, 23, 59, 59, 999);

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);


    var allowedVendorIds = [];
    if (req.user.role !== 'admin') {
      allowedVendorIds = [req.user.vendorId];
    }

    const result = await Transaction.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $lookup: {
          from: 'bookings',
          localField: 'bookingId',
          foreignField: '_id',
          as: 'booking'
        }
      },
      { $unwind: '$booking' },
      {
        $lookup: {
          from: 'cabins',
          localField: 'booking.cabinId',
          foreignField: '_id',
          as: 'cabin'
        }
      },
      { $unwind: '$cabin' },
      {
         $match: {
          'cabin.vendorId': req.user.role === 'admin' ? { $exists: true } : { $in: allowedVendorIds }
        }
      },
      {
        $facet: {
          totalRevenue: [
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' }
              }
            }
          ],
          todayRevenue: [
            {
              $match: {
                createdAt: { $gte: todayStart, $lte: todayEnd }
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' }
              }
            }
          ],
          financialYearRevenue: [
            {
              $match: {
                createdAt: { $gte: fyStart, $lte: fyEnd }
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' }
              }
            }
          ]
        }
      }
    ]);

    const format = (arr) => (arr.length > 0 ? arr[0].total : 0);

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: format(result[0].totalRevenue),
        todayRevenue: format(result[0].todayRevenue),
        financialYearRevenue: format(result[0].financialYearRevenue)
      }
    });
  } catch (error) {
    console.error('Get revenue reports error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};


exports.getAllTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      bookingStatus,
      paymentStatus,
      search,
      order = 'desc',
      startDate,
      endDate,
      cabinId,
      userId,
      sortBy = 'updatedAt'
    } = req.query;

    const matchStage = {};

    // Direct filters
    if (status && status !='all'){
      matchStage.status = status
    };
    if (bookingStatus) matchStage.bookingStatus = bookingStatus;
    if (paymentStatus) matchStage.paymentStatus = paymentStatus;
    if (cabinId) matchStage.cabinId = new mongoose.Types.ObjectId(cabinId);
    if (userId) matchStage.userId = new mongoose.Types.ObjectId(userId);

    // Date range
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) matchStage.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    // Role-based access
    if (req.user.role !== 'admin') {
      var vendorId = req.user.vendorId;
      // const cabins = await Cabin.find({ vendorId: vendorId }, '_id');
      // const cabinIds = cabins.map(c => c._id);
      matchStage.cabinId.vendorId = vendorId;
    }

    // Aggregation pipeline
    const pipeline = [
      { $match: matchStage },

      // Lookups (populates)
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId'
        }
      },
      { $unwind: '$userId' },

      {
        $lookup: {
          from: 'cabins',
          localField: 'cabinId',
          foreignField: '_id',
          as: 'cabinId'
        }
      },
      { $unwind: '$cabinId' },

      // Step 1: Unwind transferredHistory
      { $unwind: { path: '$transferredHistory', preserveNullAndEmptyArrays: true } },

      // Step 2: Lookup Cabin
      {
        $lookup: {
          from: 'cabins',
          localField: 'transferredHistory.cabinId',
          foreignField: '_id',
          as: 'cabinLookup'
        }
      },
      { $unwind: { path: '$cabinLookup', preserveNullAndEmptyArrays: true } },

      // Step 3: Lookup Seat
      {
        $lookup: {
          from: 'seats',
          localField: 'transferredHistory.seatId',
          foreignField: '_id',
          as: 'seatLookup'
        }
      },
      { $unwind: { path: '$seatLookup', preserveNullAndEmptyArrays: true } },

      // Step 4: Lookup User
      {
        $lookup: {
          from: 'users',
          localField: 'transferredHistory.transferredBy',
          foreignField: '_id',
          as: 'userLookup'
        }
      },
      { $unwind: { path: '$userLookup', preserveNullAndEmptyArrays: true } },

      // Step 5: Add fields to transferredHistory
      {
        $addFields: {
          'transferredHistory.cabin': '$cabinLookup',
          'transferredHistory.seat': '$seatLookup',
          'transferredHistory.transferredBy': '$userLookup'
        }
      },

      // Step 6: Remove temporary fields
      {
        $project: {
          cabinLookup: 0,
          seatLookup: 0,
          userLookup: 0
        }
      },

      // Step 7: Group back the history
      {
        $group: {
          _id: '$_id',
          doc: { $first: '$$ROOT' },
          transferredHistory: { $push: '$transferredHistory' }
        }
      },

      // Step 8: Reconstruct final object
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$doc', { transferredHistory: '$transferredHistory' }]
          }
        }
      },
      {
        $lookup: {
          from: 'seats',
          localField: 'seatId',
          foreignField: '_id',
          as: 'seatId'
        }
      },
      { $unwind: '$seatId' },

      {
        $project: {
          'bookingId':1,
          'bookingDuration':1,
          'bookingStatus':1,
          'cabinId._id': 1,
          'cabinId.name': 1,
          'cabinId.cabinCode': 1,
          'endDate': 1,
          'startDate': 1,
          'seatPrice': 1,
          'status': 1,
          'totalPrice': 1,
          'userId._id': 1,
          'userId.name': 1,
          'userId.email': 1,
          'userId.userId': 1,
          'userId.profilePicture': 1,
          'seatId.number': 1,
          'seatId._id': 1,
          'createdAt': 1,
          'transferredHistory.cabin.name':1,
          'transferredHistory.cabin._id':1,
          'transferredHistory.cabin.cabinCode':1,
          'transferredHistory.seat._id':1,
          'transferredHistory.seat.number':1,
          'transferredHistory.transferredBy.name':1,
          'transferredHistory.transferredBy.email':1,
          'transferredHistory.transferredAt':1
        }
      },

      // Optional search filter
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { bookingId: new RegExp(search, 'i') },
                  { 'userId.name': new RegExp(search, 'i') },
                  { 'userId.email': new RegExp(search, 'i') },
                  { 'userId.phone': new RegExp(search, 'i') },
                  { 'userId.userId': new RegExp(search, 'i') },
                  { 'cabinId.name': new RegExp(search, 'i') },
                  { 'cabinId.cabinCode': new RegExp(search, 'i') }
                ]
              }
            }
          ]
        : []),

      // Sorting
      {
        $sort: {
          [sortBy]: order === 'asc' ? 1 : -1
        }
      },

      // Pagination
      {
        $facet: {
          data: [
            { $skip: (page - 1) * limit },
            { $limit: limit * 1 }
          ],
          total: [{ $count: 'count' }]
        }
      }
    ];

    const result = await Booking.aggregate(pipeline);
    const bookings = result[0].data;
    const totalDocs = result[0].total[0]?.count || 0;

    res.json({
      success: true,
      count: bookings.length,
      totalDocs,
      totalPages: Math.ceil(totalDocs / limit),
      currentPage: Number(page),
      data: bookings
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
// @desc    Get revenue reports (admin)
// @route   GET /api/admin/bookings/revenue
// @access  Private/Admin
exports.getRevenueReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build $match stage
    // const matchStage = {
    //   paymentStatus: 'completed'
    // };

    // // Apply date range to paymentDate
    // if (startDate || endDate) {
    //   matchStage.createdAt = {};
    //   if (startDate) matchStage.createdAt.$gte = new Date(startDate + 'T00:00:00.000Z');
    //   if (endDate) matchStage.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    // }

    // // Only include vendor's cabins if not admin
    // if (req.user.role !== 'admin') {
    //   matchStage['cabin.vendorId'] = new mongoose.Types.ObjectId(req.user.vendorId);
    // }

    // const bookings = await Booking.aggregate([
    //   {
    //     $lookup: {
    //       from: 'cabins',
    //       localField: 'cabinId',
    //       foreignField: '_id',
    //       as: 'cabin'
    //     }
    //   },
    //   { $unwind: '$cabin' },
    //   {
    //     $match: matchStage
    //   },
    //   {
    //     $project: {
    //       totalPrice: 1,
    //       paymentDate: 1,
    //       'cabin.category': 1
    //     }
    //   }
    // ]);

     const now = new Date();

    var todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    var todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    if (startDate || endDate) {
      todayStart = new Date(startDate + 'T00:00:00.000Z');
      todayEnd = new Date(endDate + 'T23:59:59.999Z');
    }
    const isAdmin = req.user.role === 'admin';

      var allowedVendorIds = [];
      if (req.user.role !== 'admin') {
        allowedVendorIds = [req.user.vendorId];
      }

      const pipeline = [
    {
      $match: { status: 'completed' }
    },
    {
      $lookup: {
        from: 'bookings',
        localField: 'bookingId',
        foreignField: '_id',
        as: 'booking'
      }
    },
    { $unwind: '$booking' },
    {
      $lookup: {
        from: 'cabins',
        localField: 'booking.cabinId',
        foreignField: '_id',
        as: 'cabin'
      }
    },
    { $unwind: '$cabin' }
  ];

  // ✅ Apply vendor filter only for non-admin users
  if (!isAdmin) {
    pipeline.push({
      $match: {
        'cabin.vendorId': { $in: allowedVendorIds }
      }
    });
  }

  // ✅ Final facet for today's revenue
  pipeline.push({
    $facet: {
      todayRevenue: [
        {
          $match: {
            createdAt: { $gte: todayStart, $lte: todayEnd }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]
    }
  });

  const result = await Transaction.aggregate(pipeline);

    // Compute total revenue
    // const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);

    // // Group revenue by cabin category
    // const revenueByCategory = {};
    // for (const booking of bookings) {
    //   const category = booking.cabin?.category || 'Uncategorized';
    //   revenueByCategory[category] = (revenueByCategory[category] || 0) + (booking.totalPrice || 0);
    // }
    const format = (arr) => (arr.length > 0 ? arr[0].total : 0);
    const count = (arr) => (arr.length > 0 ? arr[0].count : 0);
    res.status(200).json({
      success: true,
      data: {
        totalRevenue:format(result[0].todayRevenue),
        bookingCount:count(result[0].todayRevenue),
        revenueByCategory:[],
      }
    });
  } catch (error) {
    console.error('Get revenue reports error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get expiring bookings (admin)
// @route   GET /api/admin/bookings/expiring
// @access  Private/Admin
exports.getExpiringBookings = async (req, res) => {
  try {
    const { daysThreshold = 7 } = req.query;
    const thresholdDays = parseInt(daysThreshold) || 7;

    // Calculate the date that's X days from now
    const now = new Date();
    var thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() + thresholdDays);

    if (daysThreshold == 1) {
      thresholdDate = new Date();
    }
    thresholdDate.setUTCHours(23, 59, 59, 999);
    const bookingQuery = {
      endDate: {
        $gte: now,
        $lte: thresholdDate
      },
      paymentStatus: 'completed',
    };

    // If user is not admin, filter by cabins they manage
    if (req.user.role !== 'admin') {
      const managedCabins = await Cabin.find({ vendorId: req.user.vendorId }, '_id');
      const cabinIds = managedCabins.map(c => c._id);

      bookingQuery.cabinId = { $in: cabinIds };
    }

    // Find bookings that will expire within the threshold period
    const bookings = await Booking.find(bookingQuery)
      .populate('cabinId', 'name category price cabinCode')
      .populate('seatId', 'number isAvailable')
      .populate('appliedCoupon.couponId', 'code name type value description')
      .populate('userId', 'name email phone userId profilePicture')
      .sort({ endDate: 1 }); // Sort by the ones expiring sooner

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Get expiring bookings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get top filling rooms (admin)
// @route   GET /api/admin/bookings/top-filling-rooms
// @access  Private/Admin
exports.getTopFillingRooms = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const limitValue = parseInt(limit) || 5;

    // let cabins;
    // // Get all cabins
    // if (req.user.role === 'admin') {
    //   cabins = await Cabin.find({ isActive: true });
    // } else {
    //   cabins = await Cabin.find({
    //     isActive: true,
    //     vendorId: req.user.vendorId
    //   });
    // }

    // // For each cabin, get seat occupancy data
    // const cabinOccupancyData = [];

    // for (const cabin of cabins) {
    //   // Get all seats for this cabin
    //   const totalSeats = await Seat.countDocuments({ cabinId: cabin._id });

    //   if (totalSeats === 0) continue; // Skip cabins with no seats

    //   // Count booked seats (not available)
    //   // const bookedSeats = cabinSeats.filter(seat => !seat.isAvailable).length;
    //   const today = new Date();
    //   today.setUTCHours(0, 0, 0, 0);
    //   const bookingQuery = {
    //     status: { $ne: 'cancelled' },
    //     paymentStatus: { $in: ['completed', 'pending'] },
    //     // bookingStatus:'active',
    //     cabinId:cabin._id,
    //     endDate: { $gte: today }
    //   };
      
    //   const bookedSeats = await Booking.countDocuments(bookingQuery);

    //   // Calculate occupancy rate
    //   const occupancyRate = Math.round((bookedSeats / totalSeats) * 100);

    //   cabinOccupancyData.push({
    //     id: cabin._id,
    //     name: cabin.name,
    //     category: cabin.category,
    //     occupancyRate,
    //     totalSeats,
    //     bookedSeats
    //   });
    // }
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Filter cabins based on role
    const cabinMatchQuery = req.user.role === 'admin'
      ? { isActive: true }
      : { isActive: true, vendorId: req.user.vendorId };

    const cabinOccupancyData = await Cabin.aggregate([
      { $match: cabinMatchQuery },
      {
        $lookup: {
          from: 'seats',
          localField: '_id',
          foreignField: 'cabinId',
          as: 'seats'
        }
      },
      {
        $lookup: {
          from: 'bookings',
          let: { cabinId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$cabinId', '$$cabinId'] },
                    { $gte: ['$endDate', today] },
                    { $in: ['$paymentStatus', ['completed', 'pending']] },
                    { $ne: ['$status', 'cancelled'] }
                  ]
                }
              }
            }
          ],
          as: 'activeBookings'
        }
      },
      {
        $addFields: {
          totalSeats: { $size: '$seats' },
          bookedSeats: { $size: '$activeBookings' },
        }
      },
      {
        $addFields: {
          occupancyRate: {
            $cond: [
              { $eq: ['$totalSeats', 0] },
              0,
              {
                $round: [
                  { $multiply: [{ $divide: ['$bookedSeats', '$totalSeats'] }, 100] },
                  0
                ]
              }
            ]
          }
        }
      },
      {
        $project: {
          id: '$_id',
          name: 1,
          category: 1,
          occupancyRate: 1,
          totalSeats: 1,
          bookedSeats: 1
        }
      }
    ]);


    // Sort by occupancy rate (highest first) and limit results
    const topFillingRooms = cabinOccupancyData
      .sort((a, b) => b.occupancyRate - a.occupancyRate)
      .slice(0, limitValue);

    res.status(200).json({
      success: true,
      data: topFillingRooms
    });
  } catch (error) {
    console.error('Get top filling rooms error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get monthly revenue (admin)
// @route   GET /api/admin/bookings/monthly-revenue
// @access  Private/Admin
exports.getMonthlyRevenue = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const yearValue = parseInt(year) || new Date().getFullYear();

    var todayStart = new Date(`${yearValue}-01-01T00:00:00.000Z`);
    var todayEnd = new Date(`${yearValue}-12-31T23:59:59.999Z`)

    const isAdmin = req.user.role === 'admin';

      var allowedVendorIds = [];
      if (req.user.role !== 'admin') {
        allowedVendorIds = [req.user.vendorId];
      }

      const pipeline = [
    {
      $match: { status: 'completed', createdAt: { $gte: todayStart, $lte: todayEnd }}
    },
    {
      $lookup: {
        from: 'bookings',
        localField: 'bookingId',
        foreignField: '_id',
        as: 'booking'
      }
    },
    { $unwind: '$booking' },
    {
      $lookup: {
        from: 'cabins',
        localField: 'booking.cabinId',
        foreignField: '_id',
        as: 'cabin'
      }
    },
    { $unwind: '$cabin' }
  ];

  // ✅ Apply vendor filter only for non-admin users
  if (!isAdmin) {
    pipeline.push({
      $match: {
        'cabin.vendorId': { $in: allowedVendorIds }
      }
    });
  }

  // ✅ Final facet for today's revenue
  pipeline.push(
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.month": 1 } },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          revenue: 1,
          count: 1
        }
      });

  const monthlyRevenue = await Transaction.aggregate(pipeline);

    // const monthlyRevenue = await Booking.aggregate([
    //   { $match: matchStage },
    //   {
    //     $group: {
    //       _id: { month: { $month: "$createdAt" } },
    //       revenue: { $sum: "$totalPrice" },
    //       count: { $sum: 1 }
    //     }
    //   },
    //   { $sort: { "_id.month": 1 } },
    //   {
    //     $project: {
    //       _id: 0,
    //       month: "$_id.month",
    //       revenue: 1,
    //       count: 1
    //     }
    //   }
    // ]);

    // Format the response to include all months (even those with zero revenue)
    const formattedMonthlyRevenue = [];
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    for (let month = 1; month <= 12; month++) {
      const monthData = monthlyRevenue.find(m => m.month === month);
      formattedMonthlyRevenue.push({
        month,
        monthName: monthNames[month - 1],
        revenue: monthData ? monthData.revenue : 0,
        bookingCount: monthData ? monthData.count : 0
      });
    }

    res.status(200).json({
      success: true,
      data: formattedMonthlyRevenue,
      totalYearlyRevenue: formattedMonthlyRevenue.reduce((sum, month) => sum + month.revenue, 0)
    });
  } catch (error) {
    console.error('Get monthly revenue error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get monthly occupancy (admin)
// @route   GET /api/admin/bookings/monthly-occupancy
// @access  Private/Admin
exports.getMonthlyOccupancy = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const yearValue = parseInt(year) || new Date().getFullYear();

    const matchStage = {
      createdAt: {
        $gte: new Date(`${yearValue}-01-01T00:00:00.000Z`),
        $lte: new Date(`${yearValue}-12-31T23:59:59.999Z`)
      }
    };

    if (req.user.role !== 'admin') {
      // Get cabins managed by current user
      const managedCabins = await Cabin.find({ managerId: req.user._id }, '_id');
      const cabinIds = managedCabins.map(c => c._id);
      matchStage.cabinId = { $in: cabinIds };
    }

    // Get monthly booking data and total available seats
    const [monthlyData, totalSeatsData] = await Promise.all([
      Booking.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { month: { $month: "$createdAt" } },
            totalBookings: { $sum: 1 },
            uniqueSeats: { $addToSet: "$seatId" }
          }
        },
        {
          $project: {
            month: "$_id.month",
            totalBookings: 1,
            occupiedSeats: { $size: "$uniqueSeats" },
            _id: 0
          }
        },
        { $sort: { month: 1 } }
      ]),
      // Get total available seats across all cabins
      Cabin.aggregate([
        ...(req.user.role !== 'admin' ? [{ $match: { managerId: req.user._id } }] : []),
        {
          $lookup: {
            from: 'seats',
            localField: '_id',
            foreignField: 'cabinId',
            as: 'seats'
          }
        },
        {
          $group: {
            _id: null,
            totalSeats: { $sum: { $size: "$seats" } }
          }
        }
      ])
    ]);

    const totalAvailableSeats = totalSeatsData[0]?.totalSeats || 100; // fallback

    // Format the response to include all months
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const formattedMonthlyOccupancy = [];
    for (let month = 1; month <= 12; month++) {
      const monthData = monthlyData.find(m => m.month === month);
      const occupiedSeats = monthData ? monthData.occupiedSeats : 0;
      const occupancyRate = totalAvailableSeats > 0 ? Math.round((occupiedSeats / totalAvailableSeats) * 100) : 0;

      formattedMonthlyOccupancy.push({
        month,
        monthName: monthNames[month - 1],
        occupancyRate,
        occupiedSeats,
        totalSeats: totalAvailableSeats,
        totalBookings: monthData ? monthData.totalBookings : 0
      });
    }

    res.status(200).json({
      success: true,
      data: formattedMonthlyOccupancy,
      averageOccupancy: Math.round(
        formattedMonthlyOccupancy.reduce((sum, month) => sum + month.occupancyRate, 0) / 12
      )
    });
  } catch (error) {
    console.error('Get monthly occupancy error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
// @desc    Get active residents count
// @route   GET /api/admin/bookings/active-residents
// @access  Private/Admin
exports.getActiveResidents = async (req, res) => {
  try {
    const currentDate = new Date();
    
    // Get current active bookings
    const activeBookings = await Booking.countDocuments({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
      status: { $in: ['active', 'confirmed','completed'] }
    });
    
    // Get total seat capacity
    const totalSeats = await Seat.countDocuments({ isAvailable: true });
    
    // Calculate occupancy percentage
    const occupancyPercentage = totalSeats > 0 ? Math.round((activeBookings / totalSeats) * 100) : 0;
    
    res.json({
      success: true,
      data: {
        activeResidents: activeBookings,
        totalCapacity: totalSeats,
        occupancyPercentage,
        // residents: activeBookings.map(booking => ({
        //   id: booking._id,
        //   name: booking.userId?.name || 'Unknown',
        //   email: booking.userId?.email || '',
        //   phone: booking.userId?.phone || '',
        //   startDate: booking.startDate,
        //   endDate: booking.endDate,
        //   seatId: booking.seatId,
        //   cabinId: booking.cabinId
        // }))
      }
    });
  } catch (error) {
    console.error('Error fetching active residents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active residents data',
      error: error.message
    });
  }
};
