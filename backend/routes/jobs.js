const express = require('express');
const router = express.Router();
const jobProcessor = require('../services/jobProcessor');
const { protect, admin } = require('../middleware/auth');
const subscriptionReminderService = require('../services/subscriptionReminderService');
const EmailJob = require('../models/EmailJob');

// @desc    Add a new job to the queue
// @route   POST /api/jobs/add
// @access  Private
router.post('/add', protect, (req, res) => {
  try {
    const { type, data, priority = 'normal' } = req.body;

    if (!type || !data) {
      return res.status(400).json({
        success: false,
        message: 'Job type and data are required'
      });
    }

    const jobId = jobProcessor.addJob(type, data, priority);

    res.status(201).json({
      success: true,
      jobId: jobId,
      message: 'Job added to queue successfully'
    });
  } catch (error) {
    console.error('Error adding job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add job to queue',
      error: error.message
    });
  }
});

// @desc    Get job status by ID
// @route   GET /api/jobs/:jobId
// @access  Private
router.get('/:jobId', protect, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // First check in database
    const dbJob = await EmailJob.findOne({ jobId });
    if (dbJob) {
      return res.status(200).json({
        success: true,
        job: dbJob
      });
    }
    
    // Fallback to in-memory jobs
    const job = jobProcessor.getJobStatus(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.status(200).json({
      success: true,
      job: job
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job status',
      error: error.message
    });
  }
});

// @desc    Get all jobs with filtering and pagination
// @route   GET /api/jobs
// @access  Private (Admin only)
router.get('/', protect, admin, async (req, res) => {
  try {
    const query = { ...req.query };
    

    if (query.status?.toLowerCase() === 'all') {
      delete query.status;
    }
    // Remove fields that are not database fields
    const removeFields = ['includeInactive', 'page', 'limit'];
    removeFields.forEach(param => delete query[param]);
        
    // Create query string
    let queryStr = JSON.stringify(query);
    // Create operators ($gt, $lt, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
        // Finding resource
    let emailsJobsQuery = EmailJob.find(JSON.parse(queryStr));
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await EmailJob.countDocuments(JSON.parse(queryStr));
    
    emailsJobsQuery = emailsJobsQuery.skip(startIndex).limit(limit).sort({ createdAt: -1 });
    
    // Executing query
    const jobs = await emailsJobsQuery;
    
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
      count: total,
      totalPages: Math.ceil(total / limit),
      pagination,
      data: jobs
    });
  } catch (error) {
    console.error('Error getting all jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Retry a failed job
// @route   POST /api/jobs/:jobId/retry
// @access  Private (Admin only)
router.post('/:jobId/retry', protect, admin, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Find the job in database
    const job = await EmailJob.findOne({ jobId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    if (job.status !== 'failed') {
      return res.status(400).json({
        success: false,
        message: 'Only failed jobs can be retried'
      });
    }
    
    if (job.attempts >= job.maxAttempts) {
      return res.status(400).json({
        success: false,
        message: 'Job has exceeded maximum retry attempts'
      });
    }
    
    // Reset job status to pending for retry
    await EmailJob.findOneAndUpdate(
      { jobId },
      { 
        status: 'pending',
        error: null,
        failedAt: null
      }
    );
    
    // Add back to in-memory queue
    jobProcessor.addJob(job.type, job.variables, job.priority);
    
    res.status(200).json({
      success: true,
      message: 'Job retry initiated successfully'
    });
  } catch (error) {
    console.error('Error retrying job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry job',
      error: error.message
    });
  }
});

// @desc    Export jobs report
// @route   POST /api/jobs/export
// @access  Private (Admin only)
router.post('/export', protect, admin, async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Email Jobs Report');
    
    // Add headers
    worksheet.columns = [
      { header: 'Job ID', key: 'jobId', width: 20 },
      { header: 'Type', key: 'type', width: 20 },
      { header: 'Recipient Email', key: 'recipientEmail', width: 30 },
      { header: 'Recipient Name', key: 'recipientName', width: 25 },
      { header: 'Subject', key: 'subject', width: 40 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Priority', key: 'priority', width: 15 },
      { header: 'Attempts', key: 'attempts', width: 10 },
      { header: 'Max Attempts', key: 'maxAttempts', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Processed At', key: 'processedAt', width: 20 },
      { header: 'Completed At', key: 'completedAt', width: 20 },
      { header: 'Failed At', key: 'failedAt', width: 20 },
      { header: 'Error', key: 'error', width: 50 }
    ];
    
    // Apply filters from request body
    const filters = req.body || {};
    let query = {};
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.type) {
      query.type = filters.type;
    }
    
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.createdAt.$lte = new Date(filters.endDate);
      }
    }
    
    // Get jobs data
    const jobs = await EmailJob.find(query).sort({ createdAt: -1 });
    
    // Add data rows
    jobs.forEach(job => {
      worksheet.addRow({
        jobId: job.jobId,
        type: job.type,
        recipientEmail: job.recipientEmail,
        recipientName: job.recipientName || '',
        subject: job.subject,
        status: job.status,
        priority: job.priority,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        createdAt: job.createdAt ? job.createdAt.toISOString() : '',
        processedAt: job.processedAt ? job.processedAt.toISOString() : '',
        completedAt: job.completedAt ? job.completedAt.toISOString() : '',
        failedAt: job.failedAt ? job.failedAt.toISOString() : '',
        error: job.error || ''
      });
    });
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=email-jobs-report-${new Date().toISOString().split('T')[0]}.xlsx`
    );
    
    // Write to response
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Error exporting jobs report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export jobs report',
      error: error.message
    });
  }
});

// @desc    Get jobs by status
// @route   GET /api/jobs/status/:status
// @access  Private (Admin only)
router.get('/status/:status', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'hostel_manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or manager role required.'
      });
    }

    const { status } = req.params;
    const jobs = await jobProcessor.getJobsByStatus(status);

    res.status(200).json({
      success: true,
      jobs: jobs
    });
  } catch (error) {
    console.error('Error getting jobs by status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get jobs by status',
      error: error.message
    });
  }
});

// @desc    Manually trigger subscription reminders (for testing)
// @route   POST /api/jobs/trigger-reminders
// @access  Private (Admin only)
router.post('/trigger-reminders', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'hostel_manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or manager role required.'
      });
    }

    await subscriptionReminderService.triggerManualCheck();

    res.status(200).json({
      success: true,
      message: 'Subscription reminder check triggered successfully'
    });
  } catch (error) {
    console.error('Error triggering subscription reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger subscription reminders',
      error: error.message
    });
  }
});
module.exports = router;