const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['error', 'warn', 'info'],
    default: 'error',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  stack: {
    type: String
  },
  source: {
    type: String, // API endpoint, component, service, etc.
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userAgent: String,
  ip: String,
  method: String, // HTTP method
  url: String,    // Request URL
  statusCode: Number,
  errorCode: String, // Custom error codes
  metadata: {
    type: mongoose.Schema.Types.Mixed // Additional context data
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  notes: String
}, {
  timestamps: true
});

// Indexes for better query performance
errorLogSchema.index({ level: 1 });
errorLogSchema.index({ source: 1 });
errorLogSchema.index({ resolved: 1 });
errorLogSchema.index({ createdAt: -1 });
errorLogSchema.index({ userId: 1 });

module.exports = mongoose.model('ErrorLog', errorLogSchema);