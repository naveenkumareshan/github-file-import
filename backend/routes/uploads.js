
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadImage, uploadMultipleImages, deleteImage } = require('../controllers/uploadsController');

// All routes require authentication
router.use(protect);

// Upload routes
router.post('/image', uploadImage);
router.post('/images', uploadMultipleImages);
router.delete('/image/:filename', deleteImage);

module.exports = router;
