
const EmailTemplate = require('../models/EmailTemplate');

// @desc    Get all email templates
// @route   GET /api/email-templates
// @access  Private (Admin only)
exports.getEmailTemplates = async (req, res) => {
  try {
    const { category, isActive } = req.query;
    
    let filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const templates = await EmailTemplate.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    console.error('Get email templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single email template
// @route   GET /api/email-templates/:id
// @access  Private (Admin only)
exports.getEmailTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Get email template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create email template
// @route   POST /api/email-templates
// @access  Private (Admin only)
exports.createEmailTemplate = async (req, res) => {
  try {
    const { name, subject, htmlContent, textContent, variables, category } = req.body;

    if (!name || !subject || !htmlContent) {
      return res.status(400).json({
        success: false,
        message: 'Name, subject, and HTML content are required'
      });
    }

    const template = await EmailTemplate.create({
      name,
      subject,
      htmlContent,
      textContent,
      variables: variables || [],
      category: category || 'notification',
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: template,
      message: 'Email template created successfully'
    });
  } catch (error) {
    console.error('Create email template error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Template name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update email template
// @route   PUT /api/email-templates/:id
// @access  Private (Admin only)
exports.updateEmailTemplate = async (req, res) => {
  try {
    const { name, subject, htmlContent, textContent, variables, category, isActive } = req.body;

    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    // Update fields
    if (name) template.name = name;
    if (subject) template.subject = subject;
    if (htmlContent) template.htmlContent = htmlContent;
    if (textContent !== undefined) template.textContent = textContent;
    if (variables) template.variables = variables;
    if (category) template.category = category;
    if (isActive !== undefined) template.isActive = isActive;

    await template.save();

    res.status(200).json({
      success: true,
      data: template,
      message: 'Email template updated successfully'
    });
  } catch (error) {
    console.error('Update email template error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Template name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete email template
// @route   DELETE /api/email-templates/:id
// @access  Private (Admin only)
exports.deleteEmailTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    await EmailTemplate.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Email template deleted successfully'
    });
  } catch (error) {
    console.error('Delete email template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
