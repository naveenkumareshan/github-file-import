
const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cabinId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cabin',
    required: false
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  bookingType: {
    type: String,
    enum: ['cabin', 'hostel', 'laundry'],
    required: true
  },
  transactionType: {
    type: String,
    enum: ['booking', 'renewal', 'cancellation', 'refund'],
    required: true
  },
  appliedCoupon: {
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon'
    },
    couponCode: String,
    discountAmount: {
      type: Number,
      default: 0
    },
    couponType: {
      type: String,
      enum: ['percentage', 'fixed']
    },
    couponValue: Number,
    appliedAt: {
      type: Date,
      default: Date.now
    }
  },
  amount: {
    type: Number,
    required: true
  },
  originalPrice: {
    type: Number
  },
  totalPrice: {
    type: Number,
  },
  seatPrice: {
    type: Number
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  payoutStatus: {
    type: String,
    enum: ['pending', 'included', 'processed'],
    default: 'pending'
  },
  payoutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorPayout'
  },
  paymentMethod: {
    type: String
  },
  razorpay_order_id: {
    type: String
  },
  razorpay_payment_id: {
    type: String
  },
  razorpay_signature: {
    type: String
  },
  additionalMonths: {
    type: Number
  },
  newEndDate: {
    type: Date
  },
  previousEndDate: {
    type: Date
  },
  paymentResponse: {
    type: Object
  },
  receipt_no: {
    type: String
  },
  manual_transaction_id: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});


TransactionSchema.index({
  payoutId:1,
  bookingId:1,
  status:1
});
TransactionSchema.index({
  startDate:1,
  endDate:1
});

TransactionSchema.index({
  status:1,
  createdAt:1
});
module.exports = mongoose.model('Transaction', TransactionSchema);
