const Vendor = require('../models/Vendor');
const VendorPayout = require('../models/VendorPayout');
const Booking = require('../models/Booking');
const Cabin = require('../models/Cabin');

// Get all vendors with pagination and filters
const getAllVendors = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = 'all',
      businessType,
      search,
      city,
      state,
      dateFrom,
      dateTo 
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    let filterQuery = {};
    
    if (status !== 'all') {
      filterQuery.status = status;
    }
    
    if (businessType) {
      filterQuery.businessType = businessType;
    }
    
    if (search) {
      filterQuery.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { vendorId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (city) {
      filterQuery['address.city'] = { $regex: city, $options: 'i' };
    }
    
    if (state) {
      filterQuery['address.state'] = { $regex: state, $options: 'i' };
    }
    
    if (dateFrom || dateTo) {
      filterQuery.createdAt = {};
      if (dateFrom) filterQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filterQuery.createdAt.$lte = new Date(dateTo);
    }

    // // Get vendors with pagination
    // const vendors = await Vendor.find(filterQuery)
    // .populate('VendorDocument')
    //   .sort({ createdAt: -1 })
    //   .skip(skip)
    //   .limit(limitNum)
    //   .populate('managerId', 'name email');

    const vendors = await Vendor.aggregate([
      { $match: filterQuery },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum },

      // Reverse populate VendorDocuments
      {
        $lookup: {
          from: 'vendordocuments', // this is the MongoDB collection name
          localField: '_id',
          foreignField: 'vendorId',
          as: 'documents'
        }
      },

      // Populate managerId from User model (normal lookup)
      {
        $lookup: {
          from: 'users',
          localField: 'managerId',
          foreignField: '_id',
          as: 'manager'
        }
      },
      {
        $unwind: {
          path: '$manager',
          preserveNullAndEmptyArrays: true
        }
      },

      // Optional: project fields you need
      {
        $project: {
          businessName: 1,
          phone: 1,
          address:1,
          bankDetails:1,
          businessDetails:1,
          businessName:1,
          businessType:1,
          commissionSettings:1,
          status:1,
          vendorId:1,
          totalRevenue:1,
          pendingPayout:1,
          contactPerson:1,
          email:1,
          documents: 1,
          'manager.name': 1,
          'manager.email': 1,
          createdAt: 1
        }
      }
    ]);



    const totalCount = await Vendor.countDocuments(filterQuery);
    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      data: {
        vendors,
        totalCount,
        totalPages,
        currentPage: pageNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get all vendors error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get single vendor by ID
const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vendor = await Vendor.findById(id)
      .populate('managerId', 'name email')
      .populate('employeeIds', 'name email')
      .populate('propertyIds', 'name location');

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Get vendor statistics
    const vendorCabins = await Cabin.find({ createdBy: vendor.managerId }).select('_id');
    const cabinIds = vendorCabins.map(cabin => cabin._id);
    
    const [totalBookings, totalRevenue] = await Promise.all([
      Booking.countDocuments({ cabinId: { $in: cabinIds } }),
      Booking.aggregate([
        { $match: { cabinId: { $in: cabinIds }, paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        ...vendor.toObject(),
        stats: {
          totalBookings,
          totalRevenue: totalRevenue[0]?.total || 0
        }
      }
    });
  } catch (error) {
    console.error('Get vendor by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update vendor status (approve/reject/suspend)
const updateVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes, rejectionReason, commissionRate } = req.body;

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    let updateData = {
      updatedAt: new Date()
    };

    switch (action) {
      case 'approve':
        updateData.status = 'approved';
        if (commissionRate) {
          updateData['commissionSettings.value'] = commissionRate;
        }
        break;
      case 'reject':
        updateData.status = 'rejected';
        if (!rejectionReason) {
          return res.status(400).json({ 
            success: false, 
            message: 'Rejection reason is required' 
          });
        }
        break;
      case 'suspend':
        updateData.status = 'suspended';
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid action' 
        });
    }

    const updatedVendor = await Vendor.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    // Log the action (you can implement audit logging here)
    console.log(`Vendor ${id} ${action}ed by admin ${req.user.id}`, {
      notes,
      rejectionReason,
      commissionRate
    });

    res.json({
      success: true,
      data: updatedVendor,
      message: `Vendor ${action}ed successfully`
    });
  } catch (error) {
    console.error('Update vendor status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update vendor details
const updateVendorDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.vendorId;
    delete updateData.createdAt;
    delete updateData.status; // Status should be updated through separate endpoint

    // Update timestamp
    updateData.updatedAt = new Date();

    const updatedVendor = await Vendor.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Log the action
    console.log(`Vendor ${id} details updated by admin ${req.user.id}`);

    res.json({
      success: true,
      data: updatedVendor,
      message: 'Vendor details updated successfully'
    });
  } catch (error) {
    console.error('Update vendor details error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get vendor statistics
const getVendorStats = async (req, res) => {
  try {
    const [
      totalVendors,
      pendingApprovals,
      approvedVendors,
      rejectedVendors,
      suspendedVendors
    ] = await Promise.all([
      Vendor.countDocuments(),
      Vendor.countDocuments({ status: 'pending' }),
      Vendor.countDocuments({ status: 'approved' }),
      Vendor.countDocuments({ status: 'rejected' }),
      Vendor.countDocuments({ status: 'suspended' })
    ]);

    // Calculate total revenue from all vendors
    const revenueResult = await Booking.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    // Calculate monthly growth
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const [currentMonthVendors, lastMonthVendors] = await Promise.all([
      Vendor.countDocuments({ 
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      }),
      Vendor.countDocuments({ 
        createdAt: { 
          $gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
          $lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      })
    ]);

    const monthlyGrowth = lastMonthVendors > 0 
      ? Math.round(((currentMonthVendors - lastMonthVendors) / lastMonthVendors) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        totalVendors,
        pendingApprovals,
        approvedVendors,
        rejectedVendors,
        suspendedVendors,
        totalRevenue: revenueResult[0]?.total || 0,
        monthlyGrowth
      }
    });
  } catch (error) {
    console.error('Get vendor stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Export vendors data
const exportVendorsData = async (req, res) => {
  try {
    const { status, businessType, search, city, state } = req.query;
    
    // Build filter query (same as getAllVendors)
    let filterQuery = {};
    
    if (status && status !== 'all') {
      filterQuery.status = status;
    }
    
    if (businessType) {
      filterQuery.businessType = businessType;
    }
    
    if (search) {
      filterQuery.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { vendorId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (city) {
      filterQuery['address.city'] = { $regex: city, $options: 'i' };
    }
    
    if (state) {
      filterQuery['address.state'] = { $regex: state, $options: 'i' };
    }

    const vendors = await Vendor.find(filterQuery)
      .sort({ createdAt: -1 })
      .populate('managerId', 'name email');

    // Create Excel data (you would use a library like xlsx here)
    const exportData = vendors.map(vendor => ({
      'Vendor ID': vendor.vendorId,
      'Business Name': vendor.businessName,
      'Contact Person': vendor.contactPerson,
      'Email': vendor.email,
      'Phone': vendor.phone,
      'Business Type': vendor.businessType,
      'Status': vendor.status,
      'City': vendor.address.city,
      'State': vendor.address.state,
      'Total Revenue': vendor.totalRevenue,
      'Created At': vendor.createdAt.toISOString().split('T')[0]
    }));

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Export vendors error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all vendor payout requests
const getAllPayouts = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, startDate, endDate } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }
    // Date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) query.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
    }
    const skip = (page - 1) * limit;
    
    const payouts = await VendorPayout.find(query)
      .populate('vendorId', 'businessName email phone bankDetails')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalPayouts = await VendorPayout.countDocuments(query);
    
    res.json({
      success: true,
      data: payouts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPayouts / limit),
        totalRecords: totalPayouts,
        hasNextPage: page * limit < totalPayouts
      }
    });
  } catch (error) {
    console.error('Get all payouts error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Process payout request (approve/reject)
const processPayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, transactionId } = req.body;
    
    if (!['completed', 'failed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be completed, failed, or cancelled'
      });
    }
    
    const payout = await VendorPayout.findById(id);
    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Payout request not found'
      });
    }
    
    if (payout.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Payout has already been processed'
      });
    }
    
    payout.status = status;
    payout.processedAt = new Date();
    payout.notes = notes;
    if (transactionId) {
      payout.transactionId = transactionId;
    }
    
    await payout.save();
    
    // Update vendor's pending payout
    const vendor = await Vendor.findById(payout.vendorId);
    if (vendor && status === 'completed') {
      vendor.pendingPayout = Math.max(0, vendor.pendingPayout - payout.amount);
      await vendor.save();
    }
    
    res.json({
      success: true,
      data: payout,
      message: `Payout ${status} successfully`
    });
  } catch (error) {
    console.error('Process payout error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get system-wide analytics
const getSystemAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'today':
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = { createdAt: { $gte: startOfDay } };
        break;
      case 'week':
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { createdAt: { $gte: startOfWeek } };
        break;
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { createdAt: { $gte: startOfMonth } };
        break;
    }
    
    const [
      totalVendors,
      activeVendors,
      totalPayouts,
      pendingPayouts,
      completedPayouts,
      totalPayoutAmount,
      recentBookings
    ] = await Promise.all([
      Vendor.countDocuments(),
      Vendor.countDocuments({ status: 'approved', isActive: true }),
      VendorPayout.countDocuments(dateFilter),
      VendorPayout.countDocuments({ ...dateFilter, status: 'pending' }),
      VendorPayout.countDocuments({ ...dateFilter, status: 'completed' }),
      VendorPayout.aggregate([
        { $match: { ...dateFilter, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Booking.countDocuments({ ...dateFilter, paymentStatus: 'completed' })
    ]);
    
    const analytics = {
      vendors: {
        total: totalVendors,
        active: activeVendors
      },
      payouts: {
        total: totalPayouts,
        pending: pendingPayouts,
        completed: completedPayouts,
        totalAmount: totalPayoutAmount[0]?.total || 0
      },
      bookings: {
        recent: recentBookings
      }
    };
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get system analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getAllVendors,
  getVendorById,
  updateVendorStatus,
  updateVendorDetails,
  getVendorStats,
  exportVendorsData,
  getAllPayouts,
  processPayout,
  getSystemAnalytics
};
