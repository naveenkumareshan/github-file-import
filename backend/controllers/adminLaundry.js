
const LaundryMenuItem = require('../models/LaundryMenuItem');
const LaundryOrder = require('../models/LaundryOrder');
const mongoose = require('mongoose');

// @desc    Get all menu items
// @route   GET /api/admin/laundry/menu
// @access  Private/Admin
exports.getAllMenuItems = async (req, res) => {
  try {
    const menuItems = await LaundryMenuItem.find().sort('name');

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create menu item
// @route   POST /api/admin/laundry/menu
// @access  Private/Admin
exports.createMenuItem = async (req, res) => {
  try {
    const menuItem = await LaundryMenuItem.create(req.body);

    res.status(201).json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update menu item
// @route   PUT /api/admin/laundry/menu/:id
// @access  Private/Admin
exports.updateMenuItem = async (req, res) => {
  try {
    const menuItem = await LaundryMenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete menu item
// @route   DELETE /api/admin/laundry/menu/:id
// @access  Private/Admin
exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await LaundryMenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    await menuItem.remove();

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

// @desc    Get all orders
// @route   GET /api/admin/laundry/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
      status,
      startDate,
      endDate,
      userId,
      block,
      floor
    } = req.query;
    
    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (userId) {
      query.userId = userId;
    }
    
    if (block) {
      query['pickupLocation.block'] = block;
    }
    
    if (floor) {
      query['pickupLocation.floor'] = floor;
    }
    
    if (startDate) {
      query.requestDate = { $gte: new Date(startDate) };
    }
    
    if (endDate) {
      if (query.requestDate) {
        query.requestDate.$lte = new Date(endDate);
      } else {
        query.requestDate = { $lte: new Date(endDate) };
      }
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Create sort object
    const sort = {};
    sort[sortBy] = order === 'asc' ? 1 : -1;
    
    const orders = await LaundryOrder.find(query)
      .populate('userId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
      
    // Get total count for pagination
    const total = await LaundryOrder.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: orders.length,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/admin/laundry/orders/:id
// @access  Private/Admin
exports.getOrderById = async (req, res) => {
  try {
    const order = await LaundryOrder.findById(req.params.id)
      .populate('userId', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update order status
// @route   PUT /api/admin/laundry/orders/:id
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, deliveryDate } = req.body;
    
    const order = await LaundryOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status || order.status;
    
    if (deliveryDate) {
      order.deliveryDate = deliveryDate;
    }
    
    // If status is "Delivered", set delivery date to now if not provided
    if (status === 'Delivered' && !deliveryDate) {
      order.deliveryDate = new Date();
    }
    
    await order.save();

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete order
// @route   DELETE /api/admin/laundry/orders/:id
// @access  Private/Admin
exports.deleteOrder = async (req, res) => {
  try {
    const order = await LaundryOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.remove();

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

// @desc    Get all complaints
// @route   GET /api/admin/laundry/complaints
// @access  Private/Admin
exports.getAllComplaints = async (req, res) => {
  try {
    // Find orders with complaints
    const orders = await LaundryOrder.find({ 
      'complaints.status': 'Pending' 
    }).populate('userId', 'name email');
    
    // Format complaints for easier access
    const complaints = orders.flatMap(order => {
      return order.complaints
        .filter(complaint => complaint.status === 'Pending')
        .map(complaint => ({
          orderId: order._id,
          orderNumber: order.orderNumber,
          userId: order.userId,
          complaintText: complaint.text,
          complaintDate: complaint.date,
          complaintStatus: complaint.status
        }));
    });

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Resolve complaint
// @route   PUT /api/admin/laundry/complaints/:id/resolve
// @access  Private/Admin
exports.resolveComplaint = async (req, res) => {
  try {
    const { orderId, complaintIndex, resolution } = req.body;
    
    const order = await LaundryOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if complaint exists
    if (!order.complaints[complaintIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Update complaint status
    order.complaints[complaintIndex].status = 'Resolved';
    
    // Add resolution note if provided
    if (resolution) {
      order.complaints[complaintIndex].resolution = resolution;
    }
    
    await order.save();

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get order reports
// @route   GET /api/admin/laundry/reports
// @access  Private/Admin
exports.getOrderReports = async (req, res) => {
  try {
    const { 
      startDate,
      endDate,
      status
    } = req.query;
    
    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (startDate) {
      query.requestDate = { $gte: new Date(startDate) };
    }
    
    if (endDate) {
      if (query.requestDate) {
        query.requestDate.$lte = new Date(endDate);
      } else {
        query.requestDate = { $lte: new Date(endDate) };
      }
    }
    
    const orders = await LaundryOrder.find(query)
      .populate('userId', 'name email')
      .sort({ requestDate: -1 });
      
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get order statistics
// @route   GET /api/admin/laundry/statistics
// @access  Private/Admin
exports.getOrderStatistics = async (req, res) => {
  try {
    const { timeRange = 'monthly' } = req.query;
    
    // Current date
    const now = new Date();
    let startDate = new Date();
    
    // Set start date based on time range
    switch(timeRange) {
      case 'daily':
        startDate.setDate(now.getDate() - 30); // Last 30 days
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 90); // Last 90 days
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 12); // Last 12 months
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 5); // Last 5 years
        break;
      default:
        startDate.setMonth(now.getMonth() - 12); // Default to last 12 months
    }
    
    // Get total orders for the period
    const totalOrders = await LaundryOrder.countDocuments({
      requestDate: { $gte: startDate }
    });
    
    // Get orders by status
    const ordersByStatus = await LaundryOrder.aggregate([
      {
        $match: { requestDate: { $gte: startDate } }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get orders by month
    const ordersByMonth = await LaundryOrder.aggregate([
      {
        $match: { requestDate: { $gte: startDate } }
      },
      {
        $group: {
          _id: {
            year: { $year: '$requestDate' },
            month: { $month: '$requestDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          year: '$_id.year',
          month: '$_id.month',
          count: 1
        }
      }
    ]);
    
    // Get average processing time
    const ordersWithDelivery = await LaundryOrder.find({
      requestDate: { $gte: startDate },
      status: 'Delivered',
      deliveryDate: { $exists: true }
    });
    
    let averageProcessingTime = 0;
    
    if (ordersWithDelivery.length > 0) {
      const totalProcessingTime = ordersWithDelivery.reduce((sum, order) => {
        const processingTime = new Date(order.deliveryDate).getTime() - new Date(order.requestDate).getTime();
        return sum + processingTime;
      }, 0);
      
      // Average processing time in hours
      averageProcessingTime = totalProcessingTime / (ordersWithDelivery.length * 1000 * 60 * 60);
    }
    
    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        ordersByStatus,
        ordersByMonth,
        averageProcessingTime
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

// @desc    Get revenue by category
// @route   GET /api/admin/laundry/revenue-by-category
// @access  Private/Admin
exports.getRevenueByCategory = async (req, res) => {
  try {
    const { timeRange = 'monthly' } = req.query;
    
    // Current date
    const now = new Date();
    let startDate = new Date();
    
    // Set start date based on time range
    switch(timeRange) {
      case 'daily':
        startDate.setDate(now.getDate() - 30); // Last 30 days
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 90); // Last 90 days
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 12); // Last 12 months
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 5); // Last 5 years
        break;
      default:
        startDate.setMonth(now.getMonth() - 12); // Default to last 12 months
    }
    
    // Get total revenue
    const result = await LaundryOrder.aggregate([
      {
        $match: {
          requestDate: { $gte: startDate },
          status: 'Delivered'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      }
    ]);
    
    // Get revenue by item category
    const revenueByItem = await LaundryOrder.aggregate([
      {
        $match: {
          requestDate: { $gte: startDate },
          status: 'Delivered'
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.name',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          itemCount: { $sum: '$items.quantity' }
        }
      },
      {
        $sort: { revenue: -1 }
      },
      {
        $project: {
          itemName: '$_id',
          revenue: 1,
          itemCount: 1
        }
      }
    ]);
    
    // Get revenue by month
    const revenueByMonth = await LaundryOrder.aggregate([
      {
        $match: {
          requestDate: { $gte: startDate },
          status: 'Delivered'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$requestDate' },
            month: { $month: '$requestDate' }
          },
          revenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          year: '$_id.year',
          month: '$_id.month',
          revenue: 1,
          orderCount: 1
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalRevenue: result.length > 0 ? result[0].totalRevenue : 0,
        totalOrders: result.length > 0 ? result[0].orderCount : 0,
        revenueByItem,
        revenueByMonth
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

// @desc    Get block distribution
// @route   GET /api/admin/laundry/block-distribution
// @access  Private/Admin
exports.getBlockDistribution = async (req, res) => {
  try {
    // Get distribution by block
    const blockDistribution = await LaundryOrder.aggregate([
      {
        $group: {
          _id: '$pickupLocation.block',
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { orderCount: -1 }
      },
      {
        $project: {
          block: '$_id',
          orderCount: 1,
          totalRevenue: 1
        }
      }
    ]);
    
    // Get distribution by floor
    const floorDistribution = await LaundryOrder.aggregate([
      {
        $group: {
          _id: {
            block: '$pickupLocation.block',
            floor: '$pickupLocation.floor'
          },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { orderCount: -1 }
      },
      {
        $project: {
          block: '$_id.block',
          floor: '$_id.floor',
          orderCount: 1
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        blockDistribution,
        floorDistribution
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

// @desc    Bulk update order status
// @route   PUT /api/admin/laundry/orders/bulk-status
// @access  Private/Admin
exports.bulkUpdateOrderStatus = async (req, res) => {
  try {
    const { orderIds, status } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order IDs are required'
      });
    }
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    // Update delivery date if status is Delivered
    const updateData = { status };
    if (status === 'Delivered') {
      updateData.deliveryDate = new Date();
    }
    
    // Convert string IDs to ObjectIDs
    const objectIds = orderIds.map(id => mongoose.Types.ObjectId(id));
    
    // Bulk update
    const result = await LaundryOrder.updateMany(
      { _id: { $in: objectIds } },
      { $set: updateData }
    );
    
    res.status(200).json({
      success: true,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
