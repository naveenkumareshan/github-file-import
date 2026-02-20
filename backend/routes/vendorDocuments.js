const express = require('express');
const router = express.Router();
const { vendorAuth } = require('../middleware/vendorAuth');
const VendorDocument = require('../models/VendorDocument');
const Vendor = require('../models/Vendor');

// Apply vendor authentication to all routes
router.use(vendorAuth);

// Get all documents for current vendor
router.get('/', async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    
    const documents = await VendorDocument.find({ vendorId })
      .sort({ uploadedAt: -1 });

    // Transform documents for frontend
    const transformedDocs = documents.map(doc => ({
      key: doc.documentType,
      url: doc.url,
      filename: doc.filename,
      uploadedAt: doc.uploadedAt,
      status: doc.status,
      rejectionReason: doc.rejectionReason
    }));

    res.json(transformedDocs);
  } catch (error) {
    console.error('Error fetching vendor documents:', error);
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
});

// Upload a new document
router.post('/', async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const { documentType, filename, url, fileSize, mimeType } = req.body;

    // Validate required fields
    if (!documentType || !filename || !url || !fileSize || !mimeType) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if document type already exists for this vendor
    const existingDoc = await VendorDocument.findOne({ vendorId, documentType });
    
    if (existingDoc) {
      // Update existing document
      existingDoc.filename = filename;
      existingDoc.url = url;
      existingDoc.fileSize = fileSize;
      existingDoc.mimeType = mimeType;
      existingDoc.status = 'pending';
      existingDoc.uploadedAt = new Date();
      existingDoc.reviewedAt = undefined;
      existingDoc.rejectionReason = undefined;
      
      await existingDoc.save();
      res.json({ message: 'Document updated successfully', document: existingDoc });
    } else {
      // Create new document
      const newDocument = new VendorDocument({
        vendorId,
        documentType,
        filename,
        url,
        fileSize,
        mimeType,
        status: 'pending'
      });

      await newDocument.save();
      res.status(201).json({ message: 'Document uploaded successfully', document: newDocument });
    }
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ message: 'Failed to upload document' });
  }
});

// Update document
router.put('/:documentId', async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const { documentId } = req.params;
    const updateData = req.body;

    const document = await VendorDocument.findOne({ _id: documentId, vendorId });
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    Object.assign(document, updateData);
    await document.save();

    res.json({ message: 'Document updated successfully', document });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ message: 'Failed to update document' });
  }
});

// Delete document
router.delete('/:documentId', async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const { documentId } = req.params;

    // Find by document type instead of _id since frontend sends document type
    const document = await VendorDocument.findOne({ 
      vendorId, 
      documentType: documentId 
    });
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    await VendorDocument.deleteOne({ _id: document._id });
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Failed to delete document' });
  }
});

// Get verification status
router.get('/verification-status', async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    
    const documents = await VendorDocument.find({ vendorId });
    
    const requiredDocTypes = [
      'aadhar', 'pan', 'gst_certificate', 'electricity_bill', 
      'site_photos', 'owner_photo', 'cancelled_cheque'
    ];
    
    const status = {
      totalRequired: requiredDocTypes.length,
      uploaded: documents.length,
      approved: documents.filter(doc => doc.status === 'approved').length,
      pending: documents.filter(doc => doc.status === 'pending').length,
      rejected: documents.filter(doc => doc.status === 'rejected').length,
      isComplete: documents.length === requiredDocTypes.length,
      isAllApproved: documents.length === requiredDocTypes.length && 
                     documents.every(doc => doc.status === 'approved')
    };

    res.json(status);
  } catch (error) {
    console.error('Error fetching verification status:', error);
    res.status(500).json({ message: 'Failed to fetch verification status' });
  }
});

module.exports = router;