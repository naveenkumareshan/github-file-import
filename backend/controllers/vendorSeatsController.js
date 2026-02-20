
const Seat = require('../models/Seat');
const Cabin = require('../models/Cabin');
const Booking = require('../models/Booking');

// Get all vendor cabins
const getVendorCabins = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    
    const cabins = await Cabin.find({ vendorId }).select('name location totalSeats floors');
    
    // Calculate available and occupied seats for each cabin
    const cabinsWithSeats = await Promise.all(cabins.map(async (cabin) => {
      const totalSeats = await Seat.countDocuments({ cabinId: cabin._id });
      const occupiedSeats = await Seat.countDocuments({ 
        cabinId: cabin._id, 
        isAvailable: false 
      });
      const availableSeats = totalSeats - occupiedSeats;
      
      return {
        _id: cabin._id,
        name: cabin.name,
        location: cabin.location,
        floors: cabin.floors,
        totalSeats,
        availableSeats,
        occupiedSeats
      };
    }));
    
    res.json({ success: true, data: cabinsWithSeats });
  } catch (error) {
    console.error('Error fetching vendor cabins:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch cabins' });
  }
};

// Get seats for vendor with filters
const getVendorSeats = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const { cabinId, status, search } = req.query;

    // Step 1: Get all cabin IDs for this vendor
    var vendorCabinIds = [];
    if(!cabinId){
      const vendorCabins = await Cabin.find({ vendorId }).select('_id').lean();
      vendorCabinIds = vendorCabins.map(c => c._id);
        if (vendorCabinIds.length ==0) {
          return res.json({ success: true, data: [] });
        }
    }

    // Step 2: Build seat filter
    const seatFilter = {
      cabinId: cabinId && cabinId !== 'all' ? cabinId : { $in: vendorCabinIds }
    };

    if (status && status !== 'all') {
      switch (status) {
        case 'available':
          seatFilter.isAvailable = true;
          seatFilter.isHotSelling = { $ne: true };
          break;
        case 'occupied':
          seatFilter.isAvailable = true;
          break;
        case 'hot-selling':
          seatFilter.isHotSelling = true;
          seatFilter.isAvailable = true;
          break;
      }
    }

    if (search) {
      seatFilter.$or = [
        { number: { $regex: search, $options: 'i' } }
      ];
    }

    // Step 3: Get seats in one query
    const seats = await Seat.find(seatFilter)
      .populate('cabinId', 'name')
      .sort({ number: 1 })
      .lean();

    if (!seats.length) {
      return res.json({ success: true, data: [] });
    }

    const seatIds = seats.map(seat => seat._id);

    // Step 4: Batch booking query for all seatIds
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 30);

    const bookings = await Booking.find({
      seatId: { $in: seatIds },
      startDate: { $lte: future },
      endDate: { $gte: now },
      paymentStatus: { $in: ['completed', 'pending'] },
      status: { $ne: 'cancelled' }
    })
      .populate('userId', 'name email phone userID profilePicture')
      .lean();

    // Step 5: Index bookings by seatId
    const bookingMap = {};
    for (const booking of bookings) {
      bookingMap[booking.seatId.toString()] = booking;
    }

    // Step 6: Combine seats with booking info
    const results = seats.map(seat => {
      const booking = bookingMap[seat._id.toString()];

      const currentBooking = booking
        ? {
            studentName: booking.userId?.name || 'Unknown',
            studentEmail: booking.userId?.email || 'Unknown',
            studentPhone: booking.userId?.phone || 'Unknown',
            profilePicture: booking.userId?.profilePicture || '',
            userID: booking.userId?.userID || 'Unknown',
            startDate: booking.startDate,
            endDate: booking.endDate,
            status: booking.status
          }
        : null;

      return {
        _id: seat._id,
        number: seat.number,
        cabinId: seat.cabinId?._id || null,
        cabinName: seat.cabinId?.name || 'Unknown',
        position: seat.position,
        isAvailable: seat.isAvailable ? !currentBooking : seat.isAvailable,
        occupied: currentBooking ? true: false,
        isHotSelling: seat.isHotSelling || false,
        price: seat.price,
        unavailableUntil: seat.unavailableUntil,
        currentBooking
      };
    });

    var finalResult = results
    if (status === 'occupied') {
      finalResult = results.filter(item => item.currentBooking !== null);
    }

    return res.json({ success: true, data: finalResult });

  } catch (error) {
    console.error('Error fetching vendor seats:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch seats' });
  }

};

// Get seats for specific cabin
const getCabinSeats = async (req, res) => {
  try {
    const { cabinId } = req.params;
    const vendorId = req.user.vendorId;
    
    // Verify cabin belongs to vendor
    const cabin = await Cabin.findOne({ _id: cabinId, vendorId });
    if (!cabin) {
      return res.status(403).json({ success: false, error: 'Cabin not found or access denied' });
    }
    
    const seats = await Seat.find({ cabinId })
      .sort({ number: 1 });
    
    // Get booking information for each seat
    const seatsWithBookings = await Promise.all(seats.map(async (seat) => {
      let currentBooking = null;
      
      if (!seat.isAvailable) {
        // Find active booking for this seat
        const booking = await Booking.findOne({ 
          seatId: seat._id, 
          status: { $in: ['confirmed', 'active'] }
        }).populate('userId', 'name email phone');
        
        if (booking) {
          currentBooking = {
            studentName: booking.userId?.name || 'Unknown',
            studentEmail: booking.userId?.email || 'Unknown',
            studentPhone: booking.userId?.phone || 'Unknown',
            startDate: booking.startDate,
            endDate: booking.endDate,
            status: booking.status
          };
        }
      }
      
      return {
        _id: seat._id,
        number: seat.number,
        cabinId: seat.cabinId,
        cabinName: cabin.name,
        position: seat.position,
        isAvailable: seat.isAvailable,
        isHotSelling: seat.isHotSelling || false,
        price: seat.price,
        unavailableUntil: seat.unavailableUntil,
        currentBooking
      };
    }));
    
    res.json({ success: true, data: seatsWithBookings });
  } catch (error) {
    console.error('Error fetching cabin seats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch cabin seats' });
  }
};

// Update seat price
const updateSeatPrice = async (req, res) => {
  try {
    const { seatId } = req.params;
    const { price } = req.body;
    const vendorId = req.user.vendorId;
    
    // Verify seat belongs to vendor
    const seat = await Seat.findById(seatId).populate('cabinId');
    if (!seat || seat.cabinId.vendorId.toString() !== vendorId.toString()) {
      return res.status(403).json({ success: false, error: 'Seat not found or access denied' });
    }
    
    seat.price = price;
    await seat.save();
    
    res.json({ success: true, data: seat });
  } catch (error) {
    console.error('Error updating seat price:', error);
    res.status(500).json({ success: false, error: 'Failed to update seat price' });
  }
};

// Toggle seat availability
const toggleSeatAvailability = async (req, res) => {
  try {
    const { seatId } = req.params;
    const { isAvailable } = req.body;
    const vendorId = req.user.vendorId;
    
    // Verify seat belongs to vendor
    const seat = await Seat.findById(seatId).populate('cabinId');
    if (!seat || seat.cabinId.vendorId.toString() !== vendorId.toString()) {
      return res.status(403).json({ success: false, error: 'Seat not found or access denied' });
    }
    
    seat.isAvailable = isAvailable;
    if (!isAvailable) {
      seat.unavailableUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    } else {
      seat.unavailableUntil = undefined;
    }
    
    await seat.save();
    
    res.json({ success: true, data: seat });
  } catch (error) {
    console.error('Error toggling seat availability:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle seat availability' });
  }
};

// Toggle hot selling status
const toggleHotSelling = async (req, res) => {
  try {
    const { seatId } = req.params;
    const { isHotSelling } = req.body;
    const vendorId = req.user.vendorId;
    
    // Verify seat belongs to vendor
    const seat = await Seat.findById(seatId).populate('cabinId');
    if (!seat || seat.cabinId.vendorId.toString() !== vendorId.toString()) {
      return res.status(403).json({ success: false, error: 'Seat not found or access denied' });
    }
    
    seat.isHotSelling = isHotSelling;
    await seat.save();
    
    res.json({ success: true, data: seat });
  } catch (error) {
    console.error('Error toggling hot selling status:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle hot selling status' });
  }
};

// Get seat booking details
const getSeatBookingDetails = async (req, res) => {
  try {
    const { seatId } = req.params;
    const vendorId = req.user.vendorId;
    
    // Verify seat belongs to vendor
    const seat = await Seat.findById(seatId).populate('cabinId');
    if (!seat || seat.cabinId.vendorId.toString() !== vendorId.toString()) {
      return res.status(403).json({ success: false, error: 'Seat not found or access denied' });
    }
    
    const booking = await Booking.findOne({ 
      seatId, 
      status: { $in: ['confirmed', 'active'] }
    }).populate('userId', 'name email phone userID profilePicture');
    
    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Error fetching seat booking details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch booking details' });
  }
};

module.exports = {
  getVendorCabins,
  getVendorSeats,
  getCabinSeats,
  updateSeatPrice,
  toggleSeatAvailability,
  toggleHotSelling,
  getSeatBookingDetails
};
