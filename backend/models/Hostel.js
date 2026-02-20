
const mongoose = require('mongoose');
const Counter = require('./Counter');

const HostelSchema = new mongoose.Schema({
  hostelCode: { type: String, unique: true },
  name: {
    type: String,
    required: [true, 'Please add a hostel name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  location: {
    type: String,
    required: [true, 'Please add a location']
  },
  description: {
    type: String
  },
  managerIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  logoImage: {
    type: String
  },
  images: {
    type: [],
    default: []
  },
  contactEmail: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  contactPhone: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // New fields
  stayType: {
    type: String,
    enum: ['Short-term', 'Long-term', 'Both'],
    default: 'Both'
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Co-ed'],
    default: 'Co-ed'
  },
  locality: {
    type: String,
    required: [true, 'Please add a locality']
  },

  area: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area'
  },
  state: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: [true, 'State is required']
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: [true, 'City is required']
  },
  country: {
    type: String,
    default: 'India'
  },
  amenities: {
    type: [String],
    default: []
  },
  coordinates: {
    lat: {
      type: Number
    },
    lng: {
      type: Number
    }
  },
  coordinatePoint: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  averageRating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
});

HostelSchema.virtual('rooms', {
  ref: 'HostelRoom',
  localField: '_id',
  foreignField: 'hostelId',
  justOne: false
});

HostelSchema.virtual('imageUrl').get(function () {
  return `${process.env.SERVER_URL}${this.logoImage}`;
});

HostelSchema.set('toObject', { virtuals: true });
HostelSchema.set('toJSON', { virtuals: true });

HostelSchema.index({ coordinatePoint: '2dsphere' });


HostelSchema.pre('save', async function (next) {
  if (this.isNew && !this.hostelCode) {
    const counter = await Counter.findOneAndUpdate(
      { name: 'hostel' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const seq = counter.seq.toString().padStart(2, '0');
    this.hostelCode = `INSH-${seq}`;
  }
  next();
});

module.exports = mongoose.model('Hostel', HostelSchema);
