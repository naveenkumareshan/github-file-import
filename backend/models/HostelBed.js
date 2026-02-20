
const mongoose = require('mongoose');

const HostelBedSchema = new mongoose.Schema({
  number: {
    type: Number,
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
  roomNumber: {
    type: String,
    required: true
  },
  floor: {
    type: String,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  price: {
    type: Number,
    required: true
  },
  bedType: {
    type: String,
    enum: ['single', 'double', 'bunk'],
    default: 'single'
  },
  sharingType: {
    type: String,
    enum: ['private', '2-sharing', '3-sharing', '4-sharing', '5-sharing', '6-sharing', '8-sharing'],
    required: true
  },
  sharingOptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HostelRoom.sharingOptions',
    required: false
  },
  amenities: {
    type: [String],
    default: []
  },
  currentBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HostelBooking',
    default: null
  },
  bookingHistory: [{
    bookingId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'HostelBooking'
    },
    startDate: Date,
    endDate: Date,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for status checking
HostelBedSchema.virtual('status').get(function() {
  if (!this.isAvailable && this.currentBookingId) {
    return 'occupied';
  } else if (!this.isAvailable) {
    return 'unavailable';
  }
  return 'available';
});

HostelBedSchema.set('toObject', { virtuals: true });
HostelBedSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('HostelBed', HostelBedSchema);
