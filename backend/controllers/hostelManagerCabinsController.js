
const Cabin = require('../models/Cabin');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const User = require('../models/User');

// @desc    Get cabins managed by the logged-in hostel manager
// @route   GET /api/cabins/managed
// @access  Private/HostelManager
exports.getManagedCabins = async (req, res) => {
  try {
    // Find cabins created by the current user
    const cabins = await Cabin.find({ createdBy: req.user.id });
    
    res.status(200).json({
      success: true,
      count: cabins.length,
      data: cabins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get revenue statistics for cabins managed by the logged-in hostel manager
// @route   GET /api/cabins/managed/revenue
// @access  Private/HostelManager
exports.getCabinRevenueStats = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Find cabins created by the current user
    const cabins = await Cabin.find({ createdBy: req.user.id });
    
    if (cabins.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalRevenue: 0,
          periodRevenue: 0,
          cabinRevenue: []
        }
      });
    }
    
    // Get cabin IDs
    const cabinIds = cabins.map(cabin => cabin._id);
    
    // Calculate date range based on period
    let startDate = new Date();
    switch(period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1); // Default to month
    }
    
    // Find bookings for these cabins
    const bookings = await Booking.find({
      cabinId: { $in: cabinIds },
      paymentStatus: 'completed'
    });
    
    // Calculate total revenue
    const totalRevenue = bookings.reduce((total, booking) => total + booking.totalPrice, 0);
    
    // Calculate period revenue
    const periodBookings = bookings.filter(booking => new Date(booking.createdAt) >= startDate);
    const periodRevenue = periodBookings.reduce((total, booking) => total + booking.totalPrice, 0);
    
    // Calculate revenue per cabin
    const cabinRevenue = [];
    for (const cabin of cabins) {
      const cabinBookings = bookings.filter(booking => booking.cabinId.toString() === cabin._id.toString());
      const revenue = cabinBookings.reduce((total, booking) => total + booking.totalPrice, 0);
      cabinRevenue.push({
        cabinId: cabin._id,
        cabinName: cabin.name,
        revenue
      });
    }
    
    // Sort by revenue (highest first)
    cabinRevenue.sort((a, b) => b.revenue - a.revenue);
    
    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        periodRevenue,
        cabinRevenue
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get booking statistics for cabins managed by the logged-in hostel manager
// @route   GET /api/cabins/managed/bookings-stats
// @access  Private/HostelManager
exports.getCabinBookingStats = async (req, res) => {
  try {
    // Find cabins created by the current user
    const cabins = await Cabin.find({ createdBy: req.user.id });
    
    if (cabins.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalBookings: 0,
          activeBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0
        }
      });
    }
    
    // Get cabin IDs
    const cabinIds = cabins.map(cabin => cabin._id);
    
    // Find bookings for these cabins
    const bookings = await Booking.find({ cabinId: { $in: cabinIds } });
    
    // Calculate statistics
    const totalBookings = bookings.length;
    const activeBookings = bookings.filter(booking => booking.status === 'active').length;
    const completedBookings = bookings.filter(booking => booking.status === 'completed').length;
    const cancelledBookings = bookings.filter(booking => booking.status === 'cancelled').length;
    
    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        activeBookings,
        completedBookings,
        cancelledBookings
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get seat statistics for cabins managed by the logged-in hostel manager
// @route   GET /api/cabins/managed/seats-stats
// @access  Private/HostelManager
exports.getCabinSeatsStats = async (req, res) => {
  try {
    // Find cabins created by the current user
    const cabins = await Cabin.find({ createdBy: req.user.id });
    
    if (cabins.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalSeats: 0,
          availableSeats: 0,
          occupiedSeats: 0,
          occupancyRate: 0
        }
      });
    }
    
    // Get cabin IDs
    const cabinIds = cabins.map(cabin => cabin._id);
    
    // Find seats for these cabins
    const seats = await Seat.find({ cabinId: { $in: cabinIds } });
    
    // Calculate statistics
    const totalSeats = seats.length;
    const availableSeats = seats.filter(seat => seat.isAvailable).length;
    const occupiedSeats = totalSeats - availableSeats;
    const occupancyRate = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;
    
    res.status(200).json({
      success: true,
      data: {
        totalSeats,
        availableSeats,
        occupiedSeats,
        occupancyRate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
