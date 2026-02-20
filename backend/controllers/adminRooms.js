
const Cabin = require('../models/Cabin');

// @desc    Get all rooms (with filtering)
// @route   GET /api/admin/rooms
// @access  Private/Admin
exports.getAllRooms = async (req, res) => {
  try {
    const filter = {};
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.hostelId) {
      filter.hostelId = req.query.hostelId;
    }
    
    const rooms = await Cabin.find(filter);
    
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

// @desc    Get room by ID
// @route   GET /api/admin/rooms/:id
// @access  Private/Admin
exports.getRoomById = async (req, res) => {
  try {
    const room = await Cabin.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
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

// @desc    Create new room
// @route   POST /api/admin/rooms
// @access  Private/Admin
exports.createRoom = async (req, res) => {
  try {
    const room = await Cabin.create(req.body);
    
    res.status(201).json({
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

// @desc    Update room
// @route   PUT /api/admin/rooms/:id
// @access  Private/Admin
exports.updateRoom = async (req, res) => {
  try {
    const room = await Cabin.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
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

// @desc    Delete room (mark as inactive)
// @route   DELETE /api/admin/rooms/:id
// @access  Private/Admin
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Cabin.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    // Instead of deleting, mark as inactive
    room.isActive = false;
    await room.save();
    
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

// @desc    Restore room (mark as active)
// @route   PUT /api/admin/rooms/:id/restore
// @access  Private/Admin
exports.restoreRoom = async (req, res) => {
  try {
    const room = await Cabin.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    if(req.body.type){
      if(req.body.type == 'bookingStatus'){
        room.isBookingActive = req.body.isActive;
      }else{
        room.isActive = req.body.isActive;
        if(!req.body.isActive){
          room.isBookingActive = req.body.isActive;
        }
      }
    }
    // Mark as active
  
    await room.save();
    
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

// @desc    Upload room image
// @route   POST /api/admin/rooms/:id/image
// @access  Private/Admin
exports.uploadRoomImage = async (req, res) => {
  try {
    // This would use a file upload service in a real application
    // For now, we'll simulate it by just updating the imageSrc field
    const room = await Cabin.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    // In a real implementation, handle file upload here
    // For simulation:
    const imageUrl = req.body.imageUrl || 'https://images.unsplash.com/photo-1513694203232-719a280e022f';
    
    room.imageSrc = imageUrl;
    await room.save();
    
    res.status(200).json({
      success: true,
      data: {
        url: imageUrl
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

// @desc    Get room statistics
// @route   GET /api/admin/rooms/stats
// @access  Private/Admin
exports.getRoomStats = async (req, res) => {
  try {
    const totalRooms = await Cabin.countDocuments();
    const activeRooms = await Cabin.countDocuments({ isActive: true });
    const inactiveRooms = totalRooms - activeRooms;
    
    // Count rooms by category
    const roomsByCategory = await Cabin.aggregate([
      { 
        $group: { 
          _id: "$category", 
          count: { $sum: 1 } 
        } 
      }
    ]);
    
    const categories = {};
    roomsByCategory.forEach(item => {
      categories[item._id] = item.count;
    });
    
    res.status(200).json({
      success: true,
      data: {
        total: totalRooms,
        active: activeRooms,
        inactive: inactiveRooms,
        categories
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

// @desc    Bulk update rooms
// @route   POST /api/admin/rooms/bulk-update
// @access  Private/Admin
exports.bulkUpdateRooms = async (req, res) => {
  try {
    const { rooms } = req.body;
    
    if (!Array.isArray(rooms) || rooms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of rooms to update'
      });
    }
    
    const updatePromises = rooms.map(room => {
      return Cabin.findByIdAndUpdate(room.id, room.updates, {
        new: true,
        runValidators: true
      });
    });
    
    const updatedRooms = await Promise.all(updatePromises);
    
    res.status(200).json({
      success: true,
      count: updatedRooms.length,
      data: updatedRooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
