
const mongoose = require('mongoose');

const VendorEmployeeSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['manager', 'staff', 'admin'],
    default: 'staff'
  },
  permissions: [{
    type: String,
    enum: ['manage_reading_rooms','view_students','manage_students','view_reading_rooms','manage_reviews','view_dashboard','view_bookings','seats_available_map','seats_available_edit', 'manage_bookings', 'view_properties', 'manage_properties', 'view_customers', 'manage_customers', 'view_reports', 'manage_employees', 'view_payouts', 'manage_payouts']
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  salary: {
    type: Number,
    default: 0
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date
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

// Auto-generate employee ID
VendorEmployeeSchema.pre('save', async function(next) {
  if (this.isNew && !this.employeeId) {
    const counter = await mongoose.model('Counter').findOneAndUpdate(
      { name: 'vendor_employee' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const seq = counter.seq.toString().padStart(4, '0');
    this.employeeId = `EMP-${seq}`;
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('VendorEmployee', VendorEmployeeSchema);
