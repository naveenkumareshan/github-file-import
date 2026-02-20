
const cron = require('node-cron');
const { format } = require('date-fns');
const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const DepositRefund = require('../models/DepositRefund');
// Initialize the booking scheduler
exports.initBookingScheduler = () => {
  console.log('Initializing booking scheduler...');

  // Run every day at midnight
  cron.schedule('*/10 * * * *', async () => {
    try {
      console.log(`Running seat availability check: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
      await updateSeatAvailability();
    } catch (error) {
      console.error('Error in booking scheduler:', error);
    }
  });


  cron.schedule('* * * * *', async () => {
    try {
      console.log(`Running Payment status check: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
      await rollbackUnpaidBookings();
    } catch (error) {
      console.error('Error in booking scheduler:', error);
    }
  });
  
  // Run once at startup to update seat availability
  updateSeatAvailability()
    .then(() => console.log('Initial seat availability update completed'))
    .catch(err => console.error('Error in initial seat availability update:', err));

    rollbackUnpaidBookings()
    .then(() => console.log('Initial seat availability update completed'))
    .catch(err => console.error('Error in initial seat availability update:', err));
};

// Update seat availability for expired bookings
const updateSeatAvailability = async () => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  try {
    // Find completed bookings where the endDate has passed
    const expiredBookings = await Booking.find({
      endDate: { $lt: today },
      paymentStatus: 'completed',
      bookingStatus: { $ne: 'expired' }
    });

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    await Booking.updateMany(
      {
        createdAt: { $lt: twentyFourHoursAgo },
        paymentStatus: { $ne: 'completed' }
      },
      {
        $set: {
          display: false
        }
      }
    );
    
    console.log(`Found ${expiredBookings.length} expired bookings to process`);
    
    // Update each seat to available
    for (const booking of expiredBookings) {
      // await Seat.findByIdAndUpdate(booking.seatId, { 
      //   isAvailable: true,
      //   unavailableUntil: null
      // });
      await Booking.findByIdAndUpdate(booking._id, { 
        bookingStatus:'expired'
      });

      const depositeRefundData = await DepositRefund.findOne({bookingId: booking._id})
      depositeRefundData.isKeyDepositPaid = false;
      depositeRefundData.status = 'expired';
      depositeRefundData.save();
      
      console.log(`Updated seat ${booking.seatId} to available (booking ${booking._id} expired)`);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating seat availability:', error);
    return false;
  }
};


// Update seat availability for canceled orders bookings
const rollbackUnpaidBookings = async () => {
  const expiryTimeInMinutes = 5;
  const expiryThreshold = new Date(Date.now() - expiryTimeInMinutes * 60 * 1000);
  const BATCH_SIZE = 100; // Process in batches of 100
  const MAX_PROCESSING_TIME = 30000; // 30 seconds max processing time
  const startTime = Date.now();
  let totalProcessed = 0;
  let hasMore = true;

  try {
    while (hasMore && (Date.now() - startTime) < MAX_PROCESSING_TIME) {
      // Find pending bookings in batches with limit
      const pendingBookings = await Booking.find({
        paymentStatus: 'pending',
        createdAt: { $lt: expiryThreshold }
      })
      .limit(BATCH_SIZE)
      .select('_id seatId') // Only select needed fields
      .lean(); // Use lean() for better performance

      if (pendingBookings.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`Processing batch of ${pendingBookings.length} pending bookings`);

      // Extract booking IDs and seat IDs for bulk operations
      const bookingIds = pendingBookings.map(booking => booking._id);
      // const seatIds = pendingBookings.map(booking => booking.seatId);

      try {
        // Use Promise.allSettled for better error handling
        const [seatUpdateResult, bookingUpdateResult] = await Promise.allSettled([
          // Bulk update seats
          // Seat.updateMany(
          //   { _id: { $in: seatIds } },
          //   {
          //     $set: {
          //       isAvailable: true,
          //       unavailableUntil: null
          //     }
          //   }
          // ),
          // Bulk update bookings
          Booking.updateMany(
            { _id: { $in: bookingIds } },
            {
              $set: {
                paymentStatus: 'failed',
                status: 'cancelled'
              }
            }
          )
        ]);

        // Log results
        if (seatUpdateResult.status === 'fulfilled') {
          console.log(`Freed ${seatUpdateResult.value.modifiedCount} seats in batch`);
        } else {
          console.error('Error updating seats:', seatUpdateResult.reason);
        }

        if (bookingUpdateResult.status === 'fulfilled') {
          console.log(`Cancelled ${bookingUpdateResult.value.modifiedCount} bookings in batch`);
        } else {
          console.error('Error updating bookings:', bookingUpdateResult.reason);
        }

        totalProcessed += pendingBookings.length;

        // Add a small delay between batches to prevent overwhelming the database
        if (pendingBookings.length === BATCH_SIZE) {
          await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay
        } else {
          hasMore = false; // Last batch was smaller than limit
        }

      } catch (batchError) {
        console.error('Error processing batch:', batchError);
        // Continue with next batch instead of failing completely
        continue;
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(`Rollback completed. Processed ${totalProcessed} bookings in ${processingTime}ms`);
    
    // Log if we hit time limit
    if (processingTime >= MAX_PROCESSING_TIME) {
      console.warn('Rollback hit time limit. Remaining bookings will be processed in next cycle.');
    }

    return true;
  } catch (error) {
    console.error('Error rolling back unpaid bookings:', error);
    return false;
  }
};
