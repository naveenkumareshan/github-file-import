
const mongoose = require('mongoose');

const depositRefundSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cabinId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cabin',
    required: true
  },
  seatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seat',
    required: true
  },
  keyDeposit: {
    type: Number,
    required: true
  },
  isKeyDepositPaid: {
    type: Boolean,
    default: false
  },
  keyDepositRefunded: {
    type: Boolean,
    default: false
  },
  keyDepositRefundDate: {
    type: Date
  },
  refundAmount: {
    type: Number
  },
  refundReason: {
    type: String
  },
  refundMethod: {
    type: String,
    enum: ['bank_transfer', 'upi', 'cash', 'razorpay']
  },
  transactionId: {
    type: String
  },
  transactionImageUrl: {
    type: String
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'refunded'],
    default: 'active'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Index for efficient queries
depositRefundSchema.index({ bookingId: 1 });
depositRefundSchema.index({ userId: 1 });
depositRefundSchema.index({ cabinId: 1 });
depositRefundSchema.index({ keyDepositRefunded: 1 });
depositRefundSchema.index({ paymentStatus: 1, status:1 });
depositRefundSchema.index({ endDate: 1 });

module.exports = mongoose.model('DepositRefund', depositRefundSchema);
