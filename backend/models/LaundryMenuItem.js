
const mongoose = require('mongoose');

const LaundryMenuItemSchema = new mongoose.Schema({
  icon: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LaundryMenuItem', LaundryMenuItemSchema);
