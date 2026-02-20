
const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    maxlength: 3
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const stateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    maxlength: 3
  },
  countryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  stateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: true
  },
  latitude: {
    type: Number
  },
  longitude: {
    type: Number
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const areaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  cityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  pincode: {
    type: String
  },
  latitude: {
    type: Number
  },
  longitude: {
    type: Number
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
// countrySchema.index({ code: 1 });
stateSchema.index({ countryId: 1, code: 1 });
citySchema.index({ stateId: 1 });
areaSchema.index({ cityId: 1 });

const Country = mongoose.model('Country', countrySchema);
const State = mongoose.model('State', stateSchema);
const City = mongoose.model('City', citySchema);
const Area = mongoose.model('Area', areaSchema);

module.exports = { Country, State, City, Area };
