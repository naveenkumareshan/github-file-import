const Cabin = require('../models/Cabin');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Seat = require('../models/Seat');
const mongoose = require('mongoose');

// Cabin images upload directory
const CABIN_UPLOAD_DIR = path.join(__dirname, '../uploads/cabins');

// Ensure directory exists
if (!fs.existsSync(CABIN_UPLOAD_DIR)) {
  fs.mkdirSync(CABIN_UPLOAD_DIR, { recursive: true });
}

// @desc    Get all cabins
// @route   GET /api/cabins
// @access  Public
exports.getCabins = async (req, res) => {
  try {
    // Add query parameters for filtering
    const query = { ...req.query };

    // Remove fields that are not database fields
    const removeFields = ['includeInactive', 'page', 'limit'];
    removeFields.forEach(param => delete query[param]);

    // Handle includeInactive parameter
    if (!req.query.includeInactive || req.query.includeInactive !== 'true') {
      query.isActive = true; // Default to showing only active cabins
    }


    // Create query string
    let queryStr = JSON.stringify(query);

    // Create operators ($gt, $lt, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    let cabinsQuery = Cabin.find(JSON.parse(queryStr));

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Cabin.countDocuments(JSON.parse(queryStr));

    cabinsQuery = cabinsQuery.skip(startIndex).limit(limit);

    // Executing query
    const cabins = await cabinsQuery;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: cabins.length,
      pagination,
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


// @desc    Get all cabins with location-based filtering
// @route   GET /api/cabins
// @access  Public
exports.getCabinsSearch = async (req, res) => {
  try {
    const query = { ...req.query };
    const removeFields = ['includeInactive', 'page', 'limit', 'lat', 'lng', 'radius', 'search', 'state', 'city', 'area', 'minPrice', 'maxPrice', 'amenities', 'sortBy'];
    removeFields.forEach(param => delete query[param]);

    // Default to showing only active cabins
    if (!req.query.includeInactive || req.query.includeInactive !== 'true') {
      query.isActive = true;
    }

    const pipeline = [];

    const hasLocationFilter = req.query.lat && req.query.lng && req.query.radius;
    const latitude = parseFloat(req.query.lat);
    const longitude = parseFloat(req.query.lng);
    const radius = parseInt(req.query.radius) * 1000;

    if (hasLocationFilter) {
      // $geoNear must be first in the pipeline
      const geoQuery = { ...query };

      pipeline.push({
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [latitude, longitude]
          },
          distanceField: "distance",
          maxDistance: radius,
          spherical: true
        }
      });
    } else {
      pipeline.push({ $match: query });
    }

    // Text search
    if (req.query.search) {
      pipeline.push({
        $match: {
          $or: [
            { name: { $regex: req.query.search, $options: 'i' } },
            { description: { $regex: req.query.search, $options: 'i' } },
            { 'location.fullAddress': { $regex: req.query.search, $options: 'i' } },
            { 'location.locality': { $regex: req.query.search, $options: 'i' } },
            { 'location.nearbyLandmarks': { $in: [new RegExp(req.query.search, 'i')] } }
          ]
        }
      });
    }


    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      const priceMatch = {};
      if (req.query.minPrice) priceMatch.$gte = parseInt(req.query.minPrice);
      if (req.query.maxPrice) priceMatch.$lte = parseInt(req.query.maxPrice);
      pipeline.push({
        $match: { price: priceMatch }
      });
    }

    // Amenities filter
    if (req.query.amenities) {
      const amenitiesArray = req.query.amenities.split(',');
      pipeline.push({
        $match: {
          amenities: { $in: amenitiesArray }
        }
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'cities',
          localField: 'location.city',
          foreignField: '_id',
          as: 'location.city'
        }
      },
      {
        $unwind: {
          path: '$location.city',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'areas',
          localField: 'location.area',
          foreignField: '_id',
          as: 'location.area'
        }
      },
      {
        $unwind: {
          path: '$location.area',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'states',
          localField: 'location.state',
          foreignField: '_id',
          as: 'location.state'
        }
      },
      {
        $unwind: {
          path: '$location.state',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          'averageRating': 1,
          'cabinCode': 1,
          'capacity': 1,
          'amenities': 1,
          'category': 1,
          'description': 1,
          'imageSrc': 1,
          'name': 1,
          'price': 1,
          'reviewCount': 1,
          'location.city._id': 1,
          'location.city.name': 1,
          'location.area._id': 1,
          'location.area.name': 1,
          'location.state._id': 1,
          'location.state.name': 1,
          'location.fullAddress': 1,
          'location.locality': 1,
          'location.pincode': 1,
          'location.locality': 1,
          'location.coordinates': 1
        }
      }
    );

    // Location-based filters
    if (req.query.state) {
      pipeline.push({ $match: { 'location.state._id': new mongoose.Types.ObjectId(req.query.state) } });
    }
    if (req.query.city) {
      pipeline.push({ $match: { 'location.city._id': new mongoose.Types.ObjectId(req.query.city) } });
    }
    if (req.query.area) {
      pipeline.push({ $match: { 'location.area._id': new mongoose.Types.ObjectId(req.query.area) } });
    }
    // Sorting
    let sortStage = {};
    switch (req.query.sortBy) {
      case 'price':
        sortStage = { $sort: { price: 1 } };
        break;
      case 'rating':
        sortStage = { $sort: { averageRating: -1 } };
        break;
      case 'name':
        sortStage = { $sort: { name: 1 } };
        break;
      case 'distance':
      default:
        if (hasLocationFilter) {
          sortStage = { $sort: { distance: 1 } };
        } else {
          sortStage = { $sort: { createdAt: -1 } };
        }
        break;
    }
    pipeline.push(sortStage);

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await Cabin.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const cabins = await Cabin.aggregate(pipeline);

    const pagination = {};
    const endIndex = page * limit;
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    if (skip > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: cabins.length,
      total,
      pagination,
      data: cabins
    });
  } catch (error) {
    console.error('Error in getCabins:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


// @desc    Get nearby cabins
// @route   GET /api/cabins/nearby
// @access  Public
exports.getNearbyCabins = async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }


    const cabins = await Cabin.find({
      isActive: true,
      coordinatePoint: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius) * 1000
        }
      }
    }).populate('location.countryId', 'name code')
      .populate('location.stateId', 'name code')
      .populate('location.cityId', 'name')
      .populate('location.areaId', 'name');
    res.status(200).json({
      success: true,
      count: cabins.length,
      data: cabins
    });
  } catch (error) {
    console.error('Error in getNearbyCabins:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Search cabins by location
// @route   GET /api/cabins/search
// @access  Public
exports.searchCabins = async (req, res) => {
  try {
    const { query: searchQuery, city, area, countryId, stateId, cityId, areaId } = req.query;

    let searchConditions = { isActive: true };

    if (searchQuery) {
      searchConditions.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { 'location.fullAddress': { $regex: searchQuery, $options: 'i' } },
        { 'location.nearbyLandmarks': { $in: [new RegExp(searchQuery, 'i')] } }
      ];
    }

    if (city) {
      searchConditions['location.city'] = { $regex: city, $options: 'i' };
    }

    if (area) {
      searchConditions.$or = searchConditions.$or || [];
      searchConditions.$or.push(
        { 'location.area': { $regex: area, $options: 'i' } },
        { 'location.locality': { $regex: area, $options: 'i' } }
      );
    }

    const cabins = await Cabin.find(searchConditions)
      .populate('location.state', 'name code')
      .populate('location.city', 'name')
      .populate('location.area', 'name')
      .sort({ averageRating: -1, createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: cabins.length,
      data: cabins
    });
  } catch (error) {
    console.error('Error in searchCabins:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Search cabins by location
// @route   GET /api/cabins/search
// @access  Public
exports.getCabinWithRole = async (req, res) => {
  try {
    const query = { ...req.query };

    if (req.user.role !== 'admin') {
      query.vendorId = req.user.vendorId;
    }

    // Create query string
    let queryStr = JSON.stringify(query);

    // Create operators ($gt, $lt, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    let cabins = await Cabin.find(JSON.parse(queryStr)).populate('vendorId', 'businessName email phone')
      .populate('location.state', 'name code')
      .populate('location.city', 'name')
      .populate('location.area', 'name')
      .select('name imageUrl description location.state cabinCode')

    res.status(200).json({
      success: true,
      count: cabins.length,
      data: cabins
    });
  } catch (error) {
    console.error('Error in searchCabins:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
// @desc    Get all cabins
// @route   GET /api/cabins
// @access  Public
exports.getAdminCabins = async (req, res) => {
  try {
    // Add query parameters for filtering
    const query = { ...req.query };

    // Remove fields that are not database fields
    const removeFields = ['includeInactive', 'page', 'limit'];
    removeFields.forEach(param => delete query[param]);

    // Handle includeInactive parameter
    if (!req.query.includeInactive || req.query.includeInactive !== 'true') {
      query.isActive = true; // Default to showing only active cabins
    }

    if (req.user.role !== 'admin') {
      query.vendorId = req.user.vendorId;
    }

    // Create query string
    let queryStr = JSON.stringify(query);

    // Create operators ($gt, $lt, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    let cabinsQuery = Cabin.find(JSON.parse(queryStr)).populate('vendorId', 'businessName email phone')
      .populate({
        path: 'location.state',
        model: 'State'
      })
      .populate({
        path: 'location.city',
        model: 'City'
      })
      .populate({
        path: 'location.area',
        model: 'Area'
      });
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Cabin.countDocuments(JSON.parse(queryStr));

    cabinsQuery = cabinsQuery.skip(startIndex).limit(limit);

    // Executing query
    const cabins = await cabinsQuery;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      totalCount: total,
      pagination,
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

// @desc    Get Featured cabins
// @route   GET /api/cabins
// @access  Public
exports.getFeaturedCabins = async (req, res) => {
  try {

    const query = {};
    // Handle includeInactive parameter
    query.isActive = true; // Default to showing only active cabins

    // Create query string
    let queryStr = JSON.stringify(query);

    // Create operators ($gt, $lt, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    let cabinsQuery = Cabin.find(JSON.parse(queryStr))
      .populate({
        path: 'location.state',
        model: 'State'
      })
      .populate({
        path: 'location.city',
        model: 'City'
      })
      .populate({
        path: 'location.area',
        model: 'Area'
      });

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Cabin.countDocuments(JSON.parse(queryStr));

    cabinsQuery = cabinsQuery.skip(startIndex).limit(limit);

    // Executing query
    const cabins = await cabinsQuery;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: cabins.length,
      pagination,
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



// @desc    Get single cabin
// @route   GET /api/cabins/:id
// @access  Public
exports.getCabin = async (req, res) => {
  try {
    const cabin = await Cabin.findById(req.params.id)
      .select('name imageUrl price description location amenities cabinCode images roomElements floors lockerPrice isBookingActive isActive')
      .populate({
        path: 'location.state',
        model: 'State',
        select: 'name'
      })
      .populate({
        path: 'location.city',
        model: 'City',
        select: 'name'
      })
      .populate({
        path: 'location.area',
        model: 'Area',
        select: 'name'
      });

    if (!cabin) {
      return res.status(404).json({
        success: false,
        message: 'Cabin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: cabin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


// @desc    Update cabin Floor
// @route   GET /api/cabins/:id/floors
// @access  Public
exports.addOrUpdateCabinFloor = async (req, res) => {
  try {
    const { id } = req.params;           // cabin ID
    const { floorId, number } = req.body; // floorId optional for add

    if (!number) {
      return res.status(400).json({ success: false, message: "Floor number is required" });
    }

    const cabin = await Cabin.findById(id);
    if (!cabin) {
      return res.status(404).json({ success: false, message: "Cabin not found" });
    }

    // Check duplicate number
    const duplicate = cabin.floors.some(f => f.number === number && f.id !== floorId);
    if (duplicate) {
      return res.status(409).json({ success: false, message: "Floor number already exists" });
    }

    if (floorId) {
      // UPDATE existing floor
      const floor = cabin.floors.find(f => f.id === floorId);
      if (!floor) {
        return res.status(404).json({ success: false, message: "Floor not found" });
      }
      floor.number = number;
    } else {
      // ADD new floor
      const newId = cabin.floors.length > 0
        ? Math.max(...cabin.floors.map(f => f.id)) + 1
        : 1;

      cabin.floors.push({
        id: newId,
        number,
      });
    }

    await cabin.save();

    return res.status(200).json({ success: true, data: cabin });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Create new cabin
// @route   POST /api/cabins
// @access  Private/Admin
exports.createCabin = async (req, res) => {
  try {

    const cabin = await Cabin.create({
      ...req.body,
      hostelId: req.params.id,
      managerIds: [req.user._id],
      vendorId: req.user.vendorId,
      createdBy: req.user.id,
      imageSrc: req.body.imageUrl,
      coordinatePoint: {
        type: 'Point',
        coordinates: [req.body.location.coordinates.latitude, req.body.location.coordinates.longitude]
      },
    });

    res.status(201).json({
      success: true,
      data: cabin
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update cabin
// @route   PUT /api/cabins/:id
// @access  Private/Admin
exports.updateCabin = async (req, res) => {
  try {
    const cabin = await Cabin.findByIdAndUpdate(req.params.id, {
      ...req.body, updatedBy: req.user.id,
      coordinatePoint: {
        type: 'Point',
        coordinates: [req.body.location.coordinates.latitude, req.body.location.coordinates.longitude]
      },
    }, {
      new: true,
      runValidators: true
    });

    if (!cabin) {
      return res.status(404).json({
        success: false,
        message: 'Cabin not found'
      });
    }
    await Seat.updateMany(
      { cabinId: req.params.id },
      { $set: { price: req.body.price } },
      { runValidators: true }
    );
    res.status(200).json({
      success: true,
      data: cabin
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete cabin
// @route   DELETE /api/cabins/:id
// @access  Private/Admin
exports.deleteCabin = async (req, res) => {
  try {
    const cabin = await Cabin.findById(req.params.id);

    if (!cabin) {
      return res.status(404).json({
        success: false,
        message: 'Cabin not found'
      });
    }

    // Instead of removing, mark as inactive
    cabin.isActive = false;
    cabin.updatedBy = req.user.id
    await cabin.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get cabins by category
// @route   GET /api/cabins/category/:category
// @access  Public
exports.getCabinsByCategory = async (req, res) => {
  try {
    const cabins = await Cabin.find({
      category: req.params.category,
      managerIds: [req.user._id],
      isActive: true
    });

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

// @desc    Get cabin statistics
// @route   GET /api/cabins/stats
// @access  Private/Admin
exports.getCabinStats = async (req, res) => {
  try {
    const stats = await Cabin.aggregate([
      {
        $match: {
          // managerIds : [req.user._id],
          vendorId: req.user.vendorId,
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Count active and inactive cabins
    const cabinCounts = await Cabin.aggregate([
      {
        $group: {
          _id: '$isActive',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format the counts into a more useful structure
    const activeCounts = {
      active: cabinCounts.find(count => count._id === true)?.count || 0,
      inactive: cabinCounts.find(count => count._id === false)?.count || 0,
      total: await Cabin.countDocuments()
    };

    res.status(200).json({
      success: true,
      data: {
        categoryStats: stats,
        activeCounts
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

// @desc    Bulk update cabins
// @route   POST /api/cabins/bulk-update
// @access  Private/Admin
exports.bulkUpdateCabins = async (req, res) => {
  try {
    const { cabins } = req.body;

    if (!cabins || !Array.isArray(cabins)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of cabins'
      });
    }

    const updatedCabins = [];

    for (const cabinData of cabins) {
      const { id, updates } = cabinData;

      const cabin = await Cabin.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );

      if (!cabin) {
        return res.status(404).json({
          success: false,
          message: `Cabin with ID ${id} not found`
        });
      }

      updatedCabins.push(cabin);
    }

    res.status(200).json({
      success: true,
      count: updatedCabins.length,
      data: updatedCabins
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get cabin with all seats
// @route   GET /api/cabins/:id/with-seats
// @access  Private/Admin
exports.getCabinWithSeats = async (req, res) => {
  try {
    const cabin = await Cabin.findById(req.params.id);

    if (!cabin) {
      return res.status(404).json({
        success: false,
        message: 'Cabin not found'
      });
    }

    // Get all seats for the cabin
    const seats = await Seat.find({ cabinId: cabin._id });

    res.status(200).json({
      success: true,
      data: {
        cabin,
        seats
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

// @desc    Restore cabin (mark as active)
// @route   PUT /api/cabins/:id/restore
// @access  Private/Admin
exports.restoreCabin = async (req, res) => {
  try {
    const cabin = await Cabin.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!cabin) {
      return res.status(404).json({
        success: false,
        message: 'Cabin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: cabin
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upload cabin image
// @route   POST /api/cabins/:id/image
// @access  Private/Hostel Manager
exports.uploadCabinImage = async (req, res) => {
  try {
    const cabin = await Cabin.findById(req.params.id);

    if (!cabin) {
      return res.status(404).json({
        success: false,
        message: 'Cabin not found'
      });
    }

    if (!req.files || !req.files.image) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const file = req.files.image;

    // Check file type
    if (!file.mimetype.startsWith('image')) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File size should be less than 5MB'
      });
    }

    // Create a unique filename
    const filename = `cabin_${cabin._id}_${uuidv4()}${path.extname(file.name)}`;

    // Move the file
    const filePath = path.join(CABIN_UPLOAD_DIR, filename);

    await file.mv(filePath);

    // Delete previous image if exists
    if (cabin.imageSrc) {
      const prevImagePath = path.join(__dirname, '../', cabin.imageSrc.replace(/^\//, ''));
      if (fs.existsSync(prevImagePath)) {
        fs.unlinkSync(prevImagePath);
      }
    }

    // Update cabin with new image
    cabin.imageSrc = `/uploads/cabins/${filename}`;
    await cabin.save();

    res.status(200).json({
      success: true,
      data: {
        url: cabin.imageSrc
      }
    });
  } catch (error) {
    console.error('Error uploading cabin image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Upload multiple cabin images
// @route   POST /api/cabins/:id/images
// @access  Private/Hostel Manager
exports.uploadCabinImages = async (req, res) => {
  try {
    const cabin = await Cabin.findById(req.params.id);

    if (!cabin) {
      return res.status(404).json({
        success: false,
        message: 'Cabin not found'
      });
    }

    if (!req.files || !req.files.images) {
      return res.status(400).json({
        success: false,
        message: 'Please upload files'
      });
    }

    // Convert to array if single file
    const files = Array.isArray(req.files.images)
      ? req.files.images
      : [req.files.images];

    const uploadedFiles = [];

    // Process each file
    for (const file of files) {
      // Check file type
      if (!file.mimetype.startsWith('image')) {
        continue;
      }

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        continue;
      }

      // Create a unique filename
      const filename = `cabin_${cabin._id}_${uuidv4()}${path.extname(file.name)}`;

      // Move the file
      const filePath = path.join(CABIN_UPLOAD_DIR, filename);

      await file.mv(filePath);

      uploadedFiles.push(`/uploads/cabins/${filename}`);
    }

    // Update cabin with new images
    cabin.images = [...cabin.images, ...uploadedFiles];
    await cabin.save();

    res.status(200).json({
      success: true,
      data: {
        urls: uploadedFiles
      }
    });
  } catch (error) {
    console.error('Error uploading cabin images:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete cabin image
// @route   DELETE /api/cabins/:id/image/:filename
// @access  Private/Hostel Manager
exports.deleteCabinImage = async (req, res) => {
  try {
    const cabin = await Cabin.findById(req.params.id);

    if (!cabin) {
      return res.status(404).json({
        success: false,
        message: 'Cabin not found'
      });
    }

    const filename = req.params.filename;
    const imagePath = `/uploads/cabins/${filename}`;

    // Check if this is the main image
    if (cabin.imageSrc === imagePath) {
      cabin.imageSrc = '';
      await cabin.save();
    }
    // Check if this is in additional images
    else if (cabin.images.includes(imagePath)) {
      cabin.images = cabin.images.filter(img => img !== imagePath);
      await cabin.save();
    } else {
      return res.status(404).json({
        success: false,
        message: 'Image not found in cabin'
      });
    }

    // Delete the file
    const filePath = path.join(CABIN_UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting cabin image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update room layout for a cabin
// @route   PUT /api/cabins/:id/room-layout
// @access  Private/HostelManager
exports.updateRoomLayout = async (req, res) => {
  try {
    const { roomElements } = req.body;

    if (!Array.isArray(roomElements)) {
      return res.status(400).json({
        success: false,
        message: 'Room elements must be an array'
      });
    }

    const cabin = await Cabin.findById(req.params.id);

    if (!cabin) {
      return res.status(404).json({
        success: false,
        message: 'Cabin not found'
      });
    }

    cabin.roomElements = roomElements;
    await cabin.save();

    res.status(200).json({
      success: true,
      data: cabin
    });
  } catch (err) {
    console.error('Error updating room layout:', err);
    res.status(500).json({
      success: false,
      message: 'Server error when updating room layout'
    });
  }
};
