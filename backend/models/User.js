const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Counter = require('./Counter');

const UserSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: function() {
      return !this.socialProvider;
    },
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'hostel_manager', 'super_admin', 'vendor', 'vendor_employee'],
    default: 'student'
  },
  phone: {
    type: String,
    required: function() {
      return !this.socialProvider;
    }
  },

  alternatePhone: {
    type: String,
    default: ''
  },
  dateOfBirth: {
    type: String,
    default: ''
  },

  coursePreparingFor: {
    type: String,
    default: ''
  },

  courseStudying: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    enum: ['male', 'female', ''],
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  pincode: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  courseStudying: {
    type: String,
    default: ''
  },
  collegeStudied: {
    type: String,
    default: ''
  },
  parentMobileNumber: {
    type: String,
    default: ''
  },
  profileEditCount: {
    type: Number,
    default: 0,
    max: 2
  },
  PhotoEditsCount: {
    type: Number,
    default: 0,
    max: 2
  },
  profileEditHistory: [{
    editedAt: {
      type: Date,
      default: Date.now
    },
    changedFields: [{
      fieldName: String,
      oldValue: String,
      newValue: String
    }]
  }],
  preferences: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  hostelIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel'
  }],
  cabinIds: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cabin',
  },
  vendorIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  }],
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  permissions: [{
    type: String,
    enum: ['manage_reviews','view_dashboard','view_bookings','seats_available_map','seats_available_edit', 'manage_bookings', 'view_properties', 'manage_properties', 'view_customers', 'manage_customers', 'view_reports', 'manage_employees', 'view_payouts', 'manage_payouts']
  }],
  socialProvider: {
    type: String,
    enum: ['google', 'facebook', 'twitter', ''],
    default: ''
  },
  socialId: {
    type: String
  },
  profilePicture: {
    type: String
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpire: {
    type: Date,
    default: Date.now
  },
  // Mobile-specific data
  mobileData: {
    deviceType: {
      type: String,
      enum: ['ios', 'android', 'phone','web','Web',''],
      default: ''
    },
    platform: {
      type: String,
      default: ''
    },
    
    deviceId: {
      type: String,
      default: ''
    },
    deviceModel: {
      type: String,
      default: ''
    },
    osVersion: {
      type: String,
      default: ''
    },
    appVersion: {
      type: String,
      default: ''
    },
    fcmToken: {
      type: String,
      default: ''
    },
    sessionToken: {
      type: String,
      default: ''
    },
    sessionCreatedAt: {
      type: Date
    },
    isSessionActive: {
      type: Boolean,
      default: false
    },
    registrationLocation: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    lastActiveLocation: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    registeredAt: {
      type: Date
    },
    lastLoginAt: {
      type: Date
    },
    lastActiveTime: {
      type: Date
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    isPhoneVerified: {
      type: Boolean,
      default: false
    }
  },
  referralCode: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate user ID
UserSchema.pre('save', async function(next) {
  if (this.isNew && !this.userId) {
    const counter = await Counter.findOneAndUpdate(
      { name: 'student' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const seq = counter.seq.toString().padStart(2, '0');
    this.userId = `INSSS-${seq}`;
  }

  if (!this.isModified('password') || !this.password) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};


UserSchema.index({
  name: 1,
  email: 1,
  phone:1,
  role:1,
  vendorIds:1
});

UserSchema.index({
  vendorIds:1
});

UserSchema.index({
  role:1
});


module.exports = mongoose.model('User', UserSchema);
