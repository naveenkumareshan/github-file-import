const express = require('express');
const router = express.Router();
const { admin, protect } = require('../middleware/auth');
const VendorDocument = require('../models/VendorDocument');
const Vendor = require('../models/Vendor');

// Apply admin authentication to all routes
router.use(protect);
router.use(admin);

// Get all vendor documents with filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, vendorId, documentType } = req.query;
    
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (vendorId) filter.vendorId = vendorId;
    if (documentType) filter.documentType = documentType;

    const documents = await VendorDocument.find(filter)
      .populate('vendorId', 'businessName contactPerson email vendorId')
      .populate('reviewedBy', 'name email')
      .sort({ uploadedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalCount = await VendorDocument.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      documents,
      totalCount,
      totalPages,
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching vendor documents:', error);
    res.status(500).json({ message: 'Failed to fetch vendor documents' });
  }
});

// Get documents for a specific vendor
router.get('/vendor/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const documents = await VendorDocument.find({ vendorId })
      .populate('reviewedBy', 'name email')
      .sort({ uploadedAt: -1 });

    res.json(documents);
  } catch (error) {
    console.error('Error fetching vendor documents:', error);
    res.status(500).json({ message: 'Failed to fetch vendor documents' });
  }
});

// Approve/Reject document
router.put('/:documentId/status', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { status, rejectionReason, notes } = req.body;
    const adminId = req.user._id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const document = await VendorDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    document.status = status;
    document.reviewedAt = new Date();
    document.reviewedBy = adminId;
    document.rejectionReason = status === 'rejected' ? rejectionReason : undefined;
    document.notes = notes;

    await document.save();

    const updatedDocument = await VendorDocument.findById(documentId)
      .populate('vendorId', 'businessName contactPerson email')
      .populate('reviewedBy', 'name email');

    res.json({ 
      message: `Document ${status} successfully`, 
      document: updatedDocument 
    });
  } catch (error) {
    console.error('Error updating document status:', error);
    res.status(500).json({ message: 'Failed to update document status' });
  }
});

// Get document statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await VendorDocument.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalDocuments = await VendorDocument.countDocuments();
    const pendingCount = stats.find(s => s._id === 'pending')?.count || 0;
    const approvedCount = stats.find(s => s._id === 'approved')?.count || 0;
    const rejectedCount = stats.find(s => s._id === 'rejected')?.count || 0;

    res.json({
      total: totalDocuments,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount
    });
  } catch (error) {
    console.error('Error fetching document stats:', error);
    res.status(500).json({ message: 'Failed to fetch document stats' });
  }
});

module.exports = router;