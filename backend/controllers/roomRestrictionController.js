
const RoomRestriction = require('../models/RoomRestriction');

// Get restrictions with pagination and filters
const getRestrictions = async (req, res) => {
  try {
    const { page = 1, limit = 20, cabinId, restrictionType, isActive, startDate, endDate, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = {};

    if (cabinId) {
      query.cabinId = cabinId;
    }

    if (restrictionType) {
      query.restrictionType = restrictionType;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (startDate || endDate) {
      query.$or = [
        {
          startDate: {
            ...(startDate && { $gte: new Date(startDate) }),
            ...(endDate && { $lte: new Date(endDate) })
          }
        },
        {
          endDate: {
            ...(startDate && { $gte: new Date(startDate) }),
            ...(endDate && { $lte: new Date(endDate) })
          }
        }
      ];
    }

    // Execute query with pagination
    const restrictions = await RoomRestriction.find(query)
      .populate('cabinId', 'name')
      .populate('roomId', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await RoomRestriction.countDocuments(query);

    // Apply search filter after population
    let filteredRestrictions = restrictions;
    if (search) {
      filteredRestrictions = restrictions.filter(restriction => 
        restriction.cabinId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        restriction.roomId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        restriction.reason?.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json({
      success: true,
      data: filteredRestrictions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching restrictions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create restriction
const createRestriction = async (req, res) => {
  try {
    const restrictionData = {
      ...req.body,
      createdBy: req.user.id
    };

    const restriction = new RoomRestriction(restrictionData);
    await restriction.save();

    await restriction.populate('cabinId', 'name');
    await restriction.populate('roomId', 'name');
    await restriction.populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      data: restriction,
      message: 'Restriction created successfully'
    });
  } catch (error) {
    console.error('Error creating restriction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update restriction
const updateRestriction = async (req, res) => {
  try {
    const { restrictionId } = req.params;

    const restriction = await RoomRestriction.findByIdAndUpdate(
      restrictionId,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('cabinId', 'name')
    .populate('roomId', 'name')
    .populate('createdBy', 'name');

    if (!restriction) {
      return res.status(404).json({
        success: false,
        error: 'Restriction not found'
      });
    }

    res.json({
      success: true,
      data: restriction,
      message: 'Restriction updated successfully'
    });
  } catch (error) {
    console.error('Error updating restriction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete restriction
const deleteRestriction = async (req, res) => {
  try {
    const { restrictionId } = req.params;

    const restriction = await RoomRestriction.findByIdAndDelete(restrictionId);

    if (!restriction) {
      return res.status(404).json({
        success: false,
        error: 'Restriction not found'
      });
    }

    res.json({
      success: true,
      message: 'Restriction deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting restriction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Toggle restriction status
const toggleRestrictionStatus = async (req, res) => {
  try {
    const { restrictionId } = req.params;

    const restriction = await RoomRestriction.findById(restrictionId);

    if (!restriction) {
      return res.status(404).json({
        success: false,
        error: 'Restriction not found'
      });
    }

    restriction.isActive = !restriction.isActive;
    await restriction.save();

    await restriction.populate('cabinId', 'name');
    await restriction.populate('roomId', 'name');
    await restriction.populate('createdBy', 'name');

    res.json({
      success: true,
      data: restriction,
      message: `Restriction ${restriction.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error toggling restriction status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getRestrictions,
  createRestriction,
  updateRestriction,
  deleteRestriction,
  toggleRestrictionStatus
};
