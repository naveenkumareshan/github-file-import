
const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  vendorId: { type: String, unique: true },
  businessName: {
    type: String,
    required: true
  },
  businessType: {
    type: String,
    enum: ['individual', 'company', 'partnership','cabin'],
    required: true
  },
  contactPerson: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  businessDetails: {
    gstNumber:  {
      type: String
    },
    panNumber:  {
      type: String
    },
    aadharNumber: {
      type: String
    },
    businessLicense:  {
      type: String
    },
    description:  {
      type: String
    }
  },
  bankDetails: {
    accountHolderName:  {
      type: String
    },
    accountNumber:  {
      type: String
    },
    bankName:  {
      type: String
    },
    ifscCode:  {
      type: String
    },
    upiId:  {
      type: String
    },
  },
  commissionSettings: {
    type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    value: { type: Number, default: 20 }, // 20% default commission
    payoutCycle: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' }
  },
  autoPayoutSettings: {
    enabled: { type: Boolean, default: true },
    payoutFrequency: { type: Number, default: 7 }, // days (5, 7, 10)
    lastAutoPayout: { type: Date },
    nextAutoPayout: { type: Date },
    manualRequestCharges: {
      enabled: { type: Boolean, default: true },
      chargeType: { type: String, enum: ['percentage', 'fixed'], default: 'fixed' },
      chargeValue: { type: Number, default: 50 }, // ₹50 or percentage
      description: { type: String, default: 'Manual payout request processing fee' }
    },
    perCabinPayout: { type: Boolean, default: true },
    minimumPayoutAmount: { type: Number, default: 500 }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  documents: [{
    type: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  employeeIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  propertyIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cabin'
  }],
  hostelIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel'
  }],
  totalRevenue: {
    type: Number,
    default: 0
  },
  pendingPayout: {
    type: Number,
    default: 0
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

// Auto-generate vendor ID
VendorSchema.pre('save', async function(next) {
  if (this.isNew && !this.vendorId) {
    const counter = await mongoose.model('Counter').findOneAndUpdate(
      { name: 'vendor' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const seq = counter.seq.toString().padStart(4, '0');
    this.vendorId = `VND-${seq}`;
  }
  
  // Set next auto payout date
  if (this.autoPayoutSettings.enabled && (!this.autoPayoutSettings.nextAutoPayout || this.isModified('autoPayoutSettings.payoutFrequency'))) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + this.autoPayoutSettings.payoutFrequency);
    this.autoPayoutSettings.nextAutoPayout = nextDate;
  }
  
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Vendor', VendorSchema);
