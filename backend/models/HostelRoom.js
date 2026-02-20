
const mongoose = require('mongoose');

const HostelRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a room name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  roomNumber: {
    type: String,
    required: [true, 'Please add a room number'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  floor: {
    type: String,
    required: [true, 'Please add floor information']
  },
  category: {
    type: String,
    enum: ['standard', 'premium', 'luxury'],
    default: 'standard'
  },
  basePrice: {
    type: Number,
    required: [true, 'Please add a base price']
  },
  maxCapacity: {
    type: Number,
    required: [true, 'Please add a maximum capacity']
  },
  imageSrc: {
    type: String,
    default: ''
  },
  images: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  amenities: {
    type: [String],
    default: []
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true
  },
  sharingOptions: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    type: {
      type: String, // e.g., '4-sharing'
      required: true
    },
    capacity: {
      type: Number,
      required: true
    },
    count: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    available: {
      type: Number,
      default: function () {
        return this.count * this.capacity;
      }
    },
    // Track which beds are assigned to this sharing option
    bedIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'HostelBed',
      default: []
    }
  }],  
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Easily identify all beds belonging to this room
  bedCount: {
    type: Number,
    default: 0
  }
});

// Virtual for getting the total bed count
HostelRoomSchema.virtual('totalBeds').get(function() {
  if (!this.sharingOptions || this.sharingOptions.length === 0) return 0;
  return this.sharingOptions.reduce((total, option) => total + (option.capacity * option.count), 0);
});

// Virtual for getting the total available beds
HostelRoomSchema.virtual('availableBeds').get(function() {
  if (!this.sharingOptions || this.sharingOptions.length === 0) return 0;
  return this.sharingOptions.reduce((total, option) => total + (option.available || 0), 0);
});

HostelRoomSchema.virtual('imageUrl').get(function () {
  return `${process.env.SERVER_URL}${this.imageSrc}`;
});

HostelRoomSchema.set('toObject', { virtuals: true });
HostelRoomSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('HostelRoom', HostelRoomSchema);
