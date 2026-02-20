
const Hostel = require('../models/Hostel');

// @desc    Upload hostel logo
// @route   POST /api/hostels/:id/logo
// @access  Private/Hostel Manager/Admin
exports.uploadHostelLogo = async (req, res) => {
  try {
    // This would use a file upload service in a real application
    // For now, we'll simulate it by just updating the logoImage field
    const hostel = await Hostel.findById(req.params.id);
    
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }
    
    // In a real implementation, handle file upload here
    // For simulation:
    const logoUrl = req.body.logoUrl || 'https://example.com/default-logo.png';
    
    hostel.logoImage = logoUrl;
    await hostel.save();
    
    res.status(200).json({
      success: true,
      data: {
        url: logoUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
