
const Vendor = require('../models/Vendor');
const VendorPayout = require('../models/VendorPayout');
const Booking = require('../models/Booking');
const Cabin = require('../models/Cabin');
const Transaction = require('../models/Transaction');

class AutoPayoutService {
  
  // Process auto payouts for all eligible vendors
  static async processAutoPayouts() {
    try {
      console.log('Starting auto payout processing...');
      
      const eligibleVendors = await Vendor.find({
        'autoPayoutSettings.enabled': true,
        'autoPayoutSettings.nextAutoPayout': { $lte: new Date() },
        status: 'approved',
        isActive: true
      });

      console.log(`Found ${eligibleVendors.length} eligible vendors for auto payout`);

      for (const vendor of eligibleVendors) {
        await this.processVendorAutoPayout(vendor);
      }

      console.log('Auto payout processing completed');
    } catch (error) {
      console.error('Auto payout processing error:', error);
    }
  }

  // Process auto payout for a specific vendor
  static async processVendorAutoPayout(vendor) {
    try {
      console.log(`Processing auto payout for vendor: ${vendor.businessName}`);

      // Get vendor's cabins
      const vendorCabins = await Cabin.find({ vendorId: vendor._id, isActive: true });

      if (vendor.autoPayoutSettings.perCabinPayout) {
        // Process separate payout for each cabin
        for (const cabin of vendorCabins) {
          await this.processCabinAutoPayout(vendor, cabin);
        }
      } else {
        // Process single payout for all cabins
        await this.processVendorCombinedPayout(vendor, vendorCabins);
      }

      // Update vendor's next auto payout date
      vendor.autoPayoutSettings.lastAutoPayout = new Date();
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + vendor.autoPayoutSettings.payoutFrequency);
      vendor.autoPayoutSettings.nextAutoPayout = nextDate;
      
      await vendor.save();

    } catch (error) {
      console.error(`Error processing auto payout for vendor ${vendor._id}:`, error);
    }
  }

  // Process auto payout for a specific cabin
  static async processCabinAutoPayout(vendor, cabin) {
    try {
      const commissionRate = vendor.commissionSettings.type === 'percentage' 
        ? vendor.commissionSettings.value / 100 
        : 0.2;

      // Calculate period for payout
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - vendor.autoPayoutSettings.payoutFrequency);

      // Get pending bookings for this cabin
      const pendingBookings = await Booking.find({
        cabinId: cabin._id,
        paymentStatus: 'completed',
        payoutStatus: 'pending',
        createdAt: { $gte: startDate, $lte: endDate }
      });

      if (pendingBookings.length === 0) {
        console.log(`No pending bookings for cabin ${cabin.name}`);
        return;
      }

      // Calculate amounts
      const totalRevenue = pendingBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
      const totalCommission = pendingBookings.reduce((sum, booking) => 
        sum + (booking.commission || booking.totalPrice * commissionRate), 0);
      const netAmount = totalRevenue - totalCommission;

      // Check minimum payout amount
      if (netAmount < vendor.autoPayoutSettings.minimumPayoutAmount) {
        console.log(`Net amount ${netAmount} below minimum ${vendor.autoPayoutSettings.minimumPayoutAmount} for cabin ${cabin.name}`);
        return;
      }

      // Create auto payout
      const payout = new VendorPayout({
        vendorId: vendor._id,
        cabinId: cabin._id,
        amount: totalRevenue,
        commission: totalCommission,
        netAmount,
        payoutType: 'auto',
        period: { startDate, endDate },
        bookings: pendingBookings.map(b => b._id),
        bankDetails: vendor.bankDetails,
        status: 'pending'
      });

      await payout.save();

      // Mark bookings as included in payout
      await Booking.updateMany(
        { _id: { $in: pendingBookings.map(b => b._id) } },
        { 
          payoutStatus: 'included',
          payoutId: payout._id
        }
      );
      await Transaction.updateMany(
        { bookingId: { $in: pendingBookings.map(b => b._id) } },
        { 
          payoutStatus: 'included',
          payoutId: payout._id
        }
      );

      console.log(`Created auto payout ${payout.payoutId} for cabin ${cabin.name} - Amount: ₹${netAmount}`);

    } catch (error) {
      console.error(`Error processing cabin auto payout for ${cabin.name}:`, error);
    }
  }

  // Process combined payout for all vendor cabins
  static async processVendorCombinedPayout(vendor, cabins) {
    try {
      const commissionRate = vendor.commissionSettings.type === 'percentage' 
        ? vendor.commissionSettings.value / 100 
        : 0.2;

      const cabinIds = cabins.map(cabin => cabin._id);

      // Calculate period for payout
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - vendor.autoPayoutSettings.payoutFrequency);

      // Get pending bookings for all cabins
      const pendingBookings = await Booking.find({
        cabinId: { $in: cabinIds },
        paymentStatus: 'completed',
        payoutStatus: 'pending',
        createdAt: { $gte: startDate, $lte: endDate }
      });

      if (pendingBookings.length === 0) {
        console.log(`No pending bookings for vendor ${vendor.businessName}`);
        return;
      }

      // Calculate amounts
      const totalRevenue = pendingBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
      const totalCommission = pendingBookings.reduce((sum, booking) => 
        sum + (booking.commission || booking.totalPrice * commissionRate), 0);
      const netAmount = totalRevenue - totalCommission;

      // Check minimum payout amount
      if (netAmount < vendor.autoPayoutSettings.minimumPayoutAmount) {
        console.log(`Net amount ${netAmount} below minimum ${vendor.autoPayoutSettings.minimumPayoutAmount} for vendor ${vendor.businessName}`);
        return;
      }

      // Create auto payout
      const payout = new VendorPayout({
        vendorId: vendor._id,
        amount: totalRevenue,
        commission: totalCommission,
        netAmount,
        payoutType: 'auto',
        period: { startDate, endDate },
        bookings: pendingBookings.map(b => b._id),
        bankDetails: vendor.bankDetails,
        status: 'pending'
      });

      await payout.save();

      // Mark bookings as included in payout
      await Booking.updateMany(
        { _id: { $in: pendingBookings.map(b => b._id) } },
        { 
          payoutStatus: 'included',
          payoutId: payout._id
        }
      );
      await Transaction.updateMany(
        { bookingId: { $in: pendingBookings.map(b => b._id) } },
        { 
          payoutStatus: 'included',
          payoutId: payout._id
        }
      );

      console.log(`Created combined auto payout ${payout.payoutId} for vendor ${vendor.businessName} - Amount: ₹${netAmount}`);

    } catch (error) {
      console.error(`Error processing combined auto payout for vendor ${vendor._id}:`, error);
    }
  }

  // Get next auto payout date for vendor
  static getNextAutoPayoutDate(vendor) {
    if (!vendor.autoPayoutSettings.enabled) return null;
    
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + vendor.autoPayoutSettings.payoutFrequency);
    return nextDate;
  }

  // Calculate manual request charges
  static calculateManualRequestCharges(vendor, amount) {
    if (!vendor.autoPayoutSettings.manualRequestCharges.enabled) {
      return 0;
    }

    const charges = vendor.autoPayoutSettings.manualRequestCharges;
    
    if (charges.chargeType === 'percentage') {
      return Math.round((amount * charges.chargeValue) / 100);
    } else {
      return charges.chargeValue;
    }
  }
}

module.exports = AutoPayoutService;
