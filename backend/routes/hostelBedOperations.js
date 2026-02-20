
const express = require('express');
const router = express.Router();
const { protect, admin, hostelManager } = require('../middleware/auth');
const mongoose = require('mongoose');
const HostelBed = require('../models/HostelBed');
const HostelRoom = require('../models/HostelRoom');
const HostelBooking = require('../models/HostelBooking');

// Middleware to ensure authentication
router.use(protect);

// Get a single bed by ID
router.get('/:bedId', async (req, res) => {
  try {
    const { bedId } = req.params;
    
    const bed = await HostelBed.findById(bedId);
    
    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found'
      });
    }
    
    res.json({
      success: true,
      data: bed
    });
  } catch (error) {
    console.error('Error fetching bed details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bed details',
      error: error.message
    });
  }
});

// Get beds by sharing option
router.get('/sharing-option/:optionId', async (req, res) => {
  try {
    const optionId = req.params.optionId;
    
    // Find beds with specific sharing option ID
    const beds = await HostelBed.find({ sharingOptionId: optionId });
    
    res.json({
      success: true,
      count: beds.length,
      data: beds
    });
  } catch (error) {
    console.error('Error fetching beds by sharing option:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch beds by sharing option',
      error: error.message
    });
  }
});

// Get available beds for a room
router.get('/rooms/:roomId/available', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Base query - get beds for this room
    const baseQuery = { roomId, isAvailable: true };
    
    // If start and end dates are provided, check booking conflicts
    if (startDate && endDate) {
      // Find beds that have bookings overlapping with the requested dates
      const bookedBedIds = await HostelBooking.find({
        roomId,
        status: { $ne: 'cancelled' },
        $or: [
          { 
            startDate: { $lte: new Date(endDate) },
            endDate: { $gte: new Date(startDate) }
          }
        ]
      }).distinct('bedId');
      
      // Exclude booked beds
      if (bookedBedIds.length > 0) {
        baseQuery._id = { $nin: bookedBedIds };
      }
    }
    
    // Get available beds
    const availableBeds = await HostelBed.find(baseQuery);
    
    res.json({
      success: true,
      count: availableBeds.length,
      data: availableBeds
    });
  } catch (error) {
    console.error('Error fetching available beds:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available beds',
      error: error.message
    });
  }
});

// Change bed status (available/unavailable)
router.patch('/:bedId/status', hostelManager, async (req, res) => {
  try {
    const { bedId } = req.params;
    const { isAvailable } = req.body;
    
    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isAvailable must be a boolean value'
      });
    }
    
    // Update bed availability
    const updatedBed = await HostelBed.findByIdAndUpdate(
      bedId,
      { isAvailable },
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
      data: updatedBed,
      message: `Bed ${updatedBed.number} is now ${isAvailable ? 'available' : 'unavailable'}`
    });
  } catch (error) {
    console.error('Error updating bed status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bed status',
      error: error.message
    });
  }
});

// Get bookings for a specific bed
router.get('/:bedId/bookings', async (req, res) => {
  try {
    const { bedId } = req.params;
    
    // Find bookings for this bed
    const bookings = await HostelBooking.find({ bedId })
      .populate('userId', 'name email userID profilePicture')
      .sort({ startDate: -1 });
    
    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching bed bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bed bookings',
      error: error.message
    });
  }
});

// Bulk create beds
router.post('/:hostelId/beds/bulk', hostelManager, async (req, res) => {
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
    
    // Add hostel ID to each bed if not provided
    const bedsWithHostelId = beds.map(bed => ({
      ...bed,
      hostelId: bed.hostelId || hostelId
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

module.exports = router;
