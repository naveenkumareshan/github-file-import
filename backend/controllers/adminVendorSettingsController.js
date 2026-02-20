
const Vendor = require('../models/Vendor');

// Get all vendors with auto payout settings
const getVendorsWithPayoutSettings = async (req, res) => {
  try {
    const { search, status } = req.query;
    
    // Build filter query
    let filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { vendorId: { $regex: search, $options: 'i' } }
      ];
    }
    
    const vendors = await Vendor.find(filter)
      .select('vendorId businessName contactPerson email status autoPayoutSettings')
      .sort({ createdAt: -1 });
    
    const formattedVendors = vendors.map(vendor => ({
      _id: vendor._id,
      vendorId: vendor.vendorId,
      businessName: vendor.businessName,
      contactPerson: vendor.contactPerson,
      email: vendor.email,
      status: vendor.status,
      autoPayoutSettings: vendor.autoPayoutSettings
    }));
    
    res.json({ success: true, data: formattedVendors });
  } catch (error) {
    console.error('Error fetching vendors with payout settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch vendors' });
  }
};

// Update vendor auto payout settings
const updateVendorAutoPayoutSettings = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const settings = req.body;
    
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }
    
    vendor.autoPayoutSettings = {
      ...vendor.autoPayoutSettings,
      ...settings
    };
    
    // Update next auto payout date if frequency changed
    if (settings.enabled && settings.payoutFrequency) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + settings.payoutFrequency);
      vendor.autoPayoutSettings.nextAutoPayout = nextDate;
    }
    
    await vendor.save();
    
    res.json({ success: true, data: vendor.autoPayoutSettings });
  } catch (error) {
    console.error('Error updating vendor auto payout settings:', error);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
};

// Get vendor auto payout settings
const getVendorAutoPayoutSettings = async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const vendor = await Vendor.findById(vendorId).select('autoPayoutSettings');
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }
    
    res.json({ success: true, data: vendor.autoPayoutSettings });
  } catch (error) {
    console.error('Error fetching vendor auto payout settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
};

// Enable/disable auto payout for vendor
const toggleVendorAutoPayout = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { enabled } = req.body;
    
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }
    
    vendor.autoPayoutSettings.enabled = enabled;
    
    if (enabled) {
      // Set next auto payout date
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + vendor.autoPayoutSettings.payoutFrequency);
      vendor.autoPayoutSettings.nextAutoPayout = nextDate;
    } else {
      vendor.autoPayoutSettings.nextAutoPayout = undefined;
    }
    
    await vendor.save();
    
    res.json({ success: true, data: vendor.autoPayoutSettings });
  } catch (error) {
    console.error('Error toggling vendor auto payout:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle auto payout' });
  }
};

// Get auto payout statistics
const getAutoPayoutStats = async (req, res) => {
  try {
    const totalVendors = await Vendor.countDocuments();
    const enabledVendors = await Vendor.countDocuments({ 'autoPayoutSettings.enabled': true });
    const disabledVendors = totalVendors - enabledVendors;
    
    const stats = {
      totalVendors,
      enabledVendors,
      disabledVendors,
      enabledPercentage: totalVendors > 0 ? ((enabledVendors / totalVendors) * 100).toFixed(1) : 0
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching auto payout stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
};

module.exports = {
  getVendorsWithPayoutSettings,
  updateVendorAutoPayoutSettings,
  getVendorAutoPayoutSettings,
  toggleVendorAutoPayout,
  getAutoPayoutStats
};
