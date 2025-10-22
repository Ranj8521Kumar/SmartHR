const multer = require('multer');
const path = require('path');
const ErrorResponse = require('./errorResponse');

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/resumes'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new ErrorResponse('Only PDF and Word documents are allowed', 400));
  }
};

// Initialize upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE || 5242880 // 5MB default
  },
  fileFilter: fileFilter
});

module.exports = upload;
