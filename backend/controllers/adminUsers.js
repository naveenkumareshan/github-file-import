
const { default: mongoose } = require('mongoose');
const Booking = require('../models/Booking');
const Cabin = require('../models/Cabin');
const User = require('../models/User');

// @desc    Get all Users (admin)
// @route   GET /api/admin/Users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    // Add query parameters for filtering
    const query = {};
    
    // Handle includeInactive parameter
    if (req.query.includeInactive === 'true') {
      // Include both active and inactive users
    } else if (req.query.includeInactive === 'false') {
      query.isActive = true;
    } else {
      // Default to showing only active users
      query.isActive = true;
    }
    
    // Handle search functionality - make sure to handle phone properly
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: { $type: "string", $regex: searchRegex } } // Ensure phone is string type
      ];
    }
    
    // Role filter
    if (req.query.role) {
      query.role = req.query.role;
    }
    

    if(req.user.role !=='admin'){
 
      if(req.query.role =='student'){
        if(req.user.role == 'vendor'){
          query.vendorIds = req.user.vendorId;
        }else{
          query.vendorIds = req.user.vendorId;
        }
      }else{
        if(req.user.role == 'vendor'){
          query.vendorIds = req.user.vendorId;
        }else{
          query.vendorIds = req.user.vendorId;
        }
      }
    }else{
      if(req.query.role =='vendor_employee'){
          
      }
    }
    // Finding resource
    let usersQuery = User.find(query);
    

    console.log(query)
    // Sorting
    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    usersQuery = usersQuery.sort({ [sortBy]: order });

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    // Count total documents for pagination
    const total = await User.countDocuments(query);
    
    usersQuery = usersQuery.skip(startIndex).limit(limit);
    
    // Executing query
    const users = await usersQuery;
    
    // Get booking counts for each user
    const usersWithBookings = await Promise.all(
      users.map(async (user) => {
        const totalBookings = await Booking.countDocuments({ userId: user._id });
        const activeBookings = await Booking.countDocuments({ 
          userId: user._id, 
          paymentStatus: 'completed',
          endDate: { $gte: new Date() }
        });
        
        // Convert user to plain object and add booking counts
        const userObj = user.toObject();
        return {
          ...userObj,
          bookingsCount: totalBookings,
          activeBookings: activeBookings
        };
      })
    );
    
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
    
    pagination.totalPages = Math.ceil(total / limit);
    pagination.currentPage = page;
    pagination.hasNext = endIndex < total;
    pagination.hasPrev = startIndex > 0;


    res.status(200).json({
      success: true,
      count: usersWithBookings.length,
      totalCount: total,
      pagination,
      data: usersWithBookings
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


// @desc    Get single user by ID (admin)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(new mongoose.Types.ObjectId(req.params.id)).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get booking counts
    const totalBookings = await Booking.countDocuments({ userId: user._id });
    const activeBookings = await Booking.countDocuments({ 
      userId: user._id, 
      paymentStatus: 'completed',
      endDate: { $gte: new Date() }
    });

    const userObj = user.toObject();
    const userWithBookings = {
      ...userObj,
      bookingsCount: totalBookings,
      activeBookings: activeBookings
    };

    res.status(200).json({
      success: true,
      data: userWithBookings
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user (admin)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, gender, isActive, address, bio, courseStudying, collegeStudied, parentMobileNumber } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields if provided
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (gender !== undefined) user.gender = gender;
    if (isActive !== undefined) user.isActive = isActive;
    if (address !== undefined) user.address = address;
    if (bio !== undefined) user.bio = bio;
    if (courseStudying !== undefined) user.courseStudying = courseStudying;
    if (collegeStudied !== undefined) user.collegeStudied = collegeStudied;
    if (parentMobileNumber !== undefined) user.parentMobileNumber = parentMobileNumber;

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(user._id).select('-password');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      startDate, 
      endDate,
      cabinId,
      userId
    } = req.query;

    const queryOptions = {};

    // Apply filters if provided
    if (status) queryOptions.paymentStatus = status;
    if (cabinId) queryOptions.cabinId = cabinId;
    if (userId) queryOptions.userId = userId;

    // Date range filtering
    if (startDate || endDate) {
      queryOptions.startDate = {};
      if (startDate) queryOptions.startDate.$gte = new Date(startDate);
      if (endDate) queryOptions.endDate = { $lte: new Date(endDate) };
    }

    if (req.user.role !== 'admin') {
      // Find cabin IDs owned by the current user
      const userCabins = await Cabin.find({ managerIds: req.user._id }, '_id');
      const cabinIds = userCabins.map(c =>  c._id);

      // Filter bookings to only those belonging to cabins owned by the user
      queryOptions.cabinId = { $in: cabinIds };
    }

    // Count total matching documents for pagination
    const totalDocs = await Booking.countDocuments(queryOptions);
    
    // Execute query with pagination
    const bookings = await Booking.find(queryOptions)
      .populate('cabinId','name category cabinCode')
      .populate('seatId')
      .populate('userId', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      totalPages: Math.ceil(totalDocs / limit),
      currentPage: page,
      data: bookings
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};


exports.CreateUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, gender } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      const vendorId = req.user.vendorId;

      if (user.vendorIds?.includes(vendorId)) {
        return res.status(400).json({
          success: false,
          message: 'This email is already registered with us',
        });
      }
      // ✅ User exists but not linked to this vendor → add vendorId
      await User.findByIdAndUpdate(
        user._id,
        { $addToSet: { vendorIds: vendorId } }, // prevents duplicates
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: 'User linked to vendor successfully',
      });
    }

    let phonecheck = await User.findOne({ phone });

    

    if (phonecheck) {
      const vendorId = req.user.vendorId;

      if (phonecheck.vendorIds?.includes(vendorId)) {
        return res.status(400).json({
          success: false,
          message: 'This email is already registered with us',
        });
      }
      // ✅ User exists but not linked to this vendor → add vendorId
      await phonecheck.findByIdAndUpdate(
        phonecheck._id,
        { $addToSet: { vendorIds: vendorId } }, // prevents duplicates
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: 'User linked to vendor successfully',
      });
    }

    // Validate role
    const allowedRoles = ['student', 'hostel_manager'];
    const finalRole = role && allowedRoles.includes(role) ? role : 'student';

    // Create user
    user = await User.create({
      name,
      email,
      password,
      role: finalRole,
      phone,
      gender,
      vendorIds:[req.user.vendorId]
    });

    // Generate token
    const token = user.getSignedJwtToken();

       // Send welcome email asynchronously
    try {
      const jobId = jobProcessor.addJob('send_welcome_email', {
        email: user.email,
        name: user.name
      }, 'normal');
      console.log('Welcome email job queued:', jobId);
    } catch (emailError) {
      console.error('Failed to queue welcome email:', emailError);
      // Don't fail registration if email queuing fails
    }

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions
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