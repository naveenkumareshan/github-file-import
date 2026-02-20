const VendorEmployee = require('../models/VendorEmployee');
const VendorPayout = require('../models/VendorPayout');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const Cabin = require('../models/Cabin');
const Vendor = require('../models/Vendor');
const AutoPayoutService = require('../services/autoPayoutService');
const Transaction = require('../models/Transaction');

// Helper function to get date ranges
const getDateRange = (period) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return {
        startDate: today,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    case 'this_week':
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return {
        startDate: startOfWeek,
        endDate: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
      };
    case 'this_month':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      };
    case 'last_month':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        endDate: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      };
    case 'this_year':
      return {
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: new Date(now.getFullYear(), 11, 31, 23, 59, 59)
      };
    case 'last_year':
      return {
        startDate: new Date(now.getFullYear() - 1, 0, 1),
        endDate: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59)
      };
    default:
      return null;
  }
};

// Dashboard Stats
const getDashboardStats = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    
    const totalCabins = await Cabin.countDocuments({ createdBy: vendorId });
    const totalSeats = await Seat.countDocuments({ 
      cabinId: { $in: await Cabin.find({ vendorId: vendorId }).select('_id') }
    });
    const activeBookings = await Booking.countDocuments({ 
      cabinId: { $in: await Cabin.find({ vendorId: vendorId }).select('_id') },
      status: 'active'
    });
    const totalRevenue = await Booking.aggregate([
      { 
        $lookup: {
          from: 'cabins',
          localField: 'cabinId',
          foreignField: '_id',
          as: 'cabin'
        }
      },
      { $match: { 'cabin.createdBy': vendorId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalCabins,
        totalSeats,
        activeBookings,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Enhanced vendor income analytics with detailed commission breakdown
const getVendorIncome = async (req, res) => {
  try {
    const { dateFilter, startDate, endDate } = req.query;
   
    var vendorId = null;
    if(req.user.role == 'vendor'){
      vendorId = req.user.vendorId
    }else{
      vendorId = req.user.vendorId;
    }
    // Get vendor's cabins
    const vendorCabins = await Cabin.find({ vendorId: vendorId }).select('_id');
    const cabinIds = vendorCabins.map(cabin => cabin._id);
    
    // Get vendor commission settings
    const vendor = await Vendor.findById(req.user.vendorId);
    const commissionRate = vendor.commissionSettings.type === 'percentage' 
      ? vendor.commissionSettings.value / 100 
      : 0.2; // Default 20%
    
    const now = new Date();
    
    // Calculate different time periods
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const endOfYesterday = new Date(startOfToday.getTime() - 1);
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Base query for bookings
    let baseQuery = {
      cabinId: { $in: cabinIds },
      paymentStatus: 'completed',
      status: 'completed'
    };

    // Add date filter if specified
    if (dateFilter && dateFilter !== 'custom') {
      const dateRange = getDateRange(dateFilter);
      if (dateRange) {
        baseQuery.createdAt = {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate
        };
      }
    } else if (startDate || endDate) {
      baseQuery.createdAt = {};
      if (startDate) baseQuery.createdAt.$gte = new Date(startDate);
      if (endDate) baseQuery.createdAt.$lte = new Date(endDate);
    }
    
    // Get bookings for each period with commission details
    const [todayBookings, yesterdayBookings, weekBookings, monthBookings] = await Promise.all([
      Booking.find({
        ...baseQuery,
        createdAt: { $gte: startOfToday }
      }).populate('cabinId', 'name').populate('seatId', 'number'),
      Booking.find({
        ...baseQuery,
        createdAt: { $gte: startOfYesterday, $lt: endOfYesterday }
      }).populate('cabinId', 'name').populate('seatId', 'number'),
      Booking.find({
        ...baseQuery,
        createdAt: { $gte: startOfWeek }
      }).populate('cabinId', 'name').populate('seatId', 'number'),
      Booking.find({
        ...baseQuery,
        createdAt: { $gte: startOfMonth }
      }).populate('cabinId', 'name').populate('seatId', 'number')
    ]);
    
    // Enhanced income calculation with detailed breakdown
    const calculateDetailedIncome = (bookings) => {
      const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
      const totalCommission = bookings.reduce((sum, booking) => sum + (booking.commission || booking.totalPrice * commissionRate), 0);
      const netIncome = totalRevenue - totalCommission;
      
      return {
        totalRevenue,
        commission: totalCommission,
        netIncome,
        bookingsCount: bookings.length,
        bookings: bookings.map(booking => ({
          id: booking._id,
          bookingId: booking.bookingId,
          cabin: booking.cabinId?.name || 'Unknown',
          seat: booking.seatId?.number || 'Unknown',
          amount: booking.totalPrice,
          commission: booking.commission || booking.totalPrice * commissionRate,
          netAmount: booking.totalPrice - (booking.commission || booking.totalPrice * commissionRate),
          payoutStatus: booking.payoutStatus,
          createdAt: booking.createdAt
        }))
      };
    };
    
    const incomeData = {
      today: calculateDetailedIncome(todayBookings),
      yesterday: calculateDetailedIncome(yesterdayBookings),
      week: calculateDetailedIncome(weekBookings),
      month: calculateDetailedIncome(monthBookings)
    };
    
    // Calculate available balance for payout (only pending bookings)
    const pendingBookings = await Booking.find({
      cabinId: { $in: cabinIds },
      paymentStatus: 'completed',
      payoutStatus: 'pending'
    });
    
    const pendingRevenue = pendingBookings.reduce((sum, booking) => {
      const commission = booking.commission || booking.totalPrice * commissionRate;
      return sum + (booking.totalPrice - commission);
    }, 0);
    
    // Get total of pending and processing payouts
    const pendingPayouts = await VendorPayout.aggregate([
      { $match: { vendorId: vendor._id, status: { $in: ['pending', 'processing'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // const availableBalance = pendingRevenue - (pendingPayouts[0]?.total || 0);
    
    // Get payout summary
    const payoutSummary = {
      totalPendingBookings: pendingBookings.length,
      pendingRevenue,
      requestedPayouts: pendingPayouts[0]?.total || 0,
      availableBalance: Math.max(0, pendingRevenue)
    };
    
    res.json({
      success: true,
      data: {
        ...incomeData,
        payoutSummary,
        commissionRate: commissionRate * 100
      }
    });
  } catch (error) {
    console.error('Get vendor income error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Enhanced payout request with manual charges
const requestPayout = async (req, res) => {
  try {
   
    const { amount, bookingIds, cabinId } = req.body;
    
    const vendor = await Vendor.findOne(req.user.vendorId).exec();

    if (!vendor || vendor.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Only approved vendors can request payouts'
      });
    }
    
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount'
      });
    }
    
    // Get vendor's cabins
    let cabinQuery = { vendorId: req.user.vendorId };
    if (cabinId) {
      cabinQuery._id = cabinId;
    }
    
    const cabins = await Cabin.find(cabinQuery).select('_id');
    const cabinIds = cabins.map(cabin => cabin._id);
    
    let selectedBookings;
    if (bookingIds && bookingIds.length > 0) {
      // Use selected bookings
      selectedBookings = await Booking.find({
        _id: { $in: bookingIds },
        cabinId: { $in: cabinIds },
        paymentStatus: 'completed',
        payoutStatus: 'pending'
      });
    } else {
      // Use all pending bookings for specified cabin(s)
      selectedBookings = await Booking.find({
        cabinId: { $in: cabinIds },
        paymentStatus: 'completed',
        payoutStatus: 'pending'
      });
    }
    
    // Calculate total available from selected bookings
    const totalAvailable = selectedBookings.reduce((sum, booking) => {
      const commission = booking.commission || booking.totalPrice * (vendor.commissionSettings.value / 100);
      return sum + (booking.totalPrice - commission);
    }, 0);
    
    // Calculate manual request charges
    const manualRequestFee = AutoPayoutService.calculateManualRequestCharges(vendor, amount);
    const finalNetAmount = amount - manualRequestFee;
    
    if (amount > totalAvailable) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ₹${totalAvailable.toFixed(2)}`
      });
    }
    
    // Calculate total commission for this payout
    const totalCommission = selectedBookings.reduce((sum, booking) => {
      return sum + (booking.commission || booking.totalPrice * (vendor.commissionSettings.value / 100));
    }, 0);
    
    // Create payout request
    const payout = new VendorPayout({
      vendorId: vendor._id,
      cabinId: cabinId || null,
      amount,
      commission: totalCommission,
      netAmount: finalNetAmount,
      additionalCharges: {
        manualRequestFee,
        description: vendor.autoPayoutSettings.manualRequestCharges.description
      },
      payoutType: 'manual',
      period: {
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date()
      },
      bookings: selectedBookings.map(b => b._id),
      bankDetails: vendor.bankDetails,
      status: 'pending'
    });
    
    await payout.save();
    
    // Mark bookings as included in this payout
    await Booking.updateMany(
      { _id: { $in: selectedBookings.map(b => b._id) } },
      { 
        payoutStatus: 'included',
        payoutId: payout._id
      }
    );
    await Transaction.updateMany(
      { bookingId: { $in: selectedBookings.map(b => b._id) } },
      { 
        payoutStatus: 'included',
        payoutId: payout._id
      }
    );
    
    // Update vendor pending payout
    vendor.pendingPayout = (vendor.pendingPayout || 0) + finalNetAmount;
    await vendor.save();

    res.json({ 
      success: true, 
      data: {
        ...payout.toObject(),
        manualRequestFee,
        originalAmount: amount,
        finalNetAmount
      },
      message: 'Payout request submitted successfully'
    });
  } catch (error) {
    console.error('Request payout error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get auto payout settings
const getAutoPayoutSettings = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const vendor = await Vendor.findById(vendorId).select('autoPayoutSettings');
    
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    res.json({ success: true, data: vendor.autoPayoutSettings });
  } catch (error) {
    console.error('Get auto payout settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update auto payout settings
const updateAutoPayoutSettings = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const updateData = req.body;

    const vendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { $set: { autoPayoutSettings: updateData } },
      { new: true, runValidators: true }
    ).select('autoPayoutSettings');

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    res.json({ success: true, data: vendor.autoPayoutSettings });
  } catch (error) {
    console.error('Update auto payout settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get payout preview with charges
const getPayoutPreview = async (req, res) => {
  try {
    const { amount, cabinId } = req.query;
    const vendorId = req.user.vendorId;
    
    const vendor = await Vendor.findById(vendorId);
    
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const manualRequestFee = AutoPayoutService.calculateManualRequestCharges(vendor, parseFloat(amount));
    const finalNetAmount = parseFloat(amount) - manualRequestFee;

    res.json({ 
      success: true, 
      data: {
        originalAmount: parseFloat(amount),
        manualRequestFee,
        finalNetAmount,
        chargeDescription: vendor.autoPayoutSettings.manualRequestCharges.description,
        nextAutoPayout: vendor.autoPayoutSettings.nextAutoPayout
      }
    });
  } catch (error) {
    console.error('Get payout preview error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get detailed payout history with date filtering
const getPayouts = async (req, res) => {
  try {
    const { dateFilter, startDate, endDate } = req.query;
    const vendorId = req.vendor.id;
    
    // Build query for payouts
    let query = { vendorId };

    // Add date filter if specified
    if (dateFilter && dateFilter !== 'custom') {
      const dateRange = getDateRange(dateFilter);
      if (dateRange) {
        query.createdAt = {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate
        };
      }
    } else if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const payouts = await VendorPayout.find(query)
      .populate('bookings')
      .sort({ createdAt: -1 });

    // Enhance payout data with booking details
    const enhancedPayouts = payouts.map(payout => ({
      ...payout.toObject(),
      bookingCount: payout.bookings?.length || 0,
      bookingDetails: payout.bookings?.map(booking => ({
        bookingId: booking.bookingId,
        amount: booking.totalPrice,
        commission: booking.commission,
        netAmount: booking.netRevenue
      })) || []
    }));

    res.json({ success: true, data: enhancedPayouts });
  } catch (error) {
    console.error('Get payouts error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Employee Management
const getEmployees = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const employees = await VendorEmployee.find({ vendorId }).populate('userId', 'name email');
    res.json({ success: true, data: employees });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createEmployee = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const { name, email, phone, role, permissions, salary } = req.body;

    // 1️⃣ Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // 2️⃣ Create user if not exists
      user = new User({
        name,
        email,
        phone,
        vendorId,
        vendorIds:[vendorId],
        role: 'vendor_employee',
        password: 'defaultPassword123', // hash this in real app
      });

      await user.save();
    } else {
      // 3️⃣ If user exists, ensure not already linked to another vendor
      if (user.vendorId && user.vendorId.toString() !== vendorId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'This user is already associated with another vendor',
        });
      }
    }

    // 4️⃣ Check if employee record already exists
    const existingEmployee = await VendorEmployee.findOne({
      vendorId,
      userId: user._id,
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'This employee is already added to your vendor',
      });
    }

    // 5️⃣ Create VendorEmployee record
    const employee = new VendorEmployee({
      vendorId,
      userId: user._id,
      name: user.name || name,
      email: user.email,
      phone: user.phone || phone,
      role,
      permissions,
      salary,
    });

    await employee.save();

    // 6️⃣ If existing user had no vendorId, attach now
    if (!user.vendorId) {
      user.vendorId = vendorId;
      // Ensure vendorIds exists and is an array
      if (!Array.isArray(user.vendorIds)) {
        user.vendorIds = [];
      }

      // Add vendorId only if not already present
      if (!user.vendorIds.includes(vendorId)) {
        user.vendorIds.push(vendorId);
      }
      user.role = 'vendor_employee';
      await user.save();
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    console.error('Create employee error:', error);

    // Handle duplicate key error safely
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Employee already exists',
      });
    }

    res.status(500).json({ success: false, message: 'Server error' });
  }
};


const updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const vendorId = req.vendor.id;
    
    const employee = await VendorEmployee.findOneAndUpdate(
      { _id: employeeId, vendorId },
      req.body,
      { new: true }
    );

    await User.findOneAndUpdate(
      { _id: employee.userId },
      {permissions: req.body.permissions},
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const vendorId = req.vendor.id;
    
    const employee = await VendorEmployee.findOneAndDelete({ _id: employeeId, vendorId });
    
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Vendor Cabin Management
const getVendorCabins = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const cabins = await Cabin.find({ createdBy: vendorId });
    
    // Get seat counts for each cabin
    const cabinsWithStats = await Promise.all(cabins.map(async (cabin) => {
      const totalSeats = await Seat.countDocuments({ cabinId: cabin._id });
      const occupiedSeats = await Seat.countDocuments({ 
        cabinId: cabin._id, 
        isAvailable: false 
      });
      
      return {
        ...cabin.toObject(),
        totalSeats,
        occupiedSeats
      };
    }));

    res.json({ success: true, data: cabinsWithStats });
  } catch (error) {
    console.error('Get vendor cabins error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createVendorCabin = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const cabinData = {
      ...req.body,
      createdBy: vendorId,
      isActive: true,
      coordinatePoint: {
        type: 'Point',
        coordinates: [req.body.location?.coordinates?.longitude || 0, req.body.location?.coordinates?.latitude || 0]
      },
      location: {
        ...req.body.location,
        coordinates: {
          latitude: req.body.location?.coordinates?.latitude || 0,
          longitude: req.body.location?.coordinates?.longitude || 0
        },
        fullAddress: req.body.location?.address || '',
        city: req.body.location?.city || '',
        state: req.body.location?.state || '',
        pincode: req.body.location?.pincode || ''
      },
      ownerDetails: {
        ownerName: req.vendor.name || 'Vendor',
        ownerPhone: req.vendor.phone || '',
        ownerEmail: req.vendor.email || '',
        bankDetails: {
          accountHolderName: req.vendor.name || 'Vendor',
          accountNumber: '1234567890',
          ifscCode: 'BANK0001234',
          bankName: 'Bank Name'
        }
      }
    };

    const cabin = new Cabin(cabinData);
    await cabin.save();

    res.json({ success: true, data: cabin });
  } catch (error) {
    console.error('Create vendor cabin error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateProperty = async (req, res) => {
  try {
    const { cabinId } = req.params;
    const vendorId = req.vendor.id;
    
    const cabin = await Cabin.findOneAndUpdate(
      { _id: cabinId, createdBy: vendorId },
      req.body,
      { new: true }
    );

    if (!cabin) {
      return res.status(404).json({ success: false, message: 'Cabin not found' });
    }

    res.json({ success: true, data: cabin });
  } catch (error) {
    console.error('Update cabin error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteProperty = async (req, res) => {
  try {
    const { cabinId } = req.params;
    const vendorId = req.vendor.id;
    
    const cabin = await Cabin.findOneAndDelete({ _id: cabinId, createdBy: vendorId });
    
    if (!cabin) {
      return res.status(404).json({ success: false, message: 'Cabin not found' });
    }

    res.json({ success: true, message: 'Cabin deleted successfully' });
  } catch (error) {
    console.error('Delete cabin error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Vendor Booking Management
const getVendorBookings = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { status, startDate, endDate, search } = req.query;
    
    // Get vendor's cabins
    const vendorCabins = await Cabin.find({ createdBy: vendorId }).select('_id');
    const cabinIds = vendorCabins.map(cabin => cabin._id);
    
    let query = { cabinId: { $in: cabinIds } };
    
    if (status) query.status = status;
    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    const bookings = await Booking.find(query)
      .populate('userId', 'name email userID profilePicture')
      .populate('cabinId', 'name')
      .populate('seatId', 'number')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Get vendor bookings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createManualBooking = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { studentId, cabinId, seatId, startDate, endDate, amount, notes } = req.body;

    // Verify cabin belongs to vendor
    const cabin = await Cabin.findOne({ _id: cabinId, createdBy: vendorId });
    if (!cabin) {
      return res.status(403).json({ success: false, message: 'Cabin not found or access denied' });
    }

    // Create booking
    const booking = new Booking({
      userId: studentId,
      cabinId,
      seatId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalPrice: amount,
      status: 'completed',
      paymentStatus: 'completed',
      createdBy: vendorId,
      bookingId: `VB-${Date.now()}`
    });

    await booking.save();

    // Update seat availability
    await Seat.findByIdAndUpdate(seatId, { isAvailable: false });

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Create manual booking error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    const vendorId = req.vendor.id;

    // Verify booking belongs to vendor's cabin
    const booking = await Booking.findById(bookingId).populate('cabinId');
    if (!booking || booking.cabinId.createdBy.toString() !== vendorId) {
      return res.status(403).json({ success: false, message: 'Booking not found or access denied' });
    }

    booking.status = status;
    await booking.save();

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Vendor Customer Management
const getVendorCustomers = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    
    // Get vendor's cabins
    const vendorCabins = await Cabin.find({ createdBy: vendorId }).select('_id');
    const cabinIds = vendorCabins.map(cabin => cabin._id);
    
    // Get unique customers who have bookings with vendor's cabins
    const bookings = await Booking.find({ cabinId: { $in: cabinIds } })
      .populate('userId', 'name email phone createdAt userID profilePicture')
      .distinct('userId');

    const customers = await User.find({ _id: { $in: bookings } });
    
    // Add booking stats for each customer
    const customersWithStats = await Promise.all(customers.map(async (customer) => {
      const customerBookings = await Booking.find({ 
        userId: customer._id, 
        cabinId: { $in: cabinIds } 
      });
      
      const totalBookings = customerBookings.length;
      const totalSpent = customerBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
      const lastBooking = customerBookings.sort((a, b) => b.createdAt - a.createdAt)[0];
      
      return {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        totalBookings,
        totalSpent,
        status: 'active',
        lastBooking: lastBooking?.createdAt,
        joinedAt: customer.createdAt
      };
    }));

    res.json({ success: true, data: customersWithStats });
  } catch (error) {
    console.error('Get vendor customers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Vendor Seat Management
const getVendorSeats = async (req, res) => {
  try {
    const { cabinId } = req.params;
    const vendorId = req.vendor.id;

    // Verify cabin belongs to vendor
    const cabin = await Cabin.findOne({ _id: cabinId, createdBy: vendorId });
    if (!cabin) {
      return res.status(403).json({ success: false, message: 'Cabin not found or access denied' });
    }

    const seats = await Seat.find({ cabinId });
    res.json({ success: true, data: seats });
  } catch (error) {
    console.error('Get vendor seats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createVendorSeat = async (req, res) => {
  try {
    const { cabinId } = req.params;
    const vendorId = req.vendor.id;

    // Verify cabin belongs to vendor
    const cabin = await Cabin.findOne({ _id: cabinId, createdBy: vendorId });
    if (!cabin) {
      return res.status(403).json({ success: false, message: 'Cabin not found or access denied' });
    }

    const seat = new Seat({
      ...req.body,
      cabinId
    });

    await seat.save();
    res.json({ success: true, data: seat });
  } catch (error) {
    console.error('Create vendor seat error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateVendorSeat = async (req, res) => {
  try {
    const { cabinId, seatId } = req.params;
    const vendorId = req.vendor.id;

    // Verify cabin belongs to vendor
    const cabin = await Cabin.findOne({ _id: cabinId, createdBy: vendorId });
    if (!cabin) {
      return res.status(403).json({ success: false, message: 'Cabin not found or access denied' });
    }

    const seat = await Seat.findOneAndUpdate(
      { _id: seatId, cabinId },
      req.body,
      { new: true }
    );

    if (!seat) {
      return res.status(404).json({ success: false, message: 'Seat not found' });
    }

    res.json({ success: true, data: seat });
  } catch (error) {
    console.error('Update vendor seat error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteVendorSeat = async (req, res) => {
  try {
    const { cabinId, seatId } = req.params;
    const vendorId = req.vendor.id;

    // Verify cabin belongs to vendor
    const cabin = await Cabin.findOne({ _id: cabinId, createdBy: vendorId });
    if (!cabin) {
      return res.status(403).json({ success: false, message: 'Cabin not found or access denied' });
    }

    const seat = await Seat.findOneAndDelete({ _id: seatId, cabinId });
    
    if (!seat) {
      return res.status(404).json({ success: false, message: 'Seat not found' });
    }

    res.json({ success: true, message: 'Seat deleted successfully' });
  } catch (error) {
    console.error('Delete vendor seat error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Vendor Reports
const getReports = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { startDate, endDate, type } = req.query;
    
    // Get vendor's cabins
    const vendorCabins = await Cabin.find({ createdBy: vendorId }).select('_id');
    const cabinIds = vendorCabins.map(cabin => cabin._id);
    
    let query = { cabinId: { $in: cabinIds } };
    
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    const bookings = await Booking.find(query);
    
    const reports = {
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
      averageBookingValue: bookings.length > 0 ? bookings.reduce((sum, booking) => sum + booking.totalPrice, 0) / bookings.length : 0,
      bookingsByStatus: bookings.reduce((acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Get vendor reports error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Employee Management
const getVendors = async (req, res) => {
  try {
    const employees = await Vendor.find().select('vendorId businessName phone');
    res.json({ success: true, data: employees });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


const getProfile = async (req, res) =>{
  try {
    const vendorId = req.vendor._id;
    
    const vendor = await Vendor.findById(vendorId)
      .select('-employeeIds -propertyIds -hostelIds -documents');

    res.json({ success: true, data: vendor });
  } catch (error) {
    console.error('Error updating vendor profile:', error);
    res.status(500).json({ message: 'Failed to update vendor profile' });
  }
}
const updateProfile = async (req, res) =>{
  try {
    const vendorId = req.vendor._id;
    const updateData = req.body;

    // Only allow updating specific fields
    const allowedUpdates = {
      businessName: updateData.businessName,
      contactPerson: updateData.contactPerson,
      phone: updateData.phone,
      address: updateData.address,
      'businessDetails.description': updateData.businessDetails?.description,
      bankDetails: updateData.bankDetails
    };

    // Remove undefined values
    Object.keys(allowedUpdates).forEach(key => {
      if (allowedUpdates[key] === undefined) {
        delete allowedUpdates[key];
      }
    });

    const vendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).select('-employeeIds -propertyIds -hostelIds -documents');

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json({ success: true, data: vendor });
  } catch (error) {
    console.error('Error updating vendor profile:', error);
    res.status(500).json({ message: 'Failed to update vendor profile' });
  }
}

module.exports = {
  getDashboardStats,
  getVendorIncome,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getVendorCabins,
  createVendorCabin,
  updateProperty,
  deleteProperty,
  getVendorBookings,
  createManualBooking,
  updateBookingStatus,
  getVendorCustomers,
  getVendorSeats,
  createVendorSeat,
  updateVendorSeat,
  deleteVendorSeat,
  getReports,
  getPayouts,
  requestPayout,
  getVendors,
  getProfile,
  updateProfile,
  getAutoPayoutSettings,
  updateAutoPayoutSettings,
  getPayoutPreview
};
