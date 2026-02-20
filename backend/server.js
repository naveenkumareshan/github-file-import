require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const fileUpload = require('express-fileupload');
const morgan = require('morgan');
const passport = require('passport');
const session = require('express-session');

const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

// Express app initialization
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/serene-reads',{ autoIndex: true })
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Enable CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cookie'],
}));
app.use(cookieParser());

// File upload middleware
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  abortOnLimit: true,
  responseOnLimit: 'File size limit has been reached'
}));

// Session middleware (required for passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'serene-reads-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// Sanitize data
app.use(mongoSanitize());

// Set security headers
// app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100
});
// app.use(limiter);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Import passport config
require('./config/passport');

const { 
  errorLogger, 
  requestLogger, 
  handleUnhandledRejection, 
  handleUncaughtException 
} = require('./middleware/errorLogger');

// Initialize global error handlers
handleUnhandledRejection();
handleUncaughtException();

// Request logging middleware (logs slow requests and errors)
if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger);
}


// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use('/api/mobile-auth', require("./routes/mobileAuth"));
app.use('/api/users', require('./routes/users'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/email-templates', require('./routes/emailTemplates'));
app.use('/api/notifications', require('./routes/notifications'));
app.use("/api/cabins", require("./routes/cabins"));
app.use("/api/seats", require("./routes/seats"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/payments", require("./routes/payments"));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/transactions/', require('./routes/transactionReports'));
app.use("/api/admin/bookings", require("./routes/adminBookings"));
app.use("/api/admin/bookings", require("./routes/adminBulkBookings")); // Add bulk booking routes
app.use("/api/admin/users", require("./routes/adminUsers"));
app.use('/api/admin/locations', require('./routes/adminLocations'));
app.use("/api/admin/rooms", require("./routes/adminRooms"));
app.use("/api/admin/laundry", require("./routes/adminLaundry"));
app.use('/api/admin/deposits', require('./routes/adminDeposits'));
app.use('/api/admin/room-restrictions', require('./routes/adminRoomRestrictions'));
app.use("/api/admin/reports", require("./routes/reportsExport"));
app.use("/api/admin/manual-bookings", require("./routes/adminManualBookings")); // Add the new manual booking routes
app.use('/api/admin/user-sessions', require('./routes/userSessions'));
app.use("/api/laundry", require("./routes/laundry"));
app.use('/api/uploads', require('./routes/uploads')); 
// Add hostel routes
app.use("/api/hostels", require("./routes/hostels"));
app.use("/api/hostel/bookings", require("./routes/hostelBookings"));
app.use("/api/hostel-bookings", require("./routes/hostelBookings"));
app.use("/api/room-sharing", require("./routes/roomSharing"));
// Add hostel room routes
app.use("/api/hostel-rooms", require("./routes/hostelRooms"));
app.use('/api/manager/cabins/managed', require('./routes/hostelManagerCabins'));

app.use('/api/hostel-beds', require('./routes/hostelBeds'));

//vendor
app.use('/api/vendor', require('./routes/vendor'));
app.use('/api/admin/vendor-documents', require('./routes/adminVendorDocuments'));
app.use('/api/vendor-registration', require('./routes/vendorRegistration'));
app.use('/api/admin', require('./routes/superAdmin'));
// Import routes
const reviews = require('./routes/reviews');
const settings = require('./routes/settings');
const coupons = require('./routes/coupons');

// Mount routes
app.use('/api/reviews', reviews);
app.use('/api/admin/settings', settings);
app.use('/api/coupons', coupons);

app.use('/api/webhooks/razorpay', require('./routes/razorpayWebhook'));
app.use('/api/error-logs', require('./routes/errorLogs'));
// Serve static files from the React app in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../dist", "index.html"));
  });
}

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Error logging middleware (must be before final error handler)
app.use(errorLogger);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Server Error",
    error: process.env.NODE_ENV === "production" ? {} : err,
  });
});

// Add this line to import the booking scheduler
const { initBookingScheduler } = require('./controllers/bookingScheduler');
// const subscriptionReminderService = require('./services/subscriptionReminderService');
// const cronScheduler = require('./services/cronScheduler');
// Initialize the booking scheduler (add this where other initializations occur)
initBookingScheduler();
// subscriptionReminderService.init();
// cronScheduler.init();
// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}...`
  )
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  server.close(() => process.exit(1));
});
