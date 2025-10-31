const multer = require('multer');
const ErrorResponse = require('../utils/errorResponse');

// Use memory storage so we can stream directly to Cloudinary
const storage = multer.memoryStorage();

const imageFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const mimeOk = allowed.test(file.mimetype.toLowerCase());
  const extOk = allowed.test((file.originalname || '').toLowerCase());
  if (mimeOk && extOk) {
    cb(null, true);
  } else {
    cb(new ErrorResponse('Only image files are allowed (jpg, png, gif, webp)', 400));
  }
};

const uploadImage = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: imageFileFilter
});

module.exports = uploadImage;



