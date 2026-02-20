
const Hostel = require('../models/Hostel');
const Cabin = require('../models/Cabin');
const Seat = require('../models/Seat');
const User = require('../models/User');
const {City} = require('../models/Location');

// @desc    Get all hostels
// @route   GET /api/hostels
// @access  Public
exports.getHostels = async (req, res) => {
  try {
    const { city, locality, gender, amenities } = req.query;
    
    // Build filter object
    const filter = { isActive: true };
    
    if (locality) {
      filter.locality = new RegExp(locality, 'i');
    }
    
    if (gender) {
      filter.gender = gender;
    }
    
    if (amenities) {
      const amenitiesList = amenities.split(',');
      filter.amenities = { $in: amenitiesList };
    }

    if (city) {
        const cities = await City.find({
          name: new RegExp(city, 'i') // case-insensitive search
        }).select('_id');
        const cityIds = cities.map(c => c._id);

        if (!cityIds.length) {
          return res.json({ success: true, data: [] }); // no cities matched
        }

        filter.city = { $in: cityIds };
      }
    
    const hostels = await Hostel.find(filter)
      .populate('vendorId', 'businessName email phone')
      .populate('state', 'name code')
      .populate('city', 'name')
      .populate('area', 'name');
    
    res.status(200).json({
      success: true,
      count: hostels.length,
      data: hostels
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get nearby hostels
// @route   GET /api/hostels/nearby
// @access  Public
exports.getNearbyHostels = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query; // radius in kilometers
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }
    
    // Convert to numbers
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const maxDistance = parseFloat(radius) * 1000; // Convert km to meters
    
    // Find hostels near the given coordinates
    const hostels = await Hostel.find({
      isActive: true,
      coordinatePoint: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [latitude, longitude]
          },
          $maxDistance: maxDistance
        }
      }
    });
    
    // If geospatial query fails (requires proper index), fall back to all hostels
    if (!hostels || hostels.length === 0) {
      const allHostels = await Hostel.find({ isActive: true });
      
      // Sort by estimated distance (simplified calculation)
      const sortedHostels = allHostels.map(hostel => {
        let distance = Number.MAX_VALUE;
        
        if (hostel.coordinates && hostel.coordinates.lat && hostel.coordinates.lng) {
          // Simple distance calculation (not accounting for earth's curvature)
          const latDiff = hostel.coordinates.lat - latitude;
          const lngDiff = hostel.coordinates.lng - longitude;
          distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
        }
        
        return {
          ...hostel.toObject(),
          distance
        };
      }).sort((a, b) => a.distance - b.distance);
      
      return res.status(200).json({
        success: true,
        count: sortedHostels.length,
        data: sortedHostels
      });
    }
    
    res.status(200).json({
      success: true,
      count: hostels.length,
      data: hostels
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single hostel
// @route   GET /api/hostels/:id
// @access  Public
exports.getHostel = async (req, res) => {
  try {
    // const hostel = await Hostel.findById(req.params.id);
    const hostel = await Hostel.findById(req.params.id).populate({
      path: 'rooms',
      match: { isActive: true },
    });
    
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: hostel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new hostel
// @route   POST /api/hostels
// @access  Private/Admin
exports.createHostel = async (req, res) => {
  try {
    req.body.hotelId = generateHOTELId('CABIN');

        // Create room
    const hostelData = {
      ...req.body,
      createdBy: req.user.id,
      updatedBy: req.user.id,
      managerIds: [req.user.id],
      vendorId : req.user.vendorId,
      // hostelCode : `HST-${Date.now()}`,
      coordinatePoint: {
        type: 'Point',
        coordinates: [req.body.coordinates.lat, req.body.coordinates.lng]
      },
    };
    
    // const hostel = await Hostel.create(hostelData);
    const hostel = await new Hostel(hostelData).save();

     if (req.user.role === 'hostel_manager') {
        const user = await User.findById(req.user.id).populate('hostelIds');
          // Add hostel to user's hostels
        if (!user.hostelIds.includes(hostel._id)) {
          user.hostelIds.push(hostel._id);
        }
        await user.save();
    }
        
    res.status(201).json({
      success: true,
      data: hostel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


function generateHOTELId(prefix) {
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

// @desc    Update hostel
// @route   PUT /api/hostels/:id
// @access  Private/Hostel Manager/Admin
exports.updateHostel = async (req, res) => {
  try {
    // Find hostel first
    let hostel = await Hostel.findById(req.params.id);
    
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }
    
    // Check if user is authorized to update this hostel
    if (req.user.role !== 'admin') {
      // Check if user is a manager for this hostel
      const isManager = String(req.user.vendorId) === String(hostel.vendorId);
      
      if (!isManager) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this hostel'
        });
      }
    }
    

    const hostelData = {
      ...req.body,
      updatedBy: req.user.id,
      coordinatePoint: {
        type: 'Point',
        coordinates: [req.body.coordinates.lat, req.body.coordinates.lng]
      },
    };
    // Update hostel
    hostel = await Hostel.findByIdAndUpdate(req.params.id, hostelData, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: hostel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete hostel
// @route   DELETE /api/hostels/:id
// @access  Private/Admin
exports.deleteHostel = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }
    
    // Instead of deleting, mark as inactive
    hostel.isActive = false;
    await hostel.save();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Add rooms to a hostel with sharing options
// @route   POST /api/hostels/:id/rooms
// @access  Private/Admin/Hostel Manager
exports.addRoomToHostel = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }
    
    // Create room
    const roomData = {
      ...req.body,
      hostelId: hostel._id,
      createdBy: req.user.id,
      price:0
    };
    
    const room = await Cabin.create(roomData);
    
    // Generate seats based on sharing options
    const sharingOptions = req.body.sharingOptions || [];
    const seatsToCreate = [];
    
    let seatNumber = 1;
    
    // Create seats for each sharing option
    for (const option of sharingOptions) {
      const { type, capacity, count, price } = option;
      
      for (let i = 0; i < count; i++) {
        for (let j = 0; j < capacity; j++) {
          seatsToCreate.push({
            number: seatNumber++,
            cabinId: room._id,
            price,
            position: { x: (i * 50) + 50, y: (j * 30) + 50 }, // Simple positioning algorithm
            sharingType: type,
            sharingCapacity: capacity,
            isAvailable: true
          });
        }
      }
    }
    
    // Create the seats
    if (seatsToCreate.length > 0) {
      await Seat.insertMany(seatsToCreate);
    }
    
    res.status(201).json({
      success: true,
      data: {
        room,
        seatsCount: seatsToCreate.length
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

// @desc    Get room availability by hostel
// @route   GET /api/hostels/:id/availability
// @access  Public
exports.getHostelAvailability = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }
    
    // Get all rooms for this hostel
    const rooms = await Cabin.find({ hostelId: hostel._id, isActive: true });
    
    // Get room availability with sharing options
    const roomsWithAvailability = await Promise.all(rooms.map(async (room) => {
      // Get all seats for this room
      const seats = await Seat.find({ cabinId: room._id });
      
      // Group by sharing type
      const sharingAvailability = {};
      
      seats.forEach(seat => {
        const type = seat.sharingType;
        
        if (!sharingAvailability[type]) {
          sharingAvailability[type] = {
            total: 0,
            available: 0,
            capacity: seat.sharingCapacity,
            price: seat.price
          };
        }
        
        sharingAvailability[type].total++;
        if (seat.isAvailable) {
          sharingAvailability[type].available++;
        }
      });
      
      return {
        roomId: room._id,
        roomName: room.name,
        roomType: room.category,
        sharingAvailability
      };
    }));
    
    res.status(200).json({
      success: true,
      data: {
        hostel,
        roomsAvailability: roomsWithAvailability
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
