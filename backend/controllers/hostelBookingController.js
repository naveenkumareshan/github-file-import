
const HostelBooking = require('../models/HostelBooking');
const Hostel = require('../models/Hostel');
const HostelBed = require('../models/HostelBed');
const User = require('../models/User');
const HostelRoom = require('../models/HostelRoom');

// Helper function to calculate price based on duration
const calculatePrice = (basePrice, duration, durationCount) => {
  let multiplier = 1;
  
  switch (duration) {
    case 'daily':
      multiplier = 1 * durationCount;
      break;
    case 'weekly':
      multiplier = 6 * durationCount; // 7 days with 1 day discount
      break;
    case 'monthly':
      multiplier = 25 * durationCount; // 30 days with 5 days discount
      break;
    default:
      multiplier = 1 * durationCount;
  }
  
  return basePrice * multiplier;
};

// @desc    Create hostel booking
// @route   POST /api/hostel-bookings
// @access  Private
exports.createHostelBooking = async (req, res) => {
  try {
    const { hostelId, roomId, sharingOptionId, startDate, endDate, bookingDuration, durationCount } = req.body;
  

      const { room, sharingOption } = await getSharingOptionById(roomId, sharingOptionId);

       // Check if bed exists and is available
       if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }
      
      if (!room.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Room is not available'
        });
      }
        
    if (!sharingOption.available > 0) {
      return res.status(400).json({
        success: false,
        message: 'Room is not available'
      });
    }
    // Calculate total price
    const totalPrice = calculatePrice(sharingOption.price, bookingDuration, durationCount);
    
      const updatedBed = await HostelBed.findOneAndUpdate(
        { roomId: roomId, isAvailable: true },
        { $set: { isAvailable: false } },
        { new: true }
      );

    // Create booking
    const booking = await HostelBooking.create({
      userId: req.user.id,
      hostelId,
      bedId:updatedBed.id,
      roomId,
      sharingOptionId,
      startDate,
      endDate,
      totalPrice,
      bookingDuration,
      months:durationCount,
      bookingId: generateBookingId('CABIN'),
      durationCount,
      status: 'pending',
      paymentStatus: 'pending'
    });

    const sharingOptionss = room.sharingOptions.id(booking.sharingOptionId);
     if (sharingOption) {
      sharingOptionss.available -= 1;
      await room.save();
      bedUnblocked = true;

    }
    
    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
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

const getSharingOptionById = async (roomId, sharingOptionId) => {
  const room = await HostelRoom.findOne({
    _id: roomId,
    'sharingOptions._id': sharingOptionId
  });


  if (!room) {
    return null;
  }

  const sharingOption = room.sharingOptions.id(sharingOptionId);
  return { room, sharingOption };
};

// @desc    Get user's hostel bookings
// @route   GET /api/hostel-bookings/user
// @access  Private
exports.getUserHostelBookings = async (req, res) => {
  try {
    const bookings = await HostelBooking.find({ userId: req.user.id })
      .populate('hostelId', 'name location contactEmail')
      .populate('bedId', 'roomNumber floor bedType sharingType number');
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single hostel booking
// @route   GET /api/hostel-bookings/:id
// @access  Private
exports.getHostelBooking = async (req, res) => {
  try {
    const booking = await HostelBooking.findById(req.params.id)
      .populate('hostelId', 'name location contactEmail, hostelCode')
      .populate('bedId', 'roomNumber floor bedType sharingType number');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user owns this booking or is admin
    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'hostel_manager') {
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
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Cancel hostel booking
// @route   POST /api/hostel-bookings/:id/cancel
// @access  Private
exports.cancelHostelBooking = async (req, res) => {
  try {
    let booking = await HostelBooking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user owns this booking or is admin
    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }
    
    // Update booking status
    booking.status = 'cancelled';
    await booking.save();
    
    // Make bed available again if not already in use
    const bed = await HostelBed.findById(booking.bedId);
    if (bed) {
      bed.isAvailable = true;
      await bed.save();
    }
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Process hostel payment
// @route   POST /api/hostel-bookings/:id/payment
// @access  Private
exports.processHostelPayment = async (req, res) => {
  try {
    const { paymentMethod, paymentId } = req.body;
    
    let booking = await HostelBooking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user owns this booking
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process payment for this booking'
      });
    }
    
    // Update booking payment status
    booking.paymentStatus = 'completed';
    booking.paymentMethod = paymentMethod;
    booking.paymentId = paymentId;
    booking.paymentDate = Date.now();
    booking.status = 'confirmed';
    
    await booking.save();
    
    // Update bed availability
    const bed = await HostelBed.findById(booking.bedId);
    if (bed) {
      bed.isAvailable = false;
      await bed.save();
    }
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get hostel bed availability
// @route   GET /api/hostel-bookings/:hostelId/availability
// @access  Public
exports.getHostelBedAvailability = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.hostelId);
    
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }
    
    // Get all beds for this hostel
    const beds = await HostelBed.find({ hostelId: req.params.hostelId });
    
    // Group beds by floor and room
    const roomsMap = {};
    
    beds.forEach(bed => {
      const floorKey = bed.floor;
      const roomKey = bed.roomNumber;
      
      if (!roomsMap[floorKey]) {
        roomsMap[floorKey] = {};
      }
      
      if (!roomsMap[floorKey][roomKey]) {
        roomsMap[floorKey][roomKey] = {
          roomNumber: bed.roomNumber,
          floor: bed.floor,
          totalBeds: 0,
          availableBeds: 0,
          beds: [],
          sharingTypes: {}
        };
      }
      
      // Add bed to the room
      roomsMap[floorKey][roomKey].beds.push({
        id: bed._id,
        number: bed.number,
        price: bed.price,
        bedType: bed.bedType,
        sharingType: bed.sharingType,
        isAvailable: bed.isAvailable,
        amenities: bed.amenities || []
      });
      
      // Update counts
      roomsMap[floorKey][roomKey].totalBeds++;
      if (bed.isAvailable) {
        roomsMap[floorKey][roomKey].availableBeds++;
      }
      
      // Group by sharing type
      const sharingKey = bed.sharingType;
      if (!roomsMap[floorKey][roomKey].sharingTypes[sharingKey]) {
        roomsMap[floorKey][roomKey].sharingTypes[sharingKey] = {
          type: sharingKey,
          count: 0,
          available: 0,
          price: bed.price
        };
      }
      
      roomsMap[floorKey][roomKey].sharingTypes[sharingKey].count++;
      if (bed.isAvailable) {
        roomsMap[floorKey][roomKey].sharingTypes[sharingKey].available++;
      }
    });
    
    // Convert to array format
    const floors = [];
    
    for (const floorKey in roomsMap) {
      const rooms = [];
      
      for (const roomKey in roomsMap[floorKey]) {
        rooms.push(roomsMap[floorKey][roomKey]);
      }
      
      floors.push({
        floor: floorKey,
        rooms: rooms
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        hostel,
        floors
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

// @desc    Reserve a bed for 10 minutes
// @route   POST /api/hostel-bookings/reserve
// @access  Private
exports.reserveBed = async (req, res) => {
  try {
    const { bedId, hostelId, startDate, endDate, bookingDuration, durationCount } = req.body;
    
    // Check if bed exists and is available
    const bed = await HostelBed.findById(bedId);
    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found'
      });
    }
    
    if (!bed.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Bed is not available'
      });
    }
    
    // Calculate total price
    const totalPrice = calculatePrice(bed.price, bookingDuration, durationCount);
    
    // Create temporary reservation
    const booking = await HostelBooking.create({
      userId: req.user.id,
      hostelId,
      bedId,
      startDate,
      endDate,
      totalPrice,
      bookingDuration,
      durationCount,
      status: 'reserved',
      paymentStatus: 'pending',
      reservationExpiry: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
    });
    
    // Mark bed as temporarily unavailable
    bed.isAvailable = false;
    await bed.save();
    
    // Set timeout to free the bed if payment not completed
    setTimeout(async () => {
      try {
        const reservedBooking = await HostelBooking.findById(booking._id);
        
        // If booking still exists and still reserved (not confirmed)
        if (reservedBooking && reservedBooking.status === 'reserved') {
          // Free up the bed
          reservedBooking.status = 'expired';
          await reservedBooking.save();
          
          // Make bed available again
          const reservedBed = await HostelBed.findById(bedId);
          if (reservedBed) {
            reservedBed.isAvailable = true;
            await reservedBed.save();
          }
        }
      } catch (error) {
        console.error('Error in reservation timeout handler:', error);
      }
    }, 10 * 60 * 1000); // 10 minutes
    
    res.status(201).json({
      success: true,
      data: booking,
      message: 'Bed reserved for 10 minutes'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Confirm payment and booking
// @route   POST /api/hostel-bookings/confirm-payment
// @access  Private
exports.confirmPayment = async (req, res) => {
  try {
    const { bookingId, paymentId, paymentMethod } = req.body;
    
    const booking = await HostelBooking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to confirm this booking'
      });
    }
    
    if (booking.status === 'expired') {
      return res.status(400).json({
        success: false,
        message: 'Reservation has expired'
      });
    }
    
    // Update booking status
    booking.status = 'confirmed';
    booking.paymentStatus = 'completed';
    booking.paymentMethod = paymentMethod;
    booking.paymentId = paymentId;
    booking.paymentDate = Date.now();
    
    await booking.save();
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Check if a booking has expired
// @route   GET /api/hostel-bookings/:id/check-expiry
// @access  Private
exports.checkBookingExpiry = async (req, res) => {
  try {
    const booking = await HostelBooking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if booking has an expiry time and if it has passed
    let isExpired = false;
    let bedUnblocked = false;
    
    if (booking.reservationExpiry && booking.status === 'reserved') {
      isExpired = new Date() > new Date(booking.reservationExpiry);
      
      // If expired, update booking and unblock bed
      if (isExpired) {
        booking.status = 'expired';
        await booking.save();
        
        // Unblock the bed if it was a bed reservation
        if (booking.bedId) {
          const bed = await HostelBed.findById(booking.bedId);
          if (bed) {
            bed.isAvailable = true;
            await bed.save();
            bedUnblocked = true;
          }
        } else if (booking.roomId && booking.sharingOptionId) {
          // Handle room sharing option update
          const room = await HostelRoom.findById(booking.roomId);
          if (room) {
            const sharingOption = room.sharingOptions.id(booking.sharingOptionId);
            if (sharingOption) {
              sharingOption.available += 1;
              await room.save();
              bedUnblocked = true;
            }
          }
        }
      }
    }
    
    res.status(200).json({
      success: true,
      expired: isExpired,
      bedId: booking.bedId,
      bedUnblocked
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


// @desc    Get all hostel bookings (admin)
// @route   GET /api/hostel-bookings/admin/bookings
// @access  Private/Admin
exports.getHostelBookingsAdmin = async (req, res) => {
  try {
    const query = {};
    const { status, startDate, endDate, hostelId } = req.query;
    
    // Add filters if provided
    if (status) query.status = status;
    if (hostelId) query.hostelId = hostelId;
    
    // Date range filter
    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate) };
      query.endDate = { $lte: new Date(endDate) };
    }
    
    const bookings = await HostelBooking.find(query)
      .populate('userId', 'name email')
      .populate('hostelId', 'name location')
      .populate('bedId')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Get hostel bookings admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.updateOrderRazorpay = async (req, res) => {
  try {
    console.log(req.body)
    const { razorpay_order_id } = req.body;
    
    let booking = await HostelBooking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user owns this booking
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process payment for this booking'
      });
    }
    
    booking.razorpay_order_id = razorpay_order_id;    
    await booking.save();
    
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get bookings for a specific room (admin)
// @route   GET /api/hostel-bookings/admin/room/:roomId/bookings
// @access  Private/Admin
exports.getHostelBookingsByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Find bookings for this room
    const bookings = await HostelBooking.find({ roomId })
      .populate('userId', 'name email')
      .populate('hostelId', 'name location')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Get room bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};