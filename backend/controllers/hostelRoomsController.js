
const HostelRoom = require('../models/HostelRoom');
const Hostel = require('../models/Hostel');
const Booking = require('../models/Booking');
const HostelBed = require('../models/HostelBed');

// @desc    Get all rooms for a hostel
// @route   GET /api/hostels/:id/rooms
// @access  Private/Hostel Manager/Admin
exports.getHostelRooms = async (req, res) => {
  try {
    const rooms = await HostelRoom.find({ hostelId: req.params.id })
    .populate({
      path: "sharingOptions.bedIds", // populate nested array
      model: "HostelBed"
    });;
    
    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get a single hostel room
// @route   GET /api/hostel-rooms/:id
// @access  Private/Hostel Manager/Admin
exports.getHostelRoom = async (req, res) => {
  try {
    const room = await HostelRoom.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Hostel room not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create a new hostel room
// @route   POST /api/hostels/:id/rooms
// @access  Private/Hostel Manager/Admin
exports.createHostelRoom = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }
    
    // Check if user is authorized (admin or hostel manager)
    const isAuthorized = req.user.role === 'admin' || String(req.user.vendorId) === String(hostel.vendorId);
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add rooms to this hostel'
      });
    }
    
    // Create the room
    const room = await HostelRoom.create({
      ...req.body,
      hostelId: req.params.id,
      createdBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: room
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update a hostel room
// @route   PUT /api/hostel-rooms/:id
// @access  Private/Hostel Manager/Admin
exports.updateHostelRoom = async (req, res) => {
  try {
    let room = await HostelRoom.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Hostel room not found'
      });
    }
    
    const hostel = await Hostel.findById(room.hostelId);
    
    // Check if user is authorized (admin or hostel manager)
    const isAuthorized = req.user.role === 'admin' || 
                         (req.user.role === 'hostel_manager' && 
                          hostel.managerIds.includes(req.user.id));
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update rooms for this hostel'
      });
    }
    
    // Update the room
    room = await HostelRoom.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

      const { beds } = req.body;

    const bedsWithRoomDetails = beds.map(bed => ({
      ...bed,
      roomId: req.params.id,
      hostelId: room.hostelId,
      roomNumber: room.roomNumber,
      floor: room.floor,
      price: req.body.sharingOptions[0].price,
      sharingOptionId : room.sharingOptions[0]._id,
    }));
    

    const operations = bedsWithRoomDetails.map(bed => ({
      updateOne: {
        filter: { number: bed.number, roomId: bed.roomId },
        update: { $set: bed },
        upsert: true, // insert if not found
      }
    }));

    const result = await HostelBed.bulkWrite(operations);
    
    // // Update room's bed count
    await HostelRoom.findByIdAndUpdate(
      req.params.id,
      { $set: { bedCount: bedsWithRoomDetails.length } }
    );
    
    const updatedBeds = await HostelBed.find({ roomId: req.params.id });

      // Update sharing option bed IDs if specified
      if (bedsWithRoomDetails[0].sharingOptionId) {
        const sharingOptionId = room.sharingOptions[0]._id;
        const bedIds = updatedBeds.map(bed => bed._id);

        await HostelRoom.updateOne(
          { _id: req.params.id, "sharingOptions._id": sharingOptionId },
          { $set: { "sharingOptions.$.bedIds": bedIds } } // using $set instead of $push to overwrite
        );
      }
    
    res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Delete a hostel room
// @route   DELETE /api/hostel-rooms/:id
// @access  Private/Hostel Manager/Admin
exports.deleteHostelRoom = async (req, res) => {
  try {
    const room = await HostelRoom.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Hostel room not found'
      });
    }
    
    const hostel = await Hostel.findById(room.hostelId);
    
    // Check if user is authorized (admin or hostel manager)
    const isAuthorized = req.user.role === 'admin' || 
                         (req.user.role === 'hostel_manager' && 
                          hostel.managerIds.includes(req.user.id));
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete rooms for this hostel'
      });
    }
    
    await HostelRoom.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get room statistics for a hostel
// @route   GET /api/hostels/:id/rooms/stats
// @access  Private/Hostel Manager/Admin
exports.getHostelRoomStats = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }
    
    // Get all rooms for this hostel
    const rooms = await HostelRoom.find({ hostelId: req.params.id });
    
    // Calculate statistics
    const totalRooms = rooms.length;
    const totalBedCapacity = rooms.reduce((acc, room) => {
      return acc + room.sharingOptions.reduce((total, option) => {
        return total + (option.count * option.capacity);
      }, 0);
    }, 0);
    
    // Categorize rooms by type
    const roomsByType = rooms.reduce((acc, room) => {
      const category = room.category || 'standard';
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category]++;
      return acc;
    }, {});
    
    res.status(200).json({
      success: true,
      data: {
        totalRooms,
        totalBedCapacity,
        roomsByType,
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
