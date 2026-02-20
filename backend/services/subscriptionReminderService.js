const cron = require('node-cron');
const { format, addDays, differenceInDays } = require('date-fns');
const Booking = require('../models/Booking');
const HostelBooking = require('../models/HostelBooking');
const EmailJob = require('../models/EmailJob');
const emailService = require('./emailService');
const jobProcessor = require('./jobProcessor');

class SubscriptionReminderService {
  constructor() {
    this.isRunning = false;
    this.reminderDays = [7, 3, 1]; // Days before expiry to send reminders
  }

  // Initialize the subscription reminder scheduler
  init() {
    console.log('Initializing subscription reminder service...');
    
    // Run daily at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      try {
        console.log(`Running subscription reminders check: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
        await this.checkAndSendReminders();
      } catch (error) {
        console.error('Error in subscription reminder scheduler:', error);
      }
    });

    // Run once at startup for testing
    this.checkAndSendReminders()
      .then(() => console.log('Initial subscription reminder check completed'))
      .catch(err => console.error('Error in initial subscription reminder check:', err));
  }

  // Check bookings and send reminders
  async checkAndSendReminders() {
    if (this.isRunning) {
      console.log('Subscription reminder check already running, skipping...');
      return;
    }

    this.isRunning = true;
    
    try {
      // Check cabin bookings
      await this.checkCabinBookings();
      
      // Check hostel bookings
      await this.checkHostelBookings();
      
    } catch (error) {
      console.error('Error checking subscription reminders:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Check cabin bookings for reminders
  async checkCabinBookings() {
    const today = new Date();
    
    for (const reminderDay of this.reminderDays) {
      const targetDate = addDays(today, reminderDay);
      
      try {
        // Find cabin bookings expiring on target date
        const expiringBookings = await Booking.find({
          paymentStatus: 'completed',
          endDate: {
            $gte: new Date(targetDate.setUTCHours(0, 0, 0, 0)),
            $lt: new Date(targetDate.setUTCHours(23, 59, 59, 999))
          }
        })
        .populate('userId', 'name email userID profilePicture')
        .populate('cabinId', 'cabinCode name')
        .populate('seatId', 'number');

        console.log(`Found ${expiringBookings.length} cabin bookings expiring in ${reminderDay} days`);

        for (const booking of expiringBookings) {
          await this.sendBookingReminder(booking, reminderDay, 'cabin');
        }
      } catch (error) {
        console.error(`Error checking cabin bookings for ${reminderDay} day reminder:`, error);
      }
    }
  }

  // Check hostel bookings for reminders
  async checkHostelBookings() {
    const today = new Date();
    
    for (const reminderDay of this.reminderDays) {
      const targetDate = addDays(today, reminderDay);
      
      try {
        // Find hostel bookings expiring on target date
        const expiringBookings = await HostelBooking.find({
          paymentStatus: 'completed',
          endDate: {
            $gte: new Date(targetDate.setUTCHours(0, 0, 0, 0)),
            $lt: new Date(targetDate.setUTCHours(23, 59, 59, 999))
          }
        })
        .populate('userId', 'name email userID profilePicture')
        .populate('hostelId', 'name')
        .populate('roomId', 'name')
        .populate('bedId', 'name');

        console.log(`Found ${expiringBookings.length} hostel bookings expiring in ${reminderDay} days`);

        for (const booking of expiringBookings) {
          await this.sendBookingReminder(booking, reminderDay, 'hostel');
        }
      } catch (error) {
        console.error(`Error checking hostel bookings for ${reminderDay} day reminder:`, error);
      }
    }
  }

  // Send reminder email for a specific booking
  async sendBookingReminder(booking, daysUntilExpiry, bookingType) {
    try {
      // Check if reminder already sent for this booking and day
      const existingReminder = await EmailJob.findOne({
        recipientEmail: booking.userId.email,
        type: 'booking_reminder',
        [`related${bookingType === 'cabin' ? 'Booking' : 'HostelBooking'}Id`]: booking._id,
        variables: { $regex: `"daysUntilExpiry":${daysUntilExpiry}` },
        status: { $in: ['completed', 'processing', 'pending'] },
        createdAt: {
          $gte: new Date(new Date().setUTCHours(0, 0, 0, 0))
        }
      });

      if (existingReminder) {
        console.log(`Reminder already sent for booking ${booking.bookingId || booking._id} (${daysUntilExpiry} days)`);
        return;
      }

      const reminderData = {
        email: booking.userId.email,
        name: booking.userId.name,
        bookingDetails: {
          id: booking.bookingId || booking._id,
          type: bookingType === 'cabin' ? 'Cabin Booking' : 'Hostel Booking',
          startDate: format(new Date(booking.startDate), 'MMM dd, yyyy HH:mm:ss'),
          endDate: format(new Date(booking.endDate), 'MMM dd, yyyy HH:mm:ss'),
          location: bookingType === 'cabin' 
            ? `${booking.cabinId?.name} - ${booking.seatId?.number}`
            : `${booking.hostelId?.name} - ${booking.roomId?.name} - ${booking.bedId?.name}`,
          totalPrice: booking.totalPrice,
          daysUntilExpiry: daysUntilExpiry,
          renewUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/bookings/${booking._id}/renew`
        }
      };

      // Add to job queue
      const jobId = jobProcessor.addJob(
        'send_booking_reminder',
        reminderData,
        'normal'
      );

      console.log(`Queued reminder for booking ${booking.bookingId || booking._id} (${daysUntilExpiry} days) - Job: ${jobId}`);

    } catch (error) {
      console.error(`Error sending reminder for booking ${booking.bookingId || booking._id}:`, error);
    }
  }

  // Manual trigger for testing
  async triggerManualCheck() {
    console.log('Manually triggering subscription reminder check...');
    await this.checkAndSendReminders();
  }
}

// Create singleton instance
const subscriptionReminderService = new SubscriptionReminderService();

module.exports = subscriptionReminderService;