
const HostelBooking = require('../models/HostelBooking');
const HostelBed = require('../models/HostelBed');
const Hostel = require('../models/Hostel');
const User = require('../models/User');

// @desc    Create a new hostel booking
// @route   POST /api/hostel/bookings
// @access  Private
exports.createHostelBooking = async (req, res) => {
  try {
    const { hostelId, bedId, startDate, endDate, months, totalPrice } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!hostelId || !bedId || !startDate || !endDate || !months || !totalPrice) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if the bed is available
    const bed = await HostelBed.findById(bedId);
    if (!bed || !bed.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'The selected bed is not available'
      });
    }

    // Create booking
    const booking = await HostelBooking.create({
      userId,
      hostelId,
      bedId,
      startDate,
      endDate,
      months,
      totalPrice,
      paymentStatus: 'pending'
    });

    // Update bed availability
    await HostelBed.findByIdAndUpdate(bedId, { isAvailable: false });

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Hostel booking created successfully'
    });
  } catch (error) {
    console.error('Create hostel booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get user hostel bookings
// @route   GET /api/hostel/bookings/user
// @access  Private
exports.getUserHostelBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const bookings = await HostelBooking.find({ userId })
      .populate('hostelId')
      .populate('bedId')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Get user hostel bookings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get a single hostel booking
// @route   GET /api/hostel/bookings/:id
// @access  Private
exports.getHostelBooking = async (req, res) => {
  try {
    const booking = await HostelBooking.findById(req.params.id)
      .populate('hostelId')
      .populate('bedId')
      .populate('userId', 'name email');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Hostel booking not found'
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
    console.error('Get hostel booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Cancel a hostel booking
// @route   POST /api/hostel/bookings/:id/cancel
// @access  Private
exports.cancelHostelBooking = async (req, res) => {
  try {
    const booking = await HostelBooking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Hostel booking not found'
      });
    }
    
    // Check if the booking belongs to the user or the user is an admin
    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }
    
    // Delete the booking and update bed availability
    await HostelBooking.findByIdAndDelete(req.params.id);
    await HostelBed.findByIdAndUpdate(booking.bedId, { isAvailable: true });
    
    res.status(200).json({
      success: true,
      message: 'Hostel booking cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel hostel booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Process payment for a hostel booking
// @route   POST /api/hostel/bookings/:id/payment
// @access  Private
exports.processHostelPayment = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const booking = await HostelBooking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Hostel booking not found'
      });
    }
    
    // Check if the booking belongs to the user or user is admin
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
      message: 'Hostel payment processed successfully'
    });
  } catch (error) {
    console.error('Process hostel payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get hostel bed availability
// @route   GET /api/hostel/bookings/:hostelId/availability
// @access  Public
exports.getHostelBedAvailability = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Get all beds for the hostel
    const beds = await HostelBed.find({ hostelId });
    
    // If no beds, return empty array
    if (!beds || beds.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // Get all bookings for the hostel that overlap with the requested dates
    let bookingQuery = { hostelId };
    
    if (startDate && endDate) {
      bookingQuery.$or = [
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } }
      ];
    }
    
    const bookings = await HostelBooking.find(bookingQuery);
    
    // Mark beds as unavailable if they have a booking that overlaps
    const bookedBedIds = bookings.map(booking => booking.bedId.toString());
    
    const availableBeds = beds.map(bed => {
      return {
        ...bed.toObject(),
        isAvailable: !bookedBedIds.includes(bed._id.toString()) && bed.isAvailable
      };
    });
    
    res.status(200).json({
      success: true,
      count: availableBeds.length,
      data: availableBeds
    });
  } catch (error) {
    console.error('Get hostel bed availability error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
