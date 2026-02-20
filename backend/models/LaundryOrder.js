
const mongoose = require('mongoose');

const LaundryOrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Processing', 'Picked Up', 'Ready for Delivery', 'Delivered'],
    default: 'Processing'
  },
  items: [{
    icon: { type: String },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  pickupLocation: {
    roomNumber: { type: String, required: true },
    block: { type: String, required: true },
    floor: { type: String, required: true },
    pickupTime: { type: String }
  },
  deliveryDate: {
    type: Date
  },
  complaints: [{
    text: { type: String },
    status: { type: String, enum: ['Pending', 'Resolved'], default: 'Pending' },
    date: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate order number before saving
LaundryOrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const timestamp = date.getTime();
    const random = Math.floor(Math.random() * 1000);
    this.orderNumber = `LD-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('LaundryOrder', LaundryOrderSchema);
