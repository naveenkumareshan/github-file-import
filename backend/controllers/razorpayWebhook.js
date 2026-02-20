const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const HostelBooking = require('../models/HostelBooking');
const Settings = require('../models/Settings');

// @desc    Handle Razorpay webhook events
// @route   POST /api/webhooks/razorpay
// @access  Public (but verified by signature)
exports.handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookBody = JSON.stringify(req.body);
    
    // Verify webhook signature
    const isValidSignature = verifyWebhookSignature(webhookBody, webhookSignature);
    
    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    const { event, payload } = req.body;
    
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload.payment.entity);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(payload.payment.entity);
        break;
      
      case 'payment.authorized':
        await handlePaymentAuthorized(payload.payment.entity);
        break;
        
      case 'order.paid':
        await handleOrderPaid(payload.order.entity, payload.payment.entity);
        break;
        
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
};

// Verify webhook signature for security
async function verifyWebhookSignature(body, signature) {
  try {
        
    const settings = await Settings.findOne({ category:'payment', provider:'razorpay' });
    
    const webhookSecret = settings.settings.keySecret;
    
    if (!webhookSecret) {
      console.error('Razorpay webhook secret not configured');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Handle successful payment capture
async function handlePaymentCaptured(payment) {
  try {
    console.log(`Processing payment captured: ${payment.id}`);
    
    // Find transaction by Razorpay payment ID or order ID
    let transaction = await Transaction.findOne({
      $or: [
        { razorpay_payment_id: payment.id },
        { razorpay_order_id: payment.order_id }
      ]
    });

    if (!transaction) {
      console.log(`Transaction not found for payment: ${payment.id}`);
      return;
    }

    // Update transaction status
    transaction.status = 'completed';
    transaction.razorpay_payment_id = payment.id;
    transaction.paymentResponse = payment;
    transaction.paymentMethod = payment.method;
    transaction.updatedAt = new Date();

    await transaction.save();

    // Update booking based on transaction type
    await updateBookingFromTransaction(transaction, 'completed');

    console.log(`Successfully processed payment captured for transaction: ${transaction.transactionId}`);
  } catch (error) {
    console.error('Error handling payment captured:', error);
    throw error;
  }
}

// Handle failed payment
async function handlePaymentFailed(payment) {
  try {
    console.log(`Processing payment failed: ${payment.id}`);
    
    // Find transaction by Razorpay payment ID or order ID
    let transaction = await Transaction.findOne({
      $or: [
        { razorpay_payment_id: payment.id },
        { razorpay_order_id: payment.order_id }
      ]
    });

    if (!transaction) {
      console.log(`Transaction not found for failed payment: ${payment.id}`);
      return;
    }

    // Update transaction status
    transaction.status = 'failed';
    transaction.razorpay_payment_id = payment.id;
    transaction.paymentResponse = payment;
    transaction.updatedAt = new Date();

    await transaction.save();

    // Update booking for failed payment
    await updateBookingFromTransaction(transaction, 'failed');

    console.log(`Successfully processed payment failed for transaction: ${transaction.transactionId}`);
  } catch (error) {
    console.error('Error handling payment failed:', error);
    throw error;
  }
}

// Handle authorized payment (for manual capture)
async function handlePaymentAuthorized(payment) {
  try {
    console.log(`Processing payment authorized: ${payment.id}`);
    
    let transaction = await Transaction.findOne({
      $or: [
        { razorpay_payment_id: payment.id },
        { razorpay_order_id: payment.order_id }
      ]
    });

    if (!transaction) {
      console.log(`Transaction not found for authorized payment: ${payment.id}`);
      return;
    }

    // Update transaction with authorized status (still pending until captured)
    transaction.razorpay_payment_id = payment.id;
    transaction.paymentResponse = payment;
    transaction.paymentMethod = payment.method;
    transaction.updatedAt = new Date();

    await transaction.save();

    console.log(`Successfully processed payment authorized for transaction: ${transaction.transactionId}`);
  } catch (error) {
    console.error('Error handling payment authorized:', error);
    throw error;
  }
}

// Handle order paid event
async function handleOrderPaid(order, payment) {
  try {
    console.log(`Processing order paid: ${order.id}`);
    
    let transaction = await Transaction.findOne({
      razorpay_order_id: order.id
    });

    if (!transaction) {
      console.log(`Transaction not found for order: ${order.id}`);
      return;
    }

    // Update transaction status
    transaction.status = 'completed';
    transaction.razorpay_payment_id = payment.id;
    transaction.paymentResponse = { order, payment };
    transaction.paymentMethod = payment.method;
    transaction.updatedAt = new Date();

    await transaction.save();

    // Update booking
    await updateBookingFromTransaction(transaction, 'completed');

    console.log(`Successfully processed order paid for transaction: ${transaction.transactionId}`);
  } catch (error) {
    console.error('Error handling order paid:', error);
    throw error;
  }
}

// Update booking based on transaction status
async function updateBookingFromTransaction(transaction, status) {
  try {
    let booking;
    
    if (transaction.bookingType === 'cabin') {
      booking = await Booking.findById(transaction.bookingId);
    } else if (transaction.bookingType === 'hostel') {
      booking = await HostelBooking.findById(transaction.bookingId);
    }

    if (!booking) {
      console.log(`Booking not found for transaction ${transaction.transactionId}`);
      return;
    }

    if (status === 'completed') {
      // Handle successful payment
      if (transaction.transactionType === 'booking') {
        // Initial booking payment
        booking.paymentStatus = 'completed';
        booking.status = 'completed';
        booking.paymentDate = new Date();
      } else if (transaction.transactionType === 'renewal') {
        // Renewal payment - extend booking
        if (transaction.newEndDate) {
          booking.endDate = new Date(transaction.newEndDate);
        }
        if (transaction.additionalMonths) {
          booking.months = (booking.months || 1) + transaction.additionalMonths;
        }
        booking.totalPrice = (booking.totalPrice || 0) + transaction.amount;
        
        // Add to renewal history
        if (!booking.renewalHistory) booking.renewalHistory = [];
        booking.renewalHistory.push({
          previousEndDate: transaction.previousEndDate,
          newEndDate: transaction.newEndDate,
          additionalMonths: transaction.additionalMonths,
          additionalAmount: transaction.amount,
          previousAmount: booking.totalPrice - transaction.amount,
          renewedAt: new Date(),
          renewedBy: transaction.userId,
          transactionId: transaction._id
        });

        // Add coupon to booking's coupon history if applied
        if (transaction.appliedCoupon && transaction.appliedCoupon.couponCode) {
          if (!booking.couponsHistory) booking.couponsHistory = [];
          booking.couponsHistory.push({
            couponId: transaction.appliedCoupon.couponId,
            couponCode: transaction.appliedCoupon.couponCode,
            discountAmount: transaction.appliedCoupon.discountAmount,
            couponType: transaction.appliedCoupon.couponType,
            couponValue: transaction.appliedCoupon.couponValue,
            appliedAt: transaction.appliedCoupon.appliedAt || new Date(),
            transactionId: transaction._id,
            transactionType: 'renewal'
          });
        }
      }
    } else if (status === 'failed') {
      // Handle failed payment
      if (transaction.transactionType === 'booking') {
        booking.paymentStatus = 'failed';
        booking.status = 'failed';
      }
      // For renewals, we don't change the existing booking status
    }

    await booking.save();
    console.log(`Updated booking ${booking.bookingId || booking._id} for transaction ${transaction.transactionId}`);
  } catch (error) {
    console.error('Error updating booking from transaction:', error);
    throw error;
  }
}

// @desc    Get webhook logs (for debugging)
// @route   GET /api/webhooks/razorpay/logs
// @access  Private/Admin
exports.getWebhookLogs = async (req, res) => {
  try {
    // This would typically fetch from a webhook logs collection
    // For now, return recent transactions that were updated via webhook
    const recentTransactions = await Transaction.find({
      updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      razorpay_payment_id: { $exists: true, $ne: null }
    })
    .select('transactionId status bookingType transactionType razorpay_payment_id updatedAt')
    .sort({ updatedAt: -1 })
    .limit(50);

    res.status(200).json({
      success: true,
      data: recentTransactions
    });
  } catch (error) {
    console.error('Get webhook logs error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};