
const mongoose = require('mongoose');

const HostelBookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HostelRoom',
    required: true
  },
  bedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HostelBed',
    required: true
  },
  sharingOptionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  sharingType: {
    type: String
  },
  startDate: {
    type: Date,
    required: true
  },
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  endDate: {
    type: Date,
    required: true
  },
  months: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentResponse: {
    type: String
  },
  paymentMethod: {
    type: String
  },
  paymentDate: {
    type: Date
  },
  razorpay_order_id: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // or whatever your user model is called
  },
  lastExtendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // or whatever your user model is called
  },
});

module.exports = mongoose.model('HostelBooking', HostelBookingSchema);
