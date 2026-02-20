
const mongoose = require('mongoose');

const SeatSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true
  },
  floor: {
    type: Number,
    required: true,
    default:1
  },
  cabinId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cabin',
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
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  isHotSelling: {
    type: Boolean,
    default: false
  },
  unavailableUntil: {
    type: Date
  },
  sharingType: {
    type: String,
    enum: ['private', '2-sharing', '3-sharing', '4-sharing', '5-sharing', '6-sharing'],
    default: '4-sharing'
  },
  sharingCapacity: {
    type: Number,
    default: 4
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

SeatSchema.index({
  cabinId: 1
});

module.exports = mongoose.model('Seat', SeatSchema);
