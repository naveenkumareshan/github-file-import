const ErrorLog = require('../models/ErrorLog');

// Get error logs with pagination and filtering
exports.getErrorLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      level,
      source,
      resolved,
      startDate,
      endDate,
      search
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (level) filter.level = level;
    if (source) filter.source = { $regex: source, $options: 'i' };
    if (resolved !== undefined) filter.resolved = resolved === 'true';
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    if (search) {
      filter.$or = [
        { message: { $regex: search, $options: 'i' } },
        { source: { $regex: search, $options: 'i' } },
        { errorCode: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [logs, total] = await Promise.all([
      ErrorLog.find(filter)
        .populate('userId', 'name email')
        .populate('resolvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ErrorLog.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalLogs: total,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching error logs:', error);
    res.status(500).json({ error: 'Failed to fetch error logs' });
  }
};

// Create new error log
exports.createErrorLog = async (req, res) => {
  try {
    const {
      level,
      message,
      stack,
      source,
      userId,
      userAgent,
      ip,
      method,
      url,
      statusCode,
      errorCode,
      metadata
    } = req.body;

    const errorLog = new ErrorLog({
      level,
      message,
      stack,
      source,
      userId,
      userAgent,
      ip,
      method,
      url,
      statusCode,
      errorCode,
      metadata
    });

    await errorLog.save();
    res.status(201).json({ message: 'Error log created successfully', errorLog });
  } catch (error) {
    console.error('Error creating error log:', error);
    res.status(500).json({ error: 'Failed to create error log' });
  }
};

// Delete error log
exports.deleteErrorLog = async (req, res) => {
  try {
    const { id } = req.params;
    
    const errorLog = await ErrorLog.findByIdAndDelete(id);
    if (!errorLog) {
      return res.status(404).json({ error: 'Error log not found' });
    }

    res.json({ message: 'Error log deleted successfully' });
  } catch (error) {
    console.error('Error deleting error log:', error);
    res.status(500).json({ error: 'Failed to delete error log' });
  }
};

// Delete multiple error logs
exports.deleteMultipleErrorLogs = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid ids provided' });
    }

    const result = await ErrorLog.deleteMany({ _id: { $in: ids } });
    
    res.json({ 
      message: `${result.deletedCount} error logs deleted successfully`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error deleting multiple error logs:', error);
    res.status(500).json({ error: 'Failed to delete error logs' });
  }
};

// Mark error log as resolved
exports.markAsResolved = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const errorLog = await ErrorLog.findByIdAndUpdate(
      id,
      {
        resolved: true,
        resolvedBy: req.user._id,
        resolvedAt: new Date(),
        notes
      },
      { new: true }
    ).populate('resolvedBy', 'name email');

    if (!errorLog) {
      return res.status(404).json({ error: 'Error log not found' });
    }

    res.json({ message: 'Error log marked as resolved', errorLog });
  } catch (error) {
    console.error('Error marking error log as resolved:', error);
    res.status(500).json({ error: 'Failed to mark error log as resolved' });
  }
};

// Get error log statistics
exports.getErrorLogStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const [
      totalLogs,
      resolvedLogs,
      pendingLogs,
      errorLevelStats,
      sourceStats
    ] = await Promise.all([
      ErrorLog.countDocuments(filter),
      ErrorLog.countDocuments({ ...filter, resolved: true }),
      ErrorLog.countDocuments({ ...filter, resolved: false }),
      ErrorLog.aggregate([
        { $match: filter },
        { $group: { _id: '$level', count: { $sum: 1 } } }
      ]),
      ErrorLog.aggregate([
        { $match: filter },
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      totalLogs,
      resolvedLogs,
      pendingLogs,
      errorLevelStats,
      sourceStats
    });
  } catch (error) {
    console.error('Error fetching error log statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};