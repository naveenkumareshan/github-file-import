
const Review = require('../models/Review');
const Cabin = require('../models/Cabin');
const Hostel = require('../models/Hostel');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
exports.getReviews = async (req, res) => {
  try {
    const { entityType, entityId, approved, page = 1, limit = 10 } = req.query;
    
    const query = {};
    
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;
    if (approved === 'true') query.isApproved = true;
    if (approved === 'false') query.isApproved = false;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const total = await Review.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    const reviews = await Review.find(query)
      .populate('userId', 'name profilePicture')
      .populate('entityId','name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      totalPages,
      currentPage: pageNum,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
exports.getAdminReviews = async (req, res) => {
  // try {
    const { entityType, entityId, approved, page = 1, limit = 10 } = req.query;
    
  //   const query = {};
    
  //   if (entityType) query.entityType = entityType;
  //   if (entityId) query.entityId = entityId;
  //   if (approved === 'true') query.isApproved = true;
  //   if (approved === 'false') query.isApproved = false;


        
  //   if (req.user.role !== 'admin') {
  //     query.entityId.vendorId = req.user.vendorId;
  //   }
    
  //   const pageNum = parseInt(page);
  //   const limitNum = parseInt(limit);
  //   const skip = (pageNum - 1) * limitNum;
    
  //   const total = await Review.countDocuments(query);
  //   const totalPages = Math.ceil(total / limitNum);

  //   const reviews = await Review.find(query)
  //     .populate('userId', 'name profilePicture')
  //     .populate('entityId','name vendorId')
  //     .sort({ createdAt: -1 })
  //     .skip(skip)
  //     .limit(limitNum);
    
  //   res.status(200).json({
  //     success: true,
  //     count: reviews.length,
  //     total,
  //     totalPages,
  //     currentPage: pageNum,
  //     hasNextPage: pageNum < totalPages,
  //     hasPrevPage: pageNum > 1,
  //     data: reviews
  //   });
  // } catch (error) {
  //   res.status(500).json({
  //     success: false,
  //     message: 'Server error',
  //     error: error.message
  //   });
  // }

  const isAdmin = req.user.role === 'admin';
  const vendorId = (req.user.vendorId);
  const pageNum = parseInt(req.query.page) || 1;
  const limitNum = parseInt(req.query.limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const baseMatch = {
    entityType: entityType // or 'hostel' if needed
  };

  var table = 'cabins';
  if(entityType != 'Cabin'){
    table = 'hotels';
  }

  // Optional status filter
  if (req.query.status === 'approved') baseMatch.isApproved = true;
  if (req.query.status === 'pending') baseMatch.isApproved = false;

  const pipeline = [
    { $match: baseMatch },

    // Join cabin
    {
      $lookup: {
        from: table, // or 'hostels'
        localField: 'entityId',
        foreignField: '_id',
        as: 'entityData'
      }
    },
    { $unwind: '$entityData' },

    // Vendor filtering if not admin
    ...(isAdmin
      ? []
      : [
          {
            $match: {
              'entityData.vendorId': vendorId
            }
          }
        ]),

    // Join user info
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userData'
      }
    },
    { $unwind: '$userData' },

    // Sort + Pagination
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limitNum },

    // Final projection
    {
      $project: {
        _id: 1,
        title: 1,
        comment: 1,
        rating: 1,
        isApproved: 1,
        entityType: 1,
        createdAt: 1,
        'entityData._id': 1,
        'entityData.name': 1,
        'entityData.vendorId': 1,
        'userData.name': 1,
        'userData.profilePicture': 1
      }
    }
  ];

  // Run main query
  const reviews = await Review.aggregate(pipeline);

  // Count total for pagination
  const countPipeline = [
    { $match: baseMatch },
    {
      $lookup: {
        from: table,
        localField: 'entityId',
        foreignField: '_id',
        as: 'entityData'
      }
    },
    { $unwind: '$entityData' },
    ...(isAdmin
      ? []
      : [
          {
            $match: {
              'entityData.vendorId': vendorId
            }
          }
        ]),
    { $count: 'total' }
  ];

  const totalResult = await Review.aggregate(countPipeline);
  const total = totalResult[0]?.total || 0;
  const totalPages = Math.ceil(total / limitNum);

  // Respond
  res.status(200).json({
    success: true,
    count: reviews.length,
    total,
    totalPages,
    currentPage: pageNum,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
    data: reviews
  });

};

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Public
exports.getReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate('userId', 'name avatar');
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const { entityType, entityId, rating, title, comment } = req.body;
    
    // Check if entity exists
    let entity;
    if (entityType === 'Cabin') {
      entity = await Cabin.findById(entityId);
    } else if (entityType === 'Hostel') {
      entity = await Hostel.findById(entityId);
    }
    
    if (!entity) {
      return res.status(404).json({
        success: false,
        message: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} not found`
      });
    }
    
    // Check if user already submitted a review for this entity
    const existingReview = await Review.findOne({
      userId: req.user.id,
      entityId,
      entityType
    });
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: `You have already submitted a review for this ${entityType}`
      });
    }
    
    // Create review
    const review = await Review.create({
      userId: req.user.id,
      entityType,
      entityId,
      rating,
      title,
      comment,
      isApproved: req.user.role === 'admin' || req.user.role === 'hostel_manager' ? true : false
    });
    
    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res) => {
  try {
    let review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Make sure user is review owner or admin
    if (review.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }
    
    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Make sure user is review owner or admin
    if (review.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }
    
    await review.deleteOne();
    
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

// @desc    Approve review
// @route   PUT /api/reviews/:id/approve
// @access  Private/Admin/HostelManager
exports.approveReview = async (req, res) => {
  try {
    let review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // For hostel managers, check if they manage the entity being reviewed
    if (req.user.role === 'hostel_manager') {
      let hasAccess = false;
      
      if (review.entityType === 'cabin') {
        const cabin = await Cabin.findById(review.entityId);
        if (cabin && cabin.createdBy.toString() === req.user.id) {
          hasAccess = true;
        }
      } else if (review.entityType === 'hostel') {
        const hostel = await Hostel.findById(review.entityId);
        if (hostel && hostel.createdBy.toString() === req.user.id) {
          hasAccess = true;
        }
      }
      
      if (!hasAccess) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized to approve this review'
        });
      }
    }
    
    review = await Review.findByIdAndUpdate(req.params.id, { isApproved: true }, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get entity average rating
// @route   GET /api/reviews/rating/:entityType/:entityId
// @access  Public
exports.getEntityRating = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    const result = await Review.aggregate([
      {
        $match: {
          entityType,
          entityId: mongoose.Types.ObjectId(entityId),
          isApproved: true
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);
    
    if (result.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          averageRating: 0,
          reviewCount: 0
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        averageRating: result[0].averageRating,
        reviewCount: result[0].reviewCount
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

// @desc    Get reviews by user
// @route   GET /api/reviews/user
// @access  Private
exports.getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
