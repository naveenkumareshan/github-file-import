
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['site', 'payment', 'email', 'sms']
  },
  provider: {
    type: String,
    required: false // Only for payment, email, sms categories
  },
  settings: {
    type: mongoose.Schema.Types.Mixed,
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
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure unique settings per category and provider combination
settingsSchema.index({ category: 1, provider: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Settings', settingsSchema);
