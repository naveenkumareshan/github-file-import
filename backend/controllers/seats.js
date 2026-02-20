const Seat = require('../models/Seat');
const Cabin = require('../models/Cabin');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');

// @desc    Get all seats
// @route   GET /api/seats
// @access  Public
exports.getSeats = async (req, res) => {
  try {
    // Add query parameters for filtering
    const query = { ...req.query };
    
    const seats = await Seat.find(query);

    res.status(200).json({
      success: true,
      count: seats.length,
      data: seats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


// @desc    Get all seats
// @route   GET /api/seats
// @access  Public
exports.getSeatsAdmin = async (req, res) => {
  try {
    // Add query parameters for filtering
    const query = { ...req.query };
    
    if (req.user.role !== 'admin') {
      // Find cabin IDs owned by the current user
      const userCabins = await Cabin.find({ managerIds: req.user._id }, '_id');
      const cabinIds = userCabins.map(c => c._id);

      // Filter bookings to only those belonging to cabins owned by the user
      query.cabinId = { $in: cabinIds };
    }

    const seats = await Seat.find(query);

    res.status(200).json({
      success: true,
      count: seats.length,
      data: seats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all seats
// @route   GET /api/seats
// @access  Public
exports.getSeatsCount = async (req, res) => {
  try {
    const query = { ...req.query };
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const tenDaysLater = new Date(today);
    tenDaysLater.setDate(today.getDate() + 10);
    tenDaysLater.setUTCHours(23, 59, 59, 999);

    const bookingQuery = {
      status: { $ne: 'cancelled' },
      paymentStatus: { $in: ['completed', 'pending'] },
      startDate: { $lte: tenDaysLater },
      endDate: { $gte: today }
    };

    if (req.user.role !== 'admin') {
      const userCabins = await Cabin.find({ vendorId: req.user.vendorId }, { _id: 1 }).lean();
      const cabinIds = userCabins.map(c => c._id);
      query.cabinId = { $in: cabinIds };
      bookingQuery.cabinId = { $in: cabinIds };
    }

    const bookingsList = await Booking.find(bookingQuery, '_id seatId').lean();
    const seatIdIds = bookingsList
      .map(b => b.seatId)
      .filter(id => !!id); // remove nulls

    const seatQuery = {
      _id: { $in: seatIdIds },
      isAvailable: true
    };

    const seats = await Seat.countDocuments(seatQuery);

    res.status(200).json({
      success: true,
      count: seats,
      data: seats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get seats by cabin
// @route   GET /api/seats/cabin/:cabinId
// @access  Public
exports.getSeatsByCabin = async (req, res) => {
  try {

     const query = { cabinId:req.params.cabinId, floor:  req.params.floor};

    const seats = await Seat.find(query).lean();;

    if (req.query.includeBookingInfo === 'true') {
      const today = new Date();
      const seatIds = seats.map(seat => seat._id);

      const bookings = await Booking.find({
        seatId: { $in: seatIds },
        startDate: { $lte: today },
        endDate: { $gte: today },
        paymentStatus: { $in: ['completed', 'pending'] },
        status: { $ne: 'cancelled' }
      }).select('bookingId seatId startDate endDate status').lean();;

      // Group bookings by seatId
      const bookingMap = bookings.reduce((acc, booking) => {
        const key = booking.seatId.toString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(booking);
        return acc;
      }, {});

      const seatsWithBookings = seats.map(seat => {
        const seatBookings = bookingMap[seat._id.toString()] || [];

        return {
          ...seat,
          bookings: seatBookings,
          hasBooking: seatBookings.length > 0,
          isBookedToday: seatBookings.length > 0,
          unavailableUntil : seatBookings[0]?.endDate ?? seat.unavailableUntil,
          isAvailable: seat.isAvailable && seatBookings.length === 0
        };
      });

      return res.status(200).json({
        success: true,
        count: seatsWithBookings.length,
        data: seatsWithBookings
      });
    }

    res.status(200).json({
      success: true,
      count: seats.length,
      data: seats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get seats by cabin
// @route   GET /api/seats/cabin/:cabinId
// @access  Public
exports.getSeatsByCabinAdmin = async (req, res) => {
  try {

     const query = { ...req.query };

    if (req.user.role !== 'admin') {
      // Find cabin IDs owned by the current user
      const userCabins = await Cabin.find({ createdBy: req.user._id }, '_id');
      const cabinIds = userCabins.map(c => c._id);

      // Filter bookings to only those belonging to cabins owned by the user
      query.cabinId = { $in: cabinIds };
    }

    const seats = await Seat.find(query);

    // Optional: Include booking information if requested
    if (req.query.includeBookingInfo === 'true') {
      // You'd implement booking data fetching here
      // This is placeholder functionality
      const seatsWithBookings = seats.map(seat => ({
        ...seat.toObject(),
        bookings: [] // Would be populated with real booking data
      }));
      
      return res.status(200).json({
        success: true,
        count: seatsWithBookings.length,
        data: seatsWithBookings
      });
    }

    res.status(200).json({
      success: true,
      count: seats.length,
      data: seats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single seat
// @route   GET /api/seats/:id
// @access  Public
exports.getSeat = async (req, res) => {
  try {
    const seat = await Seat.findById(req.params.id);

    if (!seat) {
      return res.status(404).json({
        success: false,
        message: 'Seat not found'
      });
    }

    res.status(200).json({
      success: true,
      data: seat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new seat
// @route   POST /api/seats
// @access  Private/Admin
exports.createSeat = async (req, res) => {
  try {
    // Validate cabinId exists
    const cabin = await Cabin.findById(req.body.cabinId);
    if (!cabin) {
      return res.status(404).json({
        success: false,
        message: 'Cabin not found'
      });
    }
    
    const seat = await Seat.create(req.body);

    res.status(201).json({
      success: true,
      data: seat
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update seat
// @route   PUT /api/seats/:id
// @access  Private/Admin
exports.updateSeat = async (req, res) => {
  try {
    const seat = await Seat.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!seat) {
      return res.status(404).json({
        success: false,
        message: 'Seat not found'
      });
    }

    res.status(200).json({
      success: true,
      data: seat
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete seat
// @route   DELETE /api/seats/:id
// @access  Private/Admin
exports.deleteSeat = async (req, res) => {
  try {
    const seat = await Seat.findById(req.params.id);

    if (!seat) {
      return res.status(404).json({
        success: false,
        message: 'Seat not found'
      });
    }

    await seat.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check seat availability
// @route   GET /api/seats/:id/availability
// @access  Public
exports.checkSeatAvailability = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const seatId = req.params.id;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const seat = await Seat.findById(seatId);
    if (!seat) {
      return res.status(404).json({
        success: false,
        message: 'Seat not found'
      });
    }

    // Check for conflicting bookings
    const Booking = require('../models/Booking');
    const conflictingBookings = await Booking.find({
      seatId: seatId,
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) }
        }
      ],
      paymentStatus: { $in: ['completed', 'pending'] },
      status: { $ne: 'cancelled' }
    }).select('bookingId startDate endDate status');

    const isAvailable = seat.isAvailable ?  conflictingBookings.length === 0 :  false;

    res.status(200).json({
      success: true,
      data: {
        seatId: seatId,
        isAvailable: isAvailable,
        conflictingBookings: conflictingBookings.map(booking => ({
          bookingId: booking.bookingId,
          startDate: booking.startDate,
          endDate: booking.endDate,
          status: booking.status
        }))
      }
    });
  } catch (error) {
    console.error('Check seat availability error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Bulk create seats
// @route   POST /api/seats/bulk-create
// @access  Private/Admin
exports.bulkCreateSeats = async (req, res) => {
  try {
    const { seats } = req.body;

    if (!seats || !Array.isArray(seats)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of seats'
      });
    }

    // Validate all cabinIds exist before creating any seats
    const cabinIds = [...new Set(seats.map(seat => seat.cabinId))];
    const cabins = await Cabin.find({ _id: { $in: cabinIds } });
    
    if (cabins.length !== cabinIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more cabin IDs are invalid'
      });
    }

    const createdSeats = await Seat.insertMany(seats);

    res.status(201).json({
      success: true,
      count: createdSeats.length,
      data: createdSeats
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Bulk update seats
// @route   POST /api/seats/bulk-update
// @access  Private/Admin
exports.bulkUpdateSeats = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { seats } = req.body;

    if (!seats || !Array.isArray(seats)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of seats'
      });
    }

    const updatedSeats = [];

    for (const seatData of seats) {
      const { _id, updates } = seatData;
      
      const seat = await Seat.findByIdAndUpdate(
        _id, 
        updates, 
        { new: true, runValidators: true, session }
      );
      
      if (!seat) {
        throw new Error(`Seat with ID ${_id} not found`);
      }
      
      updatedSeats.push(seat);
    }

    await session.commitTransaction();
    
    res.status(200).json({
      success: true,
      count: updatedSeats.length,
      data: updatedSeats
    });
  } catch (error) {
    await session.abortTransaction();
    
    res.status(400).json({
      success: false,
      message: error.message
    });
  } finally {
    session.endSession();
  }
};

// @desc    Get seat booking history
// @route   GET /api/seats/:id/booking-history
// @access  Private/Admin
exports.getSeatBookingHistory = async (req, res) => {
  try {
    const seat = await Seat.findById(req.params.id);

    if (!seat) {
      return res.status(404).json({
        success: false,
        message: 'Seat not found'
      });
    }

    // Placeholder - would integrate with bookings data in a real implementation
    const bookingHistory = [];

    res.status(200).json({
      success: true,
      data: bookingHistory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Check availability for multiple seats in bulk
// @route   POST /api/seats/check-availability-bulk
// @access  Public
exports.checkSeatsAvailabilityBulk = async (req, res) => {
  try {
    const { cabinId, startDate, endDate } = req.body;

    if (!cabinId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Cabin ID, start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Step 1: Get all seats in the cabin
    const seats = await Seat.find({ cabinId });
    const cabin = await Cabin.findOne({ _id: cabinId});

    const seatIds = seats.map(seat => seat._id);

    // Step 2: Get all bookings for those seats in the given date range
    const bookings = await Booking.find({
      seatId: { $in: seatIds },
      startDate: { $lte: end },
      endDate: { $gte: start },
      paymentStatus: { $in: ['completed', 'pending'] },
      status: { $ne: 'cancelled' }
    })
    .populate('cabinId','name category cabinCode')
    .populate('seatId','number price')
    .populate('userId','name profilePicture email phone').lean();

    // Step 3: Group bookings by seatId
    const bookingsMap = {};
    for (const booking of bookings) {
      const id = booking.seatId._id.toString();
      if (!bookingsMap[id]) bookingsMap[id] = [];
      bookingsMap[id].push({
        bookingId: booking.bookingId,
        userId: booking.userId,
        startDate: booking.startDate,
        endDate: booking.endDate,
        status: booking.status
      });
    }
    // Step 4: Prepare final availability response
    const availabilityResults = seats.map(seat => {
      const seatIdStr = seat._id.toString();
      const conflicts = bookingsMap[seatIdStr] || [];
      return {
        seatId: seat._id,
        number: seat.number,
        price: seat.price,
        cabinName: cabin.name,
        cabinCode: cabin.cabinCode,
        isAvailable: seat.isAvailable ?  conflicts.length === 0 :  false,
        conflictingBookings: conflicts
      };
    });

    res.status(200).json({
      success: true,
      data: availabilityResults
    });

  } catch (error) {
    console.error('Bulk seat availability check error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};


// @desc    Get available seats for date range
// @route   GET /api/seats/cabin/:cabinId/available
// @access  Public
exports.getAvailableSeatsForDateRange = async (req, res) => {
  try {
    const { cabinId, floor } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Fetch all seats in the cabin
    const seats = await Seat.find({ cabinId, floor });

    // Extract all seatIds
    const seatIds = seats.map(seat => seat._id);

    // Fetch all conflicting bookings at once
    const bookings = await Booking.find({
      seatId: { $in: seatIds },
      paymentStatus: { $in: ['completed', 'pending'] },
      status: { $ne: 'cancelled' },
      startDate: { $lte: end },
      endDate: { $gte: start }
    })
    .populate('cabinId','name category cabinCode')
    .populate('seatId','number price')
    .populate('userId','name profilePicture email phone').lean();

    // Group bookings by seatId
    const bookingsMap = {};
    for (const booking of bookings) {
      const id = booking.seatId._id.toString();
      if (!bookingsMap[id]) bookingsMap[id] = [];
      bookingsMap[id].push({
        bookingId: booking.bookingId,
        userId: booking.userId,
        seatId: booking.seatId,
        cabinId: booking.cabinId,
        startDate: booking.startDate,
        endDate: booking.endDate,
        status: booking.status
      });
    }

    // Build result
    const availableSeats = seats.map(seat => {
      const conflicts = bookingsMap[seat._id.toString()] || [];
      return {
        ...seat.toObject(),
        seat:seat,
        isAvailable: seat.isAvailable ?  conflicts.length === 0 :  false,
        conflictingBookings: conflicts
      };
    });

    res.status(200).json({
      success: true,
      data: availableSeats
    });
  } catch (error) {
    console.error('Get available seats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
