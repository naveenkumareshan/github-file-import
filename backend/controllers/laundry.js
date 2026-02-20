
const LaundryMenuItem = require('../models/LaundryMenuItem');
const LaundryOrder = require('../models/LaundryOrder');

// @desc    Get all laundry menu items
// @route   GET /api/laundry/menu
// @access  Public
exports.getLaundryMenuItems = async (req, res) => {
  try {
    const menuItems = await LaundryMenuItem.find();

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

// @desc    Create new laundry menu item
// @route   POST /api/laundry/menu
// @access  Private/Admin
exports.createLaundryMenuItem = async (req, res) => {
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

// @desc    Delete laundry menu item
// @route   DELETE /api/laundry/menu/:id
// @access  Private/Admin
exports.deleteLaundryMenuItem = async (req, res) => {
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

// @desc    Create new laundry order
// @route   POST /api/laundry/orders
// @access  Private
exports.createLaundryOrder = async (req, res) => {
  try {
    // Add user ID to request body
    req.body.userId = req.user.id;
    
    const order = await LaundryOrder.create(req.body);

    res.status(201).json({
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

// @desc    Get user laundry orders
// @route   GET /api/laundry/orders/user
// @access  Private
exports.getUserLaundryOrders = async (req, res) => {
  try {
    const orders = await LaundryOrder.find({ userId: req.user.id })
      .sort('-createdAt');

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

// @desc    Get all laundry orders
// @route   GET /api/laundry/orders
// @access  Private/Admin
exports.getAllLaundryOrders = async (req, res) => {
  try {
    // Add query parameters for filtering
    const query = { ...req.query };
    
    // Allow filtering by status
    const orders = await LaundryOrder.find(query)
      .populate('userId', 'name email')
      .sort('-createdAt');

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

// @desc    Update laundry order status
// @route   PUT /api/laundry/orders/:id/status
// @access  Private/Admin
exports.updateLaundryOrderStatus = async (req, res) => {
  try {
    const { status, deliveryDate } = req.body;
    
    const order = await LaundryOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    
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

// @desc    Create complaint for laundry order
// @route   POST /api/laundry/orders/:id/complaints
// @access  Private
exports.createLaundryComplaint = async (req, res) => {
  try {
    const order = await LaundryOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order belongs to user
    if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create complaint for this order'
      });
    }

    // Add complaint
    order.complaints.push({
      text: req.body.text
    });
    
    await order.save();

    res.status(201).json({
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

// @desc    Resolve complaint
// @route   PUT /api/laundry/complaints/:id/resolve
// @access  Private/Admin
exports.resolveLaundryComplaint = async (req, res) => {
  try {
    const { orderId, complaintIndex } = req.body;
    
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
