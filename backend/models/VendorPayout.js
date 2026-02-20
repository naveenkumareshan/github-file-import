
const mongoose = require('mongoose');

const VendorPayoutSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  cabinId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cabin'
  },
  payoutId: {
    type: String,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  commission: {
    type: Number,
    required: true
  },
  netAmount: {
    type: Number,
    required: true
  },
  additionalCharges: {
    manualRequestFee: { type: Number, default: 0 },
    description: String
  },
  payoutType: {
    type: String,
    enum: ['auto', 'manual'],
    default: 'manual'
  },
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }],
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  transactionId: {
    type: String
  },
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    upiId: String
  },
  notes: {
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

// Auto-generate payout ID
VendorPayoutSchema.pre('save', async function(next) {
  if (this.isNew && !this.payoutId) {
    const counter = await mongoose.model('Counter').findOneAndUpdate(
      { name: 'vendor_payout' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const seq = counter.seq.toString().padStart(6, '0');
    this.payoutId = `VP-${seq}`;
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('VendorPayout', VendorPayoutSchema);
