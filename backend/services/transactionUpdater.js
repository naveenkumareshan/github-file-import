const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const HostelBooking = require('../models/HostelBooking');

class TransactionUpdater {
  // Update transaction with payment details
  static async updatePaymentDetails(transactionId, paymentData) {
    try {
      const transaction = await Transaction.findById(transactionId);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Update transaction with payment details
      transaction.razorpay_payment_id = paymentData.razorpay_payment_id;
      transaction.razorpay_signature = paymentData.razorpay_signature;
      transaction.status = paymentData.status || 'completed';
      transaction.paymentMethod = paymentData.method;
      transaction.paymentResponse = paymentData.response;
      transaction.updatedAt = new Date();

      await transaction.save();

      // If it's a renewal, update the booking
      if (transaction.transactionType === 'renewal' && transaction.status === 'completed') {
        await this.processBookingRenewal(transaction);
      }

      return { success: true, transaction };
    } catch (error) {
      console.error('Error updating transaction payment details:', error);
      return { success: false, error: error.message };
    }
  }

  // Process booking renewal
  static async processBookingRenewal(transaction) {
    try {
      let booking;
      
      if (transaction.bookingType === 'cabin') {
        booking = await Booking.findById(transaction.bookingId);
        if (booking) {
          // Update cabin booking
          booking.endDate = transaction.newEndDate;
          booking.durationCount = (booking.durationCount || 1) + (transaction.additionalMonths || 1);
          booking.totalPrice = booking.totalPrice + transaction.amount;
          
          // Add renewal history
          if (!booking.renewalHistory) booking.renewalHistory = [];
          booking.renewalHistory.push({
            previousEndDate: transaction.previousEndDate,
            newEndDate: transaction.newEndDate,
            additionalMonths: transaction.additionalMonths,
            additionalAmount: transaction.amount,
            renewedAt: new Date(),
            transactionId: transaction._id
          });
          
          await booking.save();
        }
      } else if (transaction.bookingType === 'hostel') {
        booking = await HostelBooking.findById(transaction.bookingId);
        if (booking) {
          // Update hostel booking
          booking.endDate = transaction.newEndDate;
          booking.months = booking.months + (transaction.additionalMonths || 1);
          booking.totalPrice = booking.totalPrice + transaction.amount;
          await booking.save();
        }
      }

      return { success: true, booking };
    } catch (error) {
      console.error('Error processing booking renewal:', error);
      return { success: false, error: error.message };
    }
  }

  // Bulk update transaction statuses
  static async bulkUpdateStatus(transactionIds, status, updateData = {}) {
    try {
      const result = await Transaction.updateMany(
        { _id: { $in: transactionIds } },
        { 
          status,
          updatedAt: new Date(),
          ...updateData
        }
      );

      return { 
        success: true, 
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      };
    } catch (error) {
      console.error('Error bulk updating transactions:', error);
      return { success: false, error: error.message };
    }
  }

  // Get transaction analytics
  static async getTransactionAnalytics(startDate, endDate) {
    try {
      const pipeline = [
        {
          $match: {
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          }
        },
        {
          $group: {
            _id: {
              status: '$status',
              bookingType: '$bookingType',
              transactionType: '$transactionType'
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' }
          }
        },
        {
          $sort: { '_id.status': 1, '_id.bookingType': 1 }
        }
      ];

      const analytics = await Transaction.aggregate(pipeline);
      
      return { success: true, analytics };
    } catch (error) {
      console.error('Error getting transaction analytics:', error);
      return { success: false, error: error.message };
    }
  }

  // Clean up old failed transactions
  static async cleanupFailedTransactions(olderThanDays = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await Transaction.deleteMany({
        status: 'failed',
        createdAt: { $lt: cutoffDate }
      });

      console.log(`Cleaned up ${result.deletedCount} old failed transactions`);
      return { success: true, deletedCount: result.deletedCount };
    } catch (error) {
      console.error('Error cleaning up failed transactions:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = TransactionUpdater;