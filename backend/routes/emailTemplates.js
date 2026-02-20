
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getEmailTemplates,
  getEmailTemplate,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate
} = require('../controllers/emailTemplates');

// Check if user is admin or hostel manager
const adminAccess = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'hostel_manager') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin or manager role required.'
    });
  }
  next();
};

// All routes require authentication and admin access
router.use(protect);
router.use(adminAccess);

router.route('/')
  .get(getEmailTemplates)
  .post(createEmailTemplate);

router.route('/:id')
  .get(getEmailTemplate)
  .put(updateEmailTemplate)
  .delete(deleteEmailTemplate);

module.exports = router;
