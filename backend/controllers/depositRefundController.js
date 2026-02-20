
const DepositRefund = require('../models/DepositRefund');
const Booking = require('../models/Booking');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Cabin = require('../models/Cabin');

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

// Get deposits with pagination and filters
const getDeposits = async (req, res) => {
  try {
   const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      search,
      cabinId,
      dateFilter
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build base query
    const matchStage = {
      isKeyDepositPaid: true
    };

    // Status filter
    if (status && status !== 'all') {
      matchStage.keyDepositRefunded = (status === 'refunded');
    }

    // Date filter
    if (dateFilter && dateFilter !== 'custom') {
      const dateRange = getDateRange(dateFilter);
      if (dateRange) {
        matchStage.createdAt = {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate
        };
      }
    } else if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    // Cabin filter
    if (cabinId) {
      matchStage.cabinId = mongoose.Types.ObjectId(cabinId);
    }
    // matchStage.endDate = {};
    // matchStage.endDate.$lte = new Date();

    // Search
    const searchRegex = search ? new RegExp(search, 'i') : null;
    const searchMatch = searchRegex
      ? {
          $or: [
            { 'user.name': searchRegex },
            { 'booking.bookingId': searchRegex },
            { 'cabin.name': searchRegex }
          ]
        }
      : {};

    // Role-based access
    if (req.user.role !== 'admin') {
      var vendorId = req.user.vendorId;
      const cabins = await Cabin.find({ vendorId: vendorId }, '_id');
      const cabinIds = cabins.map(c => c._id);
      matchStage.cabinId = { $in: cabinIds };
    }


    // Aggregation pipeline
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'cabins',
          localField: 'cabinId',
          foreignField: '_id',
          as: 'cabin'
        }
      },
      { $unwind: '$cabin' },
      {
        $lookup: {
          from: 'seats',
          localField: 'seatId',
          foreignField: '_id',
          as: 'seat'
        }
      },
      { $unwind: { path: '$seat', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'bookings',
          localField: 'bookingId',
          foreignField: '_id',
          as: 'booking'
        }
      },
      { $unwind: '$booking' },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          keyDeposit: 1,
          isKeyDepositPaid: 1,
          endDate: 1,
          updatedAt:1,
          status: 1,
          paymentStatus: 1,
          keyDepositRefundDate: 1,
          refundAmount: 1,
          refundMethod: 1,
          transactionId: 1,
          transactionImageUrl: 1,
          keyDepositRefunded: 1,
          'user._id': 1,
          'user.name': 1,
          'user.email': 1,
          'booking._id': 1,
          'booking.bookingId': 1,
          'cabin._id': 1,
          'cabin.name': 1,
          'seat._id': 1,
          'seat.number': 1
        }
      },
      ...(searchRegex ? [{ $match: searchMatch }] : []),
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ];

    // Count pipeline
    const countPipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'cabins',
          localField: 'cabinId',
          foreignField: '_id',
          as: 'cabin'
        }
      },
      { $unwind: '$cabin' },
      {
        $lookup: {
          from: 'bookings',
          localField: 'bookingId',
          foreignField: '_id',
          as: 'booking'
        }
      },
      { $unwind: '$booking' },
      ...(searchRegex ? [{ $match: searchMatch }] : []),
      { $count: 'total' }
    ];

    const [deposits, countResult] = await Promise.all([
      DepositRefund.aggregate(pipeline),
      DepositRefund.aggregate(countPipeline)
    ]);

    const total = countResult[0]?.total || 0;

    res.json({
      success: true,
      data: deposits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching deposits:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Process refund
const processRefund = async (req, res) => {
  try {
    const { depositId } = req.params;
    const { refundAmount, refundReason, refundMethod, transactionId, transactionImageUrl } = req.body;

    const deposit = await DepositRefund.findById(depositId);
    if (!deposit) {
      return res.status(404).json({
        success: false,
        error: 'Deposit not found'
      });
    }

    if (deposit.keyDepositRefunded) {
      return res.status(400).json({
        success: false,
        error: 'Deposit already refunded'
      });
    }

    // Update deposit
    deposit.keyDepositRefunded = true;
    deposit.keyDepositRefundDate = new Date();
    deposit.refundAmount = refundAmount;
    deposit.refundReason = refundReason;
    deposit.refundMethod = refundMethod;
    deposit.transactionId = transactionId;
    deposit.transactionImageUrl = transactionImageUrl;
    deposit.status = 'refunded';
    deposit.paymentStatus = 'refunded';

    await deposit.save();

    await Booking.findOneAndUpdate(
      { _id: deposit.bookingId },
      { keyDepositRefundDate: new Date(), keyDepositRefunded: true }
    );
        

    res.json({
      success: true,
      data: deposit,
      message: 'Deposit refunded successfully'
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Bulk process refunds
const bulkProcessRefunds = async (req, res) => {
  try {
    const { depositIds, refundAmount, refundReason, refundMethod, transactionId, transactionImageUrl } = req.body;

    const deposits = await DepositRefund.find({
      _id: { $in: depositIds },
      keyDepositRefunded: false
    });

    if (deposits.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No eligible deposits found for refund'
      });
    }

    // Update all deposits
    const updateData = {
      keyDepositRefunded: true,
      keyDepositRefundDate: new Date(),
      refundAmount,
      refundReason,
      refundMethod,
      transactionId,
      transactionImageUrl,
      status: 'refunded',
      paymentStatus: 'refunded'
    };

    await DepositRefund.updateMany(
      { _id: { $in: depositIds } },
      updateData
    );

    res.json({
      success: true,
      data: { processedCount: deposits.length },
      message: `${deposits.length} deposits refunded successfully`
    });
  } catch (error) {
    console.error('Error processing bulk refunds:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Export deposits report
const exportDepositsReport = async (req, res) => {
  try {
    const { format = 'excel', status, startDate, endDate, cabinId, dateFilter } = req.query;

    // Build query
    let query = {};
    if (status && status !== 'all') {
      if (status === 'pending') {
        query.keyDepositRefunded = false;
      } else if (status === 'refunded') {
        query.keyDepositRefunded = true;
      }
    }

    // Handle date filtering
    if (dateFilter && dateFilter !== 'custom') {
      const dateRange = getDateRange(dateFilter);
      if (dateRange) {
        query.createdAt = {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate
        };
      }
    } else if (startDate || endDate) {
      query.endDate = {};
      if (startDate) query.endDate.$gte = new Date(startDate);
      if (endDate) query.endDate.$lte = new Date(endDate);
    }

    if (cabinId) {
      query.cabinId = cabinId;
    }

    const deposits = await DepositRefund.find(query)
      .populate('userId', 'name email userID profilePicture')
      .populate('cabinId', 'name')
      .populate('seatId', 'number')
      .populate('bookingId', 'bookingId')
      .sort({ createdAt: -1 });

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Deposits Report');

      // Add headers
      worksheet.columns = [
        { header: 'Booking ID', key: 'bookingId', width: 15 },
        { header: 'User Name', key: 'userName', width: 20 },
        { header: 'User Email', key: 'userEmail', width: 25 },
        { header: 'Cabin', key: 'cabin', width: 20 },
        { header: 'Seat', key: 'seat', width: 10 },
        { header: 'Deposit Amount', key: 'keyDeposit', width: 15 },
        { header: 'Booked On', key: 'createdAt', width: 15 },
        { header: 'End Date', key: 'endDate', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Refunded', key: 'refunded', width: 10 },
        { header: 'Refund Date', key: 'refundDate', width: 15 },
        { header: 'Refund Amount', key: 'refundAmount', width: 15 },
        { header: 'Refund Method', key: 'refundMethod', width: 15 },
        { header: 'Transaction ID', key: 'transactionId', width: 20 }
      ];

      // Add data
      deposits.forEach(deposit => {
        worksheet.addRow({
          bookingId: deposit.bookingId?.bookingId || 'N/A',
          userName: deposit.userId?.name || 'N/A',
          userEmail: deposit.userId?.email || 'N/A',
          cabin: deposit.cabinId?.name || 'N/A',
          seat: deposit.seatId?.number || 'N/A',
          keyDeposit: deposit.keyDeposit,
          endDate: deposit.endDate.toDateString(),
          status: deposit.status,
          refunded: deposit.keyDepositRefunded ? 'Yes' : 'No',
          refundDate: deposit.keyDepositRefundDate ? deposit.keyDepositRefundDate.toDateString() : 'N/A',
          refundAmount: deposit.refundAmount || 'N/A',
          refundMethod: deposit.refundMethod || 'N/A',
          transactionId: deposit.transactionId || 'N/A'
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=deposits-report-${new Date().toISOString().split('T')[0]}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();
    } else if (format === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=deposits-report-${new Date().toISOString().split('T')[0]}.pdf`);

      doc.pipe(res);

      doc.fontSize(20).text('Deposits Report', 50, 50);
      doc.fontSize(12).text(`Generated on: ${new Date().toDateString()}`, 50, 80);

      let yPosition = 120;
      deposits.forEach((deposit, index) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        doc.text(`${index + 1}. Booking: ${deposit.bookingId?.bookingId || 'N/A'}`, 50, yPosition);
        doc.text(`   User: ${deposit.userId?.name || 'N/A'}`, 50, yPosition + 15);
        doc.text(`   Cabin: ${deposit.cabinId?.name || 'N/A'} - Seat: ${deposit.seatId?.number || 'N/A'}`, 50, yPosition + 30);
        doc.text(`   Deposit: ₹${deposit.keyDeposit} - Status: ${deposit.status}`, 50, yPosition + 45);
        
        yPosition += 70;
      });

      doc.end();
    }
  } catch (error) {
    console.error('Error exporting deposits report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get deposits with pagination and filters
const getRefunds = async (req, res) => {
  try {
   const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      search,
      cabinId,
      dateFilter
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build base query
    const matchStage = {
      isKeyDepositPaid: true
    };

    // Status filter
    if (status && status !== 'all') {
      matchStage.keyDepositRefunded = (status === 'refunded');
    }

    // Date filter
    if (dateFilter && dateFilter !== 'custom') {
      const dateRange = getDateRange(dateFilter);
      if (dateRange) {
        matchStage.createdAt = {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate
        };
      }
    } else if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    // Cabin filter
    if (cabinId) {
      matchStage.cabinId = mongoose.Types.ObjectId(cabinId);
    }
    matchStage.endDate = {};
    matchStage.endDate.$lte = new Date();

    // Search
    const searchRegex = search ? new RegExp(search, 'i') : null;
    const searchMatch = searchRegex
      ? {
          $or: [
            { 'user.name': searchRegex },
            { 'booking.bookingId': searchRegex },
            { 'cabin.name': searchRegex }
          ]
        }
      : {};

    // Role-based access
    if (req.user.role !== 'admin') {
      var vendorId = req.user.vendorId;
      const cabins = await Cabin.find({ vendorId: vendorId }, '_id');
      const cabinIds = cabins.map(c => c._id);
      matchStage.cabinId = { $in: cabinIds };
    }


    // Aggregation pipeline
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'cabins',
          localField: 'cabinId',
          foreignField: '_id',
          as: 'cabin'
        }
      },
      { $unwind: '$cabin' },
      {
        $lookup: {
          from: 'seats',
          localField: 'seatId',
          foreignField: '_id',
          as: 'seat'
        }
      },
      { $unwind: { path: '$seat', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'bookings',
          localField: 'bookingId',
          foreignField: '_id',
          as: 'booking'
        }
      },
      { $unwind: '$booking' },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          keyDeposit: 1,
          isKeyDepositPaid: 1,
          endDate: 1,
          updatedAt:1,
          status: 1,
          paymentStatus: 1,
          keyDepositRefundDate: 1,
          refundAmount: 1,
          refundMethod: 1,
          transactionId: 1,
          transactionImageUrl: 1,
          keyDepositRefunded: 1,
          'user._id': 1,
          'user.name': 1,
          'user.email': 1,
          'booking._id': 1,
          'booking.bookingId': 1,
          'cabin._id': 1,
          'cabin.name': 1,
          'seat._id': 1,
          'seat.number': 1
        }
      },
      ...(searchRegex ? [{ $match: searchMatch }] : []),
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ];

    // Count pipeline
    const countPipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'cabins',
          localField: 'cabinId',
          foreignField: '_id',
          as: 'cabin'
        }
      },
      { $unwind: '$cabin' },
      {
        $lookup: {
          from: 'bookings',
          localField: 'bookingId',
          foreignField: '_id',
          as: 'booking'
        }
      },
      { $unwind: '$booking' },
      ...(searchRegex ? [{ $match: searchMatch }] : []),
      { $count: 'total' }
    ];

    const [deposits, countResult] = await Promise.all([
      DepositRefund.aggregate(pipeline),
      DepositRefund.aggregate(countPipeline)
    ]);

    const total = countResult[0]?.total || 0;

    res.json({
      success: true,
      data: deposits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching deposits:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getDeposits,
  getRefunds,
  processRefund,
  bulkProcessRefunds,
  exportDepositsReport
};
