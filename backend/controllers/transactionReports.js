
const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const HostelBooking = require('../models/HostelBooking');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { default: mongoose } = require('mongoose');
const Cabin = require('../models/Cabin');

// @desc    Get transaction reports with filters and population
// @route   GET /api/transactions/reports
// @access  Private/Admin
exports.getTransactionReports = async (req, res) => {
  try {
    const {
      userId,
      bookingId,
      cabinId,
      bookingType,
      transactionType,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter object
    const filter = {};
    
   const matchStage = {};


    if (userId) matchStage.userId = userId;
    if (bookingId) matchStage.bookingId = bookingId;
    if (bookingType) matchStage.bookingType = bookingType;
    if (transactionType) matchStage.transactionType = transactionType;
    if (status) matchStage.status = status;

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    if (search) {
      matchStage.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { paymentMethod: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // const aggregationPipeline = [
    //   { $match: matchStage },
    //   { $sort: { createdAt: -1 } },
    //   { $skip: skip },
    //   { $limit: parseInt(limit) },

    //   // Join with user collection
    //   {
    //     $lookup: {
    //       from: 'users',
    //       let: { userId: '$userId' },
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: { $eq: ['$_id', '$$userId'] }
    //           }
    //         },
    //         {
    //           $project: {
    //             userId: 1,
    //             email: 1,
    //             name: 1,
    //             phone: 1,
    //             // Include only fields you want
    //             _id: 1 // Include _id if needed
    //           }
    //         }
    //       ],
    //       as: 'userId'
    //     }
    //   },
    //   { $unwind: { path: '$userId', preserveNullAndEmptyArrays: true } },

    //   // Conditional lookup for cabin bookings
    //   {
    //     $lookup: {
    //       from: 'bookings',
    //       let: { bookingId: '$bookingId', type: '$bookingType' },
    //       pipeline: [
    //         { $match: { $expr: { $and: [
    //           { $eq: ['$_id', '$$bookingId'] },
    //           { $eq: ['$$type', 'cabin'] }
    //         ]}}},
    //         {
    //           $lookup: {
    //             from: 'cabins',
    //             let: { cabinId: '$cabinId' },
    //             pipeline: [
    //              {
    //                 $match: {
    //                   $expr: {
    //                     $and: [
    //                       { $eq: ['$_id', '$$cabinId'] },
    //                       { $in: ['$vendorId', allowedVendorIds] } // ✅ vendor filter
    //                     ]
    //                   }
    //                 }
    //               },
    //               {
    //                 $project: {
    //                   name: 1,
    //                   cabinCode: 1,
    //                   vendorId:1,
    //                   _id: 1 // Include _id if needed
    //                 }
    //               }
    //             ],
    //             as: 'cabinId'
    //           }
    //         },
    //         { $unwind: { path: '$cabinId', preserveNullAndEmptyArrays: true } },
    //         {
    //           $lookup: {
    //             from: 'seats',
    //             let: { seatId: '$seatId' },
    //             pipeline: [
    //               {
    //                 $match: {
    //                   $expr: { $eq: ['$_id', '$$seatId'] }
    //                 }
    //               },
    //               {
    //                 $project: {
    //                   number: 1,
    //                   price: 1,
    //                   sharingType: 1,
    //                   // Include only fields you want
    //                   _id: 1 // Include _id if needed
    //                 }
    //               }
    //             ],
    //             as: 'seatId'
    //           }
    //         },
    //         { $unwind: { path: '$seatId', preserveNullAndEmptyArrays: true } },
    //         {
    //           $project: {
    //             bookingId:1,
    //             paymentStatus:1,
    //             seatId: 1,
    //             cabinId: 1,
    //             _id: 1 // Include _id if needed
    //           }
    //         }
    //       ],
    //       as: 'cabinBooking'
    //     }
    //   },

    //   // Conditional lookup for hostel bookings
    //   {
    //     $lookup: {
    //       from: 'hostelbookings',
    //       let: { bookingId: '$bookingId', type: '$bookingType' },
    //       pipeline: [
    //         { $match: { $expr: { $and: [
    //           { $eq: ['$_id', '$$bookingId'] },
    //           { $eq: ['$$type', 'hostel'] }
    //         ]}}},
    //         {
    //           $lookup: {
    //             from: 'hostels',
    //             localField: 'hostelId',
    //             foreignField: '_id',
    //             as: 'hostelId'
    //           }
    //         },
    //         { $unwind: { path: '$hostelId', preserveNullAndEmptyArrays: true } },
    //         {
    //           $lookup: {
    //             from: 'beds',
    //             localField: 'bedId',
    //             foreignField: '_id',
    //             as: 'bedId'
    //           }
    //         },
    //         { $unwind: { path: '$bedId', preserveNullAndEmptyArrays: true } },
    //         {
    //           $lookup: {
    //             from: 'users',
    //             localField: 'userId',
    //             foreignField: '_id',
    //             as: 'userId'
    //           }
    //         },
    //         { $unwind: { path: '$userId', preserveNullAndEmptyArrays: true } }
    //       ],
    //       as: 'hostelBooking'
    //     }
    //   },

    //   {
    //     $addFields: {
    //       bookingDetails: {
    //         $cond: {
    //           if: { $eq: ['$bookingType', 'cabin'] },
    //           then: { $arrayElemAt: ['$cabinBooking', 0] },
    //           else: { $arrayElemAt: ['$hostelBooking', 0] }
    //         }
    //       }
    //     }
    //   },

    //   {
    //     $project: {
    //       cabinBooking: 0,
    //       hostelBooking: 0
    //     }
    //   }
    // ];

    const pipeline = [
      { $match: matchStage },

      // Lookup user info (optional)
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },

      // Lookup cabin bookings
      {
        $lookup: {
          from: 'bookings',
          let: { bookingId: '$bookingId', type: '$bookingType' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$bookingId'] },
                    { $eq: ['$$type', 'cabin'] }
                  ]
                }
              }
            },
            {
              $lookup: {
                from: 'cabins',
                localField: 'cabinId',
                foreignField: '_id',
                as: 'cabin'
              }
            },
            { $unwind: { path: '$cabin', preserveNullAndEmptyArrays: true } },
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
              $project: {
                _id: 1,
                cabinId: 1,
                seatId: 1,
                'seat.number':1,
                'seat.unavailableUntil':1,
                paymentStatus: 1,
                'cabin.name': 1,
                'cabin.vendorId': 1,
                'cabin.cabinCode': 1
              }
            }
          ],
          as: 'cabinBooking'
        }
      },

      // Lookup hostel bookings
      {
        $lookup: {
          from: 'hostelbookings',
          let: { bookingId: '$bookingId', type: '$bookingType' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$bookingId'] },
                    { $eq: ['$$type', 'hostel'] }
                  ]
                }
              }
            },
            {
              $lookup: {
                from: 'hostels',
                localField: 'hostelId',
                foreignField: '_id',
                as: 'hostel'
              }
            },
            { $unwind: { path: '$hostel', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 1,
                bedId: 1,
                paymentStatus: 1,
                'hostel.name': 1,
                'hostel.vendorId': 1
              }
            }
          ],
          as: 'hostelBooking'
        }
      },

      // Add merged bookingDetails field
      {
        $addFields: {
          bookingDetails: {
            $cond: {
              if: { $eq: ['$bookingType', 'cabin'] },
              then: { $arrayElemAt: ['$cabinBooking', 0] },
              else: { $arrayElemAt: ['$hostelBooking', 0] }
            }
          }
        }
      },

      // Filter by vendorId if not admin
      ...(req.user.role !== 'admin'
        ? [{
            $match: {
              $expr: {
                $cond: {
                  if: { $eq: ['$bookingType', 'cabin'] },
                  then: { $eq: ['$bookingDetails.cabin.vendorId', req.user.vendorId] },
                  else: { $eq: ['$bookingDetails.hostel.vendorId', req.user.vendorId] }
                }
              }
            }
          }]
        : []),

      // Optional sorting, pagination
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },

      // Cleanup
      {
        $project: {
          cabinBooking: 0,
          hostelBooking: 0
        }
      }
    ];

    // Run aggregation
    const result = await Transaction.aggregate(pipeline);

    // For pagination total count
    const countPipeline = [...pipeline.slice(0, -3), { $count: 'count' }]; // Before pagination stages
    const countResult = await Transaction.aggregate(countPipeline);
    const totalDocs = countResult[0]?.count || 0;

    const totalPages = Math.ceil(totalDocs / parseInt(limit));

    res.status(200).json({
      success: true,
      data: result,
      totalDocs,
      totalPages,
      currentPage: parseInt(page)
    });

  } catch (error) {
    console.error('Get transaction reports error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Export transactions as Excel
// @route   GET /api/reports-export/transactions/excel
// @access  Private/Admin
exports.exportTransactionsExcel = async (req, res) => {
  try {
    const {
      userId,
      bookingId,
      cabinId,
      bookingType,
      transactionType,
      status,
      startDate,
      endDate,
      search
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (userId) filter.userId = userId;
    if (bookingId) filter.bookingId = bookingId;
    if (bookingType) filter.bookingType = bookingType;
    if (transactionType) filter.transactionType = transactionType;
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    if (search) {
      filter.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { 'paymentMethod': { $regex: search, $options: 'i' } }
      ];
    }

    const transactions = await Transaction.find(filter)
      .populate('userId', 'name email phone')
      .populate({
        path: 'bookingId',
        select: 'bookingId cabinId seatId',
        populate: [
          { path: 'cabinId', select: 'name location' },   // adjust fields
          { path: 'seatId', select: 'number' }   // adjust fields
        ]
      })
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transaction Reports');

    // Add headers
    worksheet.columns = [
      { header: 'Transaction ID', key: 'transactionId', width: 20 },
      { header: 'Customer Name', key: 'customerName', width: 20 },
      { header: 'Customer Email', key: 'customerEmail', width: 25 },
      { header: 'Customer Phone', key: 'customerPhone', width: 15 },
      { header: 'Booking Type', key: 'bookingType', width: 12 },
      { header: 'Booking Id', key: 'bookingId', width: 12 },
      { header: 'Cabin Name', key: 'cabinId', width: 12 },
      { header: 'Seat Number', key: 'seatNumber', width: 12 },
      { header: 'Transaction Type', key: 'transactionType', width: 15 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Payment Method', key: 'paymentMethod', width: 15 },
      { header: 'Additional Months', key: 'additionalMonths', width: 15 },
      { header: 'Created Date', key: 'createdAt', width: 15 },
      { header: 'Updated Date', key: 'updatedAt', width: 15 }
    ];

    // Add data
    transactions.forEach(transaction => {
      worksheet.addRow({
        transactionId: transaction.transactionId,
        customerName: transaction.userId?.name || 'N/A',
        customerEmail: transaction.userId?.email || 'N/A',
        customerPhone: transaction.userId?.phone || 'N/A',
        bookingType: transaction.bookingType,
        bookingId: transaction.bookingId?.bookingId || 'N/A',
        cabinId: transaction.bookingId?.cabinId?.name || 'N/A',
        seatNumber: transaction.bookingId?.seatId?.number || 'N/A',
        transactionType: transaction.transactionType,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        paymentMethod: transaction.paymentMethod || 'N/A',
        additionalMonths: transaction.additionalMonths || 'N/A',
        createdAt: transaction.createdAt.toISOString().split('T')[0],
        updatedAt: transaction.updatedAt.toISOString().split('T')[0]
      });
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=transaction-reports-${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Export transactions Excel error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Export transactions as PDF
// @route   GET /api/reports-export/transactions/pdf
// @access  Private/Admin
exports.exportTransactionsPDF = async (req, res) => {
  try {
    const {
      userId,
      bookingId,
      cabinId,
      bookingType,
      transactionType,
      status,
      startDate,
      endDate,
      search
    } = req.query;

    // Build filter object (same as Excel export)
    const filter = {};
    
    if (userId) filter.userId = userId;
    if (bookingId) filter.bookingId = bookingId;
    if (bookingType) filter.bookingType = bookingType;
    if (transactionType) filter.transactionType = transactionType;
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    if (search) {
      filter.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { 'paymentMethod': { $regex: search, $options: 'i' } }
      ];
    }

    const transactions = await Transaction.find(filter)
      .populate('userId', 'name email phone userID profilePicture')
      .sort({ createdAt: -1 });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=transaction-reports-${new Date().toISOString().split('T')[0]}.pdf`);
    
    doc.pipe(res);

    // Add title
    doc.fontSize(16).text('Transaction Reports', { align: 'center' });
    doc.moveDown();

    // Add summary
    doc.fontSize(12).text(`Total Transactions: ${transactions.length}`);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    // Add transactions
    transactions.forEach((transaction, index) => {
      if (index > 0) doc.moveDown();
      
      doc.fontSize(10);
      doc.text(`Transaction ID: ${transaction.transactionId}`);
      doc.text(`Customer: ${transaction.userId?.name || 'N/A'} (${transaction.userId?.email || 'N/A'})`);
      doc.text(`Type: ${transaction.bookingType} - ${transaction.transactionType}`);
      doc.text(`Amount: ${transaction.currency} ${transaction.amount}`);
      doc.text(`Status: ${transaction.status}`);
      doc.text(`Date: ${transaction.createdAt.toLocaleDateString()}`);
      
      if (transaction.paymentMethod) {
        doc.text(`Payment Method: ${transaction.paymentMethod}`);
      }
      
      doc.text('---');
    });

    doc.end();

  } catch (error) {
    console.error('Export transactions PDF error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
