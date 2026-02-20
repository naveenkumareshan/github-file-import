const Booking = require('../models/Booking');
const User = require('../models/User');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Seat = require('../models/Seat');
const Cabin = require('../models/Cabin');

// Helper function to create directory if it doesn't exist
const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

// @desc    Export bookings report as Excel
// @route   GET /api/admin/reports/export/excel
// @access  Private/Admin
exports.exportBookingsAsExcel = async (req, res) => {
  try {
    const { startDate, endDate, cabinId, status } = req.query;
    const query = {};
    
    // Apply filters if provided
    if (startDate) query.startDate = { $gte: new Date(startDate) };
    if (endDate) query.endDate = { $lte: new Date(endDate) };
    if (cabinId) query.cabinId = cabinId;
    if (status) query.paymentStatus = status;
    
    // Fetch bookings with populated data
    const bookings = await Booking.find(query)
      .populate('cabinId', 'name category price serialNumber')
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });
      
    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No bookings found for the specified criteria' 
      });
    }
    
    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bookings Report');
    
    // Add header row
    worksheet.addRow([
      'Booking ID', 
      'Customer Name', 
      'Email', 
      'Room Name',
      'Room Category',
      'Start Date', 
      'End Date', 
      'Duration (Days)', 
      'Amount', 
      'Payment Status',
      'Booking Status',
      'Date Created'
    ]);
    
    // Add data rows
    bookings.forEach(booking => {
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);
      const durationInDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      
      worksheet.addRow([
        booking._id.toString(),
        booking.userId ? booking.userId.name : 'N/A',
        booking.userId ? booking.userId.email : 'N/A',
        booking.cabinId ? booking.cabinId.name : 'N/A',
        booking.cabinId ? booking.cabinId.category : 'N/A',
        startDate.toLocaleDateString(),
        endDate.toLocaleDateString(),
        durationInDays,
        booking.totalPrice,
        booking.paymentStatus,
        booking.status,
        new Date(booking.createdAt).toLocaleDateString()
      ]);
    });
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.columns.forEach(column => {
      column.width = 20;
    });
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads/reports');
    ensureDirectoryExists(uploadsDir);
    
    const filename = `bookings_report_${Date.now()}.xlsx`;
    const filepath = path.join(uploadsDir, filename);
    
    // Write to file
    await workbook.xlsx.writeFile(filepath);
    
    // Send file as response
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ success: false, message: 'Error downloading file' });
      }
      
      // Delete file after sending
      fs.unlink(filepath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
      });
    });
    
  } catch (error) {
    console.error('Export to Excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting to Excel',
      error: error.message
    });
  }
};

// @desc    Export revenue report as Excel
// @route   GET /api/admin/reports/export/revenue
// @access  Private/Admin
exports.exportRevenueAsExcel = async (req, res) => {
  try {
    const { startDate, endDate, period = 'monthly' } = req.query;
    const query = { paymentStatus: 'completed' };
    
    // Apply date filters if provided
    if (startDate) query.paymentDate = { $gte: new Date(startDate) };
    if (endDate) query.paymentDate = { $lte: new Date(endDate) };
    
    // Fetch all completed bookings
    const bookings = await Booking.find(query)
      .populate('cabinId', 'name category price')
      .sort({ createdAt: 1 });
      
    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No revenue data found for the specified criteria' 
      });
    }
    
    // Process data based on period
    const revenueData = {};
    const categoryData = {};
    
    bookings.forEach(booking => {
      const date = new Date(booking.createdAt);
      let periodKey;
      
      switch(period) {
        case 'daily':
          periodKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'weekly':
          // Get the week number
          const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
          const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
          const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
          periodKey = `${date.getFullYear()}-W${weekNum}`;
          break;
        case 'monthly':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'yearly':
          periodKey = `${date.getFullYear()}`;
          break;
        default:
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      // Aggregate revenue by period
      if (!revenueData[periodKey]) {
        revenueData[periodKey] = 0;
      }
      revenueData[periodKey] += booking.totalPrice || 0;
      
      // Aggregate revenue by category
      const category = booking.cabinId?.category || 'Unknown';
      if (!categoryData[category]) {
        categoryData[category] = 0;
      }
      categoryData[category] += booking.totalPrice || 0;
    });
    
    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    
    // Add revenue by period worksheet
    const revenueSheet = workbook.addWorksheet('Revenue by Period');
    revenueSheet.addRow(['Period', 'Total Revenue (₹)']);
    
    Object.entries(revenueData).forEach(([period, amount]) => {
      revenueSheet.addRow([period, amount]);
    });
    
    // Style the header row
    revenueSheet.getRow(1).font = { bold: true };
    revenueSheet.columns.forEach(column => {
      column.width = 20;
    });
    
    // Add revenue by category worksheet
    const categorySheet = workbook.addWorksheet('Revenue by Category');
    categorySheet.addRow(['Room Category', 'Total Revenue (₹)']);
    
    Object.entries(categoryData).forEach(([category, amount]) => {
      categorySheet.addRow([category, amount]);
    });
    
    // Style the header row
    categorySheet.getRow(1).font = { bold: true };
    categorySheet.columns.forEach(column => {
      column.width = 20;
    });
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads/reports');
    ensureDirectoryExists(uploadsDir);
    
    const filename = `revenue_report_${Date.now()}.xlsx`;
    const filepath = path.join(uploadsDir, filename);
    
    // Write to file
    await workbook.xlsx.writeFile(filepath);
    
    // Send file as response
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ success: false, message: 'Error downloading file' });
      }
      
      // Delete file after sending
      fs.unlink(filepath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
      });
    });
    
  } catch (error) {
    console.error('Export revenue to Excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting revenue to Excel',
      error: error.message
    });
  }
};

// @desc    Export bookings report as PDF
// @route   GET /api/admin/reports/export/pdf
// @access  Private/Admin
exports.exportBookingsAsPDF = async (req, res) => {
  try {
    const { startDate, endDate, cabinId, status } = req.query;
    const query = {};
    
    // Apply filters if provided
    if (startDate) query.startDate = { $gte: new Date(startDate) };
    if (endDate) query.endDate = { $lte: new Date(endDate) };
    if (cabinId) query.cabinId = cabinId;
    if (status) query.paymentStatus = status;
    
    // Fetch bookings with populated data
    const bookings = await Booking.find(query)
      .populate('cabinId', 'name category price serialNumber')
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });
      
    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No bookings found for the specified criteria' 
      });
    }
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads/reports');
    ensureDirectoryExists(uploadsDir);
    
    const filename = `bookings_report_${Date.now()}.pdf`;
    const filepath = path.join(uploadsDir, filename);
    
    // Create a PDF document
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);
    
    // Add title
    doc.fontSize(20).text('Bookings Report', { align: 'center' });
    doc.moveDown();
    
    // Add date range
    const dateRange = `${startDate ? new Date(startDate).toLocaleDateString() : 'All time'} to ${endDate ? new Date(endDate).toLocaleDateString() : 'Present'}`;
    doc.fontSize(12).text(`Date Range: ${dateRange}`, { align: 'center' });
    doc.moveDown(2);
    
    // Add table headers
    const tableTop = 150;
    const colWidths = [70, 100, 100, 70, 60, 60, 70];
    let currentPosition = tableTop;
    
    // Add header row
    doc.fontSize(10)
      .text('ID', 50, currentPosition)
      .text('Customer', 120, currentPosition)
      .text('Room', 220, currentPosition)
      .text('Start Date', 320, currentPosition)
      .text('End Date', 390, currentPosition)
      .text('Amount', 450, currentPosition)
      .text('Status', 510, currentPosition);
    
    doc.moveTo(50, currentPosition - 5)
      .lineTo(550, currentPosition - 5)
      .moveTo(50, currentPosition + 15)
      .lineTo(550, currentPosition + 15)
      .stroke();
    
    currentPosition += 25;
    
    // Add data rows
    bookings.forEach((booking, i) => {
      // Check if we need a new page
      if (currentPosition > 700) {
        doc.addPage();
        currentPosition = 50;
      }
      
      const shortId = booking._id.toString().substring(0, 6);
      const customerName = booking.userId ? booking.userId.name : 'N/A';
      const roomName = booking.cabinId ? booking.cabinId.name : 'N/A';
      const startDate = new Date(booking.startDate).toLocaleDateString();
      const endDate = new Date(booking.endDate).toLocaleDateString();
      
      doc.fontSize(9)
        .text(shortId, 50, currentPosition)
        .text(customerName, 120, currentPosition)
        .text(roomName, 220, currentPosition)
        .text(startDate, 320, currentPosition)
        .text(endDate, 390, currentPosition)
        .text(`₹${booking.totalPrice}`, 450, currentPosition)
        .text(booking.paymentStatus, 510, currentPosition);
      
      currentPosition += 20;
      
      // Add a light line between rows
      if (i < bookings.length - 1) {
        doc.moveTo(50, currentPosition - 5)
          .lineTo(550, currentPosition - 5)
          .opacity(0.5)
          .stroke()
          .opacity(1);
      }
    });
    
    // Add footer with totals
    const totalRevenue = bookings
      .filter(booking => booking.paymentStatus === 'completed')
      .reduce((sum, booking) => sum + booking.totalPrice, 0);
    
    doc.moveDown(2);
    doc.fontSize(11).text(`Total Revenue: ₹${totalRevenue.toFixed(2)}`, { align: 'right' });
    
    // Add page numbers
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
        .text(
          `Page ${i + 1} of ${pageCount}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );
    }
    
    // Finalize the PDF
    doc.end();
    
    // Wait for the stream to finish
    stream.on('finish', () => {
      // Send file as response
      res.download(filepath, filename, (err) => {
        if (err) {
          console.error('Download error:', err);
          res.status(500).json({ success: false, message: 'Error downloading file' });
        }
        
        // Delete file after sending
        fs.unlink(filepath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
        });
      });
    });
    
    // Handle errors
    stream.on('error', (err) => {
      console.error('Stream error:', err);
      res.status(500).json({ success: false, message: 'Error generating PDF' });
    });
    
  } catch (error) {
    console.error('Export to PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting to PDF',
      error: error.message
    });
  }
};

// @desc    Get occupancy rates (admin)
// @route   GET /api/admin/bookings/occupancy
// @access  Private/Admin
exports.getOccupancyReports = async (req, res) => {
  try {
    const { timeRange = 'monthly' } = req.query;
    
    // Get the total number of seats
    const totalSeats = await Seat.countDocuments();
    
    if (totalSeats === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // Get current date
    const currentDate = new Date();
    let startDate;
    
    // Set start date based on time range
    switch (timeRange) {
      case 'daily':
        // Last 7 days
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'weekly':
        // Last 4 weeks
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 28);
        break;
      case 'yearly':
        // Last 5 years
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 5);
        break;
      case 'monthly':
      default:
        // Last 12 months
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 12);
    }
    
    // Get all active bookings in the date range
    const bookings = await Booking.find({
      startDate: { $lte: currentDate },
      endDate: { $gte: startDate }
    });
    
    // Calculate occupancy rates
    // This is a simplified calculation and would be more complex in a real application
    const occupancyRate = (bookings.length / totalSeats) * 100;
    
    res.status(200).json({
      success: true,
      data: {
        occupancyRate: occupancyRate.toFixed(2),
        totalBookings: bookings.length,
        totalSeats
      }
    });
  } catch (error) {
    console.error('Get occupancy rates error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
