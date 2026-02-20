
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directories exist
const createDirectoryIfNotExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Base upload directory
const UPLOAD_DIR = path.join(__dirname, '../uploads');
// Cabin specific upload directory
const CABIN_UPLOAD_DIR = path.join(UPLOAD_DIR, 'cabins');
// Document specific upload directory
const DOCUMENT_UPLOAD_DIR = path.join(UPLOAD_DIR, 'documents');

// Ensure directories exist
createDirectoryIfNotExists(UPLOAD_DIR);
createDirectoryIfNotExists(CABIN_UPLOAD_DIR);
createDirectoryIfNotExists(DOCUMENT_UPLOAD_DIR);

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

// @desc    Upload a single image
// @route   POST /api/uploads/image
// @access  Private (protected by auth middleware)
exports.uploadImage = async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const file = req.files.image;

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a valid file (JPG, PNG, GIF, WebP, PDF, DOC, DOCX)'
      });
    }

    // Check file size (limit to 10MB for documents, 5MB for images)
    const maxSize = ALLOWED_DOCUMENT_TYPES.includes(file.mimetype) ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File size should be less than 5MB'
      });
    }

    // Create a unique filename
    const fileExtension = path.extname(file.name);
    const filename = `${uuidv4()}${fileExtension}`;


    // Choose upload directory based on file type
    const uploadDir = ALLOWED_DOCUMENT_TYPES.includes(file.mimetype) ? DOCUMENT_UPLOAD_DIR : UPLOAD_DIR;
    const filePath = path.join(uploadDir, filename);

    await file.mv(filePath);
    const urlPath = ALLOWED_DOCUMENT_TYPES.includes(file.mimetype) ? `/uploads/documents/${filename}` : `/uploads/${filename}`;
    // Return the file URL
    res.status(200).json({
      success: true,
      data: {
        url: urlPath
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Upload multiple images/documents
// @route   POST /api/uploads/images
// @access  Private (protected by auth middleware)
exports.uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || !req.files.images) {
      return res.status(400).json({
        success: false,
        message: 'Please upload files'
      });
    }

    // Convert to array if single file
    const files = Array.isArray(req.files.images)
      ? req.files.images
      : [req.files.images];

    const uploadedFiles = [];

    // Process each file
    for (const file of files) {
      // Check file type
      if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
        continue;
      }

      // Check file size
      const maxSize = ALLOWED_DOCUMENT_TYPES.includes(file.mimetype) ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        continue;
      }

      // Create a unique filename
      const fileExtension = path.extname(file.name);
      const filename = `${uuidv4()}${fileExtension}`;

      // Choose upload directory based on file type
      const uploadDir = ALLOWED_DOCUMENT_TYPES.includes(file.mimetype) ? DOCUMENT_UPLOAD_DIR : UPLOAD_DIR;
      const filePath = path.join(uploadDir, filename);

      await file.mv(filePath);

      // Add to uploaded files list
      const urlPath = ALLOWED_DOCUMENT_TYPES.includes(file.mimetype) ? `/uploads/documents/${filename}` : `/uploads/${filename}`;
      uploadedFiles.push(urlPath);
    }

    res.status(200).json({
      success: true,
      data: {
        urls: uploadedFiles
      }
    });
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete an image
// @route   DELETE /api/uploads/image/:filename
// @access  Private (protected by auth middleware)
exports.deleteImage = async (req, res) => {
  try {
    const filename = req.params.filename;

    // Check in both directories
    const regularPath = path.join(UPLOAD_DIR, filename);
    const documentPath = path.join(DOCUMENT_UPLOAD_DIR, filename);

    let filePath = null;

    if (fs.existsSync(regularPath)) {
      filePath = regularPath;
    } else if (fs.existsSync(documentPath)) {
      filePath = documentPath;
    }

    if (filePath) {
      // Delete the file
      fs.unlinkSync(filePath);

      res.status(200).json({
        success: true,
        data: {}
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
