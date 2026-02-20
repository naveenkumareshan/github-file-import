
const mongoose = require('mongoose');

const NotificationHistorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['offer', 'booking', 'general', 'vendor_promotion'],
    required: true
  },
  targetType: {
    type: String,
    enum: ['all', 'vendor_specific', 'user_specific', 'role_specific'],
    required: true
  },
  targetIds: [{
    type: String
  }],
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  sentCount: {
    type: Number,
    default: 0
  },
  deliveredCount: {
    type: Number,
    default: 0
  },
  openedCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  offerData: {
    discount: Number,
    validUntil: String,
    offerCode: String,
    description: String
  },
  scheduledFor: {
    type: Date
  },
  sentAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('NotificationHistory', NotificationHistorySchema);
