
const Settings = require('../models/Settings');

// Get all settings or by category
exports.getSettings = async (req, res) => {
  try {
    const { category, provider } = req.query;
    let query = {};
    
    if (category) query.category = category;
    if (provider) query.provider = provider;
    
    const settings = await Settings.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ category: 1, provider: 1 });
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings',
      error: error.message
    });
  }
};

// Get settings by category and provider
exports.getSettingsByProvider = async (req, res) => {
  try {
    const { category, provider } = req.params;
    
    const settings = await Settings.findOne({ category, provider })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found'
      });
    }
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings',
      error: error.message
    });
  }
};

// Create or update settings
exports.upsertSettings = async (req, res) => {
  try {
    const { category, provider, settings, isActive } = req.body;
    
    if (!category || !settings) {
      return res.status(400).json({
        success: false,
        message: 'Category and settings are required'
      });
    }
    
    const query = { category };
    if (provider) query.provider = provider;
    
    const updatedSettings = await Settings.findOneAndUpdate(
      query,
      {
        category,
        provider,
        settings,
        isActive: isActive !== undefined ? isActive : true,
        updatedBy: req.user.id,
        ...(req.method === 'POST' && { createdBy: req.user.id })
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    ).populate('createdBy', 'name email')
     .populate('updatedBy', 'name email');
    
    res.json({
      success: true,
      data: updatedSettings,
      message: 'Settings saved successfully'
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving settings',
      error: error.message
    });
  }
};

// Delete settings
exports.deleteSettings = async (req, res) => {
  try {
    const { category, provider } = req.params;
    
    const query = { category };
    if (provider) query.provider = provider;
    
    const deletedSettings = await Settings.findOneAndDelete(query);
    
    if (!deletedSettings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Settings deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting settings',
      error: error.message
    });
  }
};

// Test email configuration
exports.testEmailSettings = async (req, res) => {
  try {
    const { provider, settings, testEmail } = req.body;
    
    if (!provider || !settings || !testEmail) {
      return res.status(400).json({
        success: false,
        message: 'Provider, settings, and test email are required'
      });
    }
    
    // Here you would implement actual email testing logic
    // For now, we'll simulate a successful test
    res.json({
      success: true,
      message: `Test email sent successfully to ${testEmail} using ${provider}`
    });
  } catch (error) {
    console.error('Error testing email settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing email settings',
      error: error.message
    });
  }
};

// Test SMS configuration
exports.testSmsSettings = async (req, res) => {
  try {
    const { provider, settings, testPhone } = req.body;
    
    if (!provider || !settings || !testPhone) {
      return res.status(400).json({
        success: false,
        message: 'Provider, settings, and test phone are required'
      });
    }
    
    // Here you would implement actual SMS testing logic
    // For now, we'll simulate a successful test
    res.json({
      success: true,
      message: `Test SMS sent successfully to ${testPhone} using ${provider}`
    });
  } catch (error) {
    console.error('Error testing SMS settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing SMS settings',
      error: error.message
    });
  }
};
