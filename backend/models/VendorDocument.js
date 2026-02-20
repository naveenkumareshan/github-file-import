const mongoose = require('mongoose');

const VendorDocumentSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  documentType: {
    type: String,
    required: true,
    enum: [
      'aadhar',
      'pan',
      'gst_certificate',
      'electricity_bill',
      'site_photos',
      'owner_photo',
      'cancelled_cheque'
    ]
  },
  filename: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String
  },
  notes: {
    type: String
  }
});

// Index for efficient querying
VendorDocumentSchema.index({ vendorId: 1, documentType: 1 });
VendorDocumentSchema.index({ status: 1 });

module.exports = mongoose.model('VendorDocument', VendorDocumentSchema);