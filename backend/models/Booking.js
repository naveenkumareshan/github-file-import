
const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  bookingId: {
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
    required: true
  },
  seatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seat',
    required: true
  },
  floor: {
    type: Number,
    default:0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  bookingDuration: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'monthly'
  },
  durationCount: {
    type: Number,
    required: true,
    min: 1
  },
  months: {
    type: Number
  },
  originalPrice: {
    type: Number
  },
  totalPrice: {
    type: Number,
    required: true
  },
  seatPrice: {
    type: Number
  },
  // Coupon fields
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
    couponValue: Number
  },
  // Enhanced commission tracking fields
  commission: {
    type: Number,
    default: 0
  },
  netRevenue: {
    type: Number,
    default: 0
  },
  commissionRate: {
    type: Number,
    default: 0
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
  keyDeposit: {
    type: Number,
    default: 500
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
  isRenewal: {
    type: Boolean,
    default: false
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed','cancelled'],
    default: 'pending'
  },
  display: {
    type: Boolean,
    default : true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  bookingStatus: {
    type: String,
    enum: ['active','renewed', 'transferred','completed','expired'],
    default: 'active'
  },
  paymentMethod: {
    type: String
  },
  razorpay_order_id: {
    type: String
  },
  paymentResponse: {
    type: JSON
  },
  paymentDate: {
    type: Date
  },
  couponsHistory: [{
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
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    transactionType: {
      type: String,
      enum: ['booking', 'renewal', 'cancellation', 'refund']
    }
  }],
  renewalHistory: [{
    previousEndDate: {
      type: Date,
      required: true
    },
    previousAmount: {
      type: Number,
      required: true
    },
    newEndDate: {
      type: Date,
      required: true
    },
    additionalMonths: {
      type: Number,
      required: true
    },
    additionalAmount: {
      type: Number,
      required: true
    },
    renewedAt: {
      type: Date,
      default: Date.now
    },
    renewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastExtendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  transferredHistory: [{
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
   transferredAt: {
      type: Date,
      default: Date.now
    },
    transferredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
});
// Middleware to calculate commission before saving
BookingSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('totalPrice')) {
    try {
      // Get vendor information for commission calculation
      const Cabin = mongoose.model('Cabin');
      const Vendor = mongoose.model('Vendor');
      
      const cabin = await Cabin.findById(this.cabinId);
      if (cabin && cabin.createdBy) {
        const vendor = await Vendor.findById(cabin.vendorId);
        if (vendor && vendor.commissionSettings) {
          const commissionRate = vendor.commissionSettings.type === 'percentage' 
            ? vendor.commissionSettings.value / 100 
            : 0.2; // Default 20%
          
          this.commissionRate = commissionRate;
          this.commission = this.totalPrice * commissionRate;
          this.netRevenue = this.totalPrice - this.commission;
        }
      }
    } catch (error) {
      console.error('Error calculating commission:', error);
    }
  }
  next();
});

BookingSchema.index({
  seatId: 1,
  paymentStatus: 1,
  status: 1,
  startDate: 1,
  endDate: 1
});


module.exports = mongoose.model('Booking', BookingSchema);
