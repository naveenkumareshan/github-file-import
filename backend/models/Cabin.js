
const mongoose = require('mongoose');
const Counter = require('./Counter');

const CabinSchema = new mongoose.Schema({
  cabinCode: { type: String, unique: true },
  name: {
    type: String,
    required: [true, 'Please add a cabin name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  category: {
    type: String,
    enum: ['standard', 'premium', 'luxury'],
    default: 'standard'
  },
  price: {
    type: Number,
    required: [true, 'Please add a price']
  },
  capacity: {
    type: Number,
    required: [true, 'Please add a capacity']
  },
  amenities: {
    type: [String],
    default: []
  },
  imageSrc: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },

  isBookingActive: {
    type: Boolean,
    default: true
  },

  lockerAvailable: {
    type: Boolean,
    default: true
  },

  lockerPrice: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
 ownerDetails: {
    ownerName: {
      type: String
    },
    ownerPhone: {
      type: String
    },
    ownerEmail: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
  },
  location: {
    coordinates: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required']
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required']
      }
    },
    fullAddress: {
      type: String,
      required: [true, 'Full address is required']
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
    area: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Area'
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required']
    },
    nearbyLandmarks: [String],
    googlePlaceId: {
      type: String
    },
    locality: {
      type: String
    },
    district: {
      type: String
    },
    metroStation: {
      type: String
    },
    busStops: [String],
    accessibilityFeatures: [String]
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
  roomElements: {
    type: [{
      id: { type: String, required: true },
      type: { type: String, required: true },
      position: {
        x: { type: Number, required: true },
        y: { type: Number, required: true }
      },
      rotation: { type: Number, default: 0 }
    }],
    default: []
  },
  floors: {
    type: [
      {
        id: { type: String, required: true },
        number: { type: String, required: true },
      }
    ],
    default: []
  },
  images: {
    type: [],
    default: []
  },
  serialNumber: {
    type: String
  },
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel'
  },
  managerIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required:true
  },
  sharingOptions: [{
    type: String,
    capacity: Number,
    count: Number,
    price: Number
  }],
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
  }
});
CabinSchema.index({ coordinatePoint: '2dsphere' });
CabinSchema.virtual('imageUrl').get(function () {
  return `${process.env.SERVER_URL}${this.imageSrc}`;
});

CabinSchema.set('toObject', { virtuals: true });
CabinSchema.set('toJSON', { virtuals: true });

CabinSchema.pre('save', async function (next) {
  if (this.isNew && !this.cabinCode) {
    const counter = await Counter.findOneAndUpdate(
      { name: 'cabin' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const seq = counter.seq.toString().padStart(2, '0');
    this.cabinCode = `INSRR-${seq}`;
  }
  next();
});

module.exports = mongoose.model('Cabin', CabinSchema);
