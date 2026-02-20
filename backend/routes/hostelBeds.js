
const express = require('express');
const router = express.Router();
const { protect, admin, hostelManager } = require('../middleware/auth');
const mongoose = require('mongoose');
const HostelBed = require('../models/HostelBed');
const HostelRoom = require('../models/HostelRoom');
const HostelBooking = require('../models/HostelBooking');

// Middleware to ensure authentication
router.use(protect);

// Get beds for a specific room
router.get('/rooms/:roomId/beds', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const beds = await HostelBed.find({ roomId });
    
    res.json({
      success: true,
      data: beds
    });
  } catch (error) {
    console.error('Error fetching room beds:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch beds for room',
      error: error.message
    });
  }
});

// Get statistics for a room's beds
router.get('/rooms/:roomId/stats', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    
    // Get all beds for the room
    const beds = await HostelBed.find({ roomId });
    
    // Get current bookings for the room
    const bookings = await HostelBooking.find({ 
      roomId,
      status: { $in: ['pending', 'completed'] },
      endDate: { $gte: new Date() }
    });
    
    // Calculate statistics
    const totalBeds = beds.length;
    const availableBeds = beds.filter(bed => bed.isAvailable).length;
    const occupiedBeds = totalBeds - availableBeds;
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
    
    // Group by sharing type
    const sharingTypeCounts = {};
    beds.forEach(bed => {
      if (!sharingTypeCounts[bed.sharingType]) {
        sharingTypeCounts[bed.sharingType] = {
          total: 0,
          available: 0
        };
      }
      sharingTypeCounts[bed.sharingType].total++;
      if (bed.isAvailable) {
        sharingTypeCounts[bed.sharingType].available++;
      }
    });

    // Group by bed type
    const bedTypeCounts = {};
    beds.forEach(bed => {
      if (!bedTypeCounts[bed.bedType]) {
        bedTypeCounts[bed.bedType] = {
          total: 0,
          available: 0
        };
      }
      bedTypeCounts[bed.bedType].total++;
      if (bed.isAvailable) {
        bedTypeCounts[bed.bedType].available++;
      }
    });
    
    res.json({
      success: true,
      data: {
        totalBeds,
        availableBeds,
        occupiedBeds,
        occupancyRate: occupancyRate.toFixed(2),
        sharingTypeCounts,
        bedTypeCounts,
        bookings: bookings.length
      }
    });
  } catch (error) {
    console.error('Error fetching room bed statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bed statistics',
      error: error.message
    });
  }
});

// Admin routes
router.post('/', admin, async (req, res) => {
  try {
    const bedData = req.body;
    const newBed = new HostelBed(bedData);
    await newBed.save();
    
    // Update the room's bed count
    await HostelRoom.findByIdAndUpdate(
      bedData.roomId,
      { $inc: { bedCount: 1 } }
    );
    
    res.status(201).json({
      success: true,
      data: newBed
    });
  } catch (error) {
    console.error('Error creating bed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bed',
      error: error.message
    });
  }
});

router.put('/:id', admin, async (req, res) => {
  try {
    const bedId = req.params.id;
    const bedData = req.body;
    
    const updatedBed = await HostelBed.findByIdAndUpdate(
      bedId,
      { $set: bedData },
      { new: true }
    );
    
    if (!updatedBed) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedBed
    });
  } catch (error) {
    console.error('Error updating bed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bed',
      error: error.message
    });
  }
});

router.delete('/:id', admin, async (req, res) => {
  try {
    const bedId = req.params.id;
    const bed = await HostelBed.findById(bedId);
    
    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found'
      });
    }
    
    // Update room bed count
    await HostelRoom.findByIdAndUpdate(
      bed.roomId,
      { $inc: { bedCount: -1 } }
    );
    
    // Delete the bed
    await bed.remove();
    
    res.json({
      success: true,
      message: 'Bed deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bed',
      error: error.message
    });
  }
});

// Bulk create beds
router.post('/:hostelId/beds/bulk', admin, async (req, res) => {
  try {
    const { beds } = req.body;
    const hostelId = req.params.hostelId;
    
    // Validate input
    if (!Array.isArray(beds) || beds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid beds data'
      });
    }
    
    // Add hostel ID to each bed
    const bedsWithHostelId = beds.map(bed => ({
      ...bed,
      hostelId
    }));
    
    const createdBeds = await HostelBed.insertMany(bedsWithHostelId);
    
    // Update room bed counts - group by roomId
    const roomCounts = {};
    bedsWithHostelId.forEach(bed => {
      if (!roomCounts[bed.roomId]) {
        roomCounts[bed.roomId] = 0;
      }
      roomCounts[bed.roomId]++;
    });
    
    // Update each room's bed count
    for (const roomId in roomCounts) {
      await HostelRoom.findByIdAndUpdate(
        roomId,
        { $inc: { bedCount: roomCounts[roomId] } }
      );
    }
    
    res.status(201).json({
      success: true,
      data: createdBeds,
      message: `${createdBeds.length} beds created successfully`
    });
  } catch (error) {
    console.error('Error creating beds in bulk:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create beds',
      error: error.message
    });
  }
});

// Create beds for sharing type
router.post('/rooms/:roomId/sharing-beds', admin, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { sharingType, bedsCount, bedData } = req.body;
    
    // Validate input
    if (!sharingType || !bedsCount || bedsCount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sharing data'
      });
    }
    
    // Get room details
    const room = await HostelRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    // Find the sharing option
    const sharingOptionIndex = room.sharingOptions.findIndex(
      option => option.type === sharingType
    );
    
    if (sharingOptionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Sharing option "${sharingType}" not found for this room`
      });
    }
    
    // Create beds
    const bedsToCreate = [];
    const existingBeds = await HostelBed.countDocuments({ roomId });
    
    for (let i = 0; i < bedsCount; i++) {
      bedsToCreate.push({
        number: existingBeds + i + 1,
        hostelId: room.hostelId,
        roomId,
        roomNumber: room.roomNumber,
        floor: room.floor,
        isAvailable: true,
        price: bedData.price || room.basePrice,
        bedType: bedData.bedType || 'single',
        sharingType,
        sharingOptionId: room.sharingOptions[sharingOptionIndex]._id,
        amenities: bedData.amenities || room.amenities || []
      });
    }
    
    const createdBeds = await HostelBed.insertMany(bedsToCreate);
    
    // Store the created bed IDs in the sharing option
    const bedIds = createdBeds.map(bed => bed._id);
    room.sharingOptions[sharingOptionIndex].bedIds = [
      ...room.sharingOptions[sharingOptionIndex].bedIds || [],
      ...bedIds
    ];
    
    // Update room's sharing option available count
    room.sharingOptions[sharingOptionIndex].available = 
      (room.sharingOptions[sharingOptionIndex].available || 0) + bedsCount;
    
    // Update the room's total bed count
    room.bedCount = (room.bedCount || 0) + bedsCount;
    
    await room.save();
    
    res.status(201).json({
      success: true,
      data: createdBeds,
      message: `${createdBeds.length} beds created for ${sharingType}`
    });
  } catch (error) {
    console.error('Error creating sharing beds:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create beds for sharing type',
      error: error.message
    });
  }
});

module.exports = router;
