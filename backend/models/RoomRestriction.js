
const mongoose = require('mongoose');

const roomRestrictionSchema = new mongoose.Schema({
  cabinId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cabin',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  restrictionType: {
    type: String,
    enum: ['date', 'time', 'capacity'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String
  },
  endTime: {
    type: String
  },
  reason: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
roomRestrictionSchema.index({ cabinId: 1 });
roomRestrictionSchema.index({ roomId: 1 });
roomRestrictionSchema.index({ restrictionType: 1 });
roomRestrictionSchema.index({ isActive: 1 });
roomRestrictionSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('RoomRestriction', roomRestrictionSchema);
