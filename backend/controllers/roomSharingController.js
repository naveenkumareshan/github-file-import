
const Cabin = require('../models/Cabin');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');

// @desc    Get room sharing options with availability
// @route   GET /api/rooms/:id/sharing
// @access  Public
exports.getRoomSharingOptions = async (req, res) => {
  try {
    const room = await Cabin.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Get all seats for this room
    const seats = await Seat.find({ cabinId: req.params.id });
    
    // Get all active bookings for these seats
    const activeBookings = await Booking.find({
      seatId: { $in: seats.map(seat => seat._id) },
      endDate: { $gt: new Date() }
    });
    
    // Calculate availability by sharing type
    const sharingOptions = {};
    
    // Group seats by their sharing type (e.g., 4-sharing, 6-sharing)
    seats.forEach(seat => {
      const sharingType = seat.sharingType || 'standard'; // Default if not specified
      
      if (!sharingOptions[sharingType]) {
        sharingOptions[sharingType] = {
          total: 0,
          available: 0,
          price: seat.price,
          sharingCapacity: seat.sharingCapacity || 0
        };
      }
      
      sharingOptions[sharingType].total += 1;
      
      // Check if seat is booked
      const isBooked = activeBookings.some(booking => 
        booking.seatId.toString() === seat._id.toString()
      );
      
      if (!isBooked && seat.isAvailable) {
        sharingOptions[sharingType].available += 1;
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        roomId: room._id,
        roomName: room.name,
        sharingOptions
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

// @desc    Get all sharing options across all rooms
// @route   GET /api/rooms/sharing-options
// @access  Public
exports.getAllSharingOptions = async (req, res) => {
  try {
    const hostelId = req.query.hostelId;
    const query = hostelId ? { hostelId } : {};
    
    // Get all rooms
    const rooms = await Cabin.find(query);
    
    // Get all seats
    const seats = await Seat.find({ cabinId: { $in: rooms.map(room => room._id) } });
    
    // Get all active bookings
    const activeBookings = await Booking.find({
      seatId: { $in: seats.map(seat => seat._id) },
      endDate: { $gt: new Date() }
    });
    
    // Process data for each room
    const roomsWithSharing = await Promise.all(rooms.map(async (room) => {
      // Filter seats for this room
      const roomSeats = seats.filter(seat => 
        seat.cabinId.toString() === room._id.toString()
      );
      
      // Group by sharing type
      const sharingOptions = {};
      
      roomSeats.forEach(seat => {
        const sharingType = seat.sharingType || 'standard';
        
        if (!sharingOptions[sharingType]) {
          sharingOptions[sharingType] = {
            total: 0,
            available: 0,
            price: seat.price,
            sharingCapacity: seat.sharingCapacity || 0
          };
        }
        
        sharingOptions[sharingType].total += 1;
        
        // Check if seat is booked
        const isBooked = activeBookings.some(booking => 
          booking.seatId.toString() === seat._id.toString()
        );
        
        if (!isBooked && seat.isAvailable) {
          sharingOptions[sharingType].available += 1;
        }
      });
      
      return {
        roomId: room._id,
        roomName: room.name,
        roomType: room.category,
        hostelId: room.hostelId,
        sharingOptions
      };
    }));
    
    res.status(200).json({
      success: true,
      data: roomsWithSharing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
