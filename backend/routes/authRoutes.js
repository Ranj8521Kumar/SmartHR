const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  googleCallback,
  linkedinCallback,
  updateAvatar
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const passport = require('../config/passport');
const avatarUpload = require('../utils/avatarUpload');

const router = express.Router();

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error('Multer error:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error'
    });
  }
  next();
};

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, (req, res, next) => {
  console.log('=== AVATAR UPLOAD MIDDLEWARE ===');
  console.log('Content-Type:', req.headers['content-type']);

  avatarUpload.single('avatar')(req, res, (err) => {
    if (err) {
      // If there's an error but it's just no file, continue anyway
      console.log('Avatar upload error (continuing):', err.message);
      console.error('Full error:', err);
    }
    console.log('After multer - req.file:', req.file);
    next();
  });
}, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.put('/avatar', protect, updateAvatar);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:token', resetPassword);

// Google OAuth routes
router.get('/google', (req, res, next) => {
  // Store expected role in cookie before OAuth
  if (req.query.expectedRole) {
    res.cookie('oauth_expected_role', req.query.expectedRole, {
      httpOnly: true,
      maxAge: 10 * 60 * 1000, // 10 minutes
      secure: process.env.NODE_ENV === 'production'
    });
  }
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })(req, res, next);
});
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/?error=oauth_failed` : 'http://localhost:5173/?error=oauth_failed',
    session: false 
  }),
  googleCallback
);

// LinkedIn OAuth routes
router.get('/linkedin', (req, res, next) => {
  // Store expected role in cookie before OAuth
  if (req.query.expectedRole) {
    res.cookie('oauth_expected_role', req.query.expectedRole, {
      httpOnly: true,
      maxAge: 10 * 60 * 1000, // 10 minutes
      secure: process.env.NODE_ENV === 'production'
    });
  }
  passport.authenticate('linkedin', { 
    scope: ['openid', 'profile', 'email'],
    session: false 
  })(req, res, next);
});
router.get('/linkedin/callback',
  passport.authenticate('linkedin', { 
    failureRedirect: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/?error=oauth_failed` : 'http://localhost:5173/?error=oauth_failed',
    session: false 
  }),
  linkedinCallback
);

module.exports = router;
