const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');
const sendEmail = require('../utils/sendEmail');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, role, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('User already exists with this email', 400));
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: role || 'employee',
    phone
  });

  // Send welcome email
  try {
    await sendEmail({
      email: user.email,
      subject: 'Welcome to HRMS - Registration Successful',
      message: `Hi ${user.firstName},\n\nWelcome to our HRMS platform! Your account has been successfully created.\n\nYou can now access all employee features including:\n- View your profile and update information\n- Apply for new job positions\n- Track your applications\n- Participate in AI interviews\n\nThank you for joining us!\n\nBest regards,\nHRMS Team`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Welcome to HRMS!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${user.firstName} 👋</h2>
            <p style="color: #666; line-height: 1.6;">
              Your employee account has been successfully created!
            </p>
            <p style="color: #666; line-height: 1.6;">
              You can now access all employee features including:
            </p>
            <ul style="color: #666; line-height: 2;">
              <li>📋 View your profile and update information</li>
              <li>💼 Apply for new job positions</li>
              <li>📊 Track your applications</li>
              <li>🤖 Participate in AI interviews</li>
            </ul>
            <div style="margin: 30px 0; padding: 20px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
              <p style="margin: 0; color: #1976d2; font-weight: bold;">
                🎉 Your account is ready to use!
              </p>
            </div>
            <p style="color: #666; line-height: 1.6; margin-top: 30px;">
              Thank you for joining us! If you have any questions, please don't hesitate to contact our support team.
            </p>
            <p style="color: #666; line-height: 1.6; margin-top: 20px;">
              Best regards,<br>
              <strong>HRMS Team</strong>
            </p>
          </div>
        </div>
      `
    });
  } catch (err) {
    console.error('Email send error:', err);
  }

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new ErrorResponse('Your account has been deactivated', 403));
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  // Send sign-in notification email for employees
  if (user.role.toLowerCase() === 'employee') {
    try {
      await sendEmail({
        email: user.email,
        subject: 'HRMS - Successful Sign In',
        message: `Hi ${user.firstName},\n\nYou have successfully signed in to your HRMS employee account.\n\nIf this wasn't you, please contact our support team immediately.\n\nBest regards,\nHRMS Team`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Sign In Successful</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Hello ${user.firstName} 👋</h2>
              <p style="color: #666; line-height: 1.6;">
                You have successfully signed in to your HRMS employee account.
              </p>
              <div style="margin: 30px 0; padding: 20px; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #4caf50;">
                <p style="margin: 0; color: #2e7d32;">
                  <strong>✅ Login Time:</strong> ${new Date().toLocaleString()}
                </p>
              </div>
              <p style="color: #666; line-height: 1.6; margin-top: 20px;">
                If this wasn't you, please contact our support team immediately to secure your account.
              </p>
              <p style="color: #666; line-height: 1.6; margin-top: 20px;">
                Best regards,<br>
                <strong>HRMS Team</strong>
              </p>
            </div>
          </div>
        `
      });
    } catch (err) {
      console.error('Email send error:', err);
    }
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Logout user / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  console.log('=== UPDATE DETAILS REQUEST ===');
  console.log('req.file:', req.file);
  console.log('req.body:', req.body);
  console.log('Content-Type:', req.headers['content-type']);

  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    position: req.body.position,
    location: req.body.location
  };

  // If avatar file is uploaded via Cloudinary, store the secure URL
  if (req.file) {
    console.log('Avatar file uploaded:', req.file.path);
    fieldsToUpdate.avatar = req.file.path; // Cloudinary secure URL
  } else {
    console.log('No avatar file in request');
  }

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  console.log('Updated user avatar:', user.avatar);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Update user avatar
// @route   PUT /api/v1/auth/avatar
// @access  Private
exports.updateAvatar = asyncHandler(async (req, res, next) => {
  const { cloudinary } = require('../utils/cloudinary');

  // Using express-fileupload (already configured globally)
  const uploadedFile = req.files && (req.files.avatar || req.files.file || req.files.image);
  if (!uploadedFile) {
    return next(new ErrorResponse('No image file uploaded', 400));
  }

  // Basic validation
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowed.includes(uploadedFile.mimetype)) {
    return next(new ErrorResponse('Only image files are allowed (jpg, png, gif, webp)', 400));
  }
  const maxBytes = 2 * 1024 * 1024; // 2MB
  if (uploadedFile.size > maxBytes) {
    return next(new ErrorResponse('Image too large. Max 2MB', 400));
  }

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'SmartHR/Avatars',
        resource_type: 'image',
        type: 'upload',
        access_mode: 'public',
        overwrite: true,
        transformation: [{ width: 256, height: 256, crop: 'fill', gravity: 'auto' }]
      },
      (error, uploaded) => {
        if (error) return reject(error);
        return resolve(uploaded);
      }
    );
    stream.end(uploadedFile.data);
  });

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avatar: result.secure_url },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  // Get reset token
  const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  // Set reset token and expiry
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click on the following link to reset your password: \n\n${resetUrl}\n\nThis link will expire in 10 minutes.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request - HRMS',
      message,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>You are receiving this email because you (or someone else) has requested the reset of a password.</p>
          <p>Please click on the following button to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666;">${resetUrl}</p>
          <p><strong>This link will expire in 10 minutes.</strong></p>
          <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        </div>
      `
    });

    res.status(200).json({ 
      success: true, 
      data: 'Password reset email sent successfully' 
    });
  } catch (err) {
    console.error('Email send error:', err);
    
    // Don't fail the request if email fails - save token anyway for development
    // In production, you might want to fail here
    console.log('⚠️ Email service not configured. Reset token saved to database.');
    console.log('Reset URL:', resetUrl);
    
    // For development: return success with a note
    res.status(200).json({ 
      success: true, 
      data: 'Password reset requested. Email service is not configured.',
      // Remove this in production!
      devNote: process.env.NODE_ENV === 'development' ? `Reset token: ${resetToken}` : undefined
    });
  }
});

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:token
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Find user by reset token and check if token is still valid
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired reset token', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Google OAuth callback
// @route   GET /api/v1/auth/google/callback
// @access  Public
exports.googleCallback = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return next(new ErrorResponse('Authentication failed', 401));
  }

  // Get expectedRole from cookie
  const expectedRole = req.cookies.oauth_expected_role;

  // Check if this OAuth was initiated from employee login/register
  if (expectedRole && expectedRole.toLowerCase() === 'employee') {
    // If user is not an employee, deny access
    if (req.user.role.toLowerCase() !== 'employee') {
      // Clear the cookie
      res.clearCookie('oauth_expected_role');
      // Redirect to frontend with error message
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      const errorMessage = encodeURIComponent('You are not an Employee');
      const redirectURL = `${frontendURL}/?error=${errorMessage}`;
      return res.redirect(redirectURL);
    }
    // Clear the cookie after validation
    res.clearCookie('oauth_expected_role');
  }

  // Update last login
  req.user.lastLogin = Date.now();
  await req.user.save({ validateBeforeSave: false });

  // Send email notification based on whether this is a new user or existing user
  try {
    if (req.user.isNewUser) {
      // Send welcome email for new employee registration
      await sendEmail({
        email: req.user.email,
        subject: 'Welcome to HRMS - Registration Successful',
        message: `Hi ${req.user.firstName},\n\nWelcome to our HRMS platform! Your employee account has been successfully created with Google OAuth.\n\nYou can now access all employee features including:\n- View your profile and update information\n- Apply for new job positions\n- Track your applications\n- Participate in AI interviews\n\nThank you for joining us!\n\nBest regards,\nHRMS Team`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Welcome to HRMS!</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Hello ${req.user.firstName} 👋</h2>
              <p style="color: #666; line-height: 1.6;">
                Your employee account has been successfully created with <strong>Google OAuth</strong>!
              </p>
              <p style="color: #666; line-height: 1.6;">
                You can now access all employee features including:
              </p>
              <ul style="color: #666; line-height: 2;">
                <li>📋 View your profile and update information</li>
                <li>💼 Apply for new job positions</li>
                <li>📊 Track your applications</li>
                <li>🤖 Participate in AI interviews</li>
              </ul>
              <div style="margin: 30px 0; padding: 20px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
                <p style="margin: 0; color: #1976d2; font-weight: bold;">
                  🎉 Your account is ready to use!
                </p>
              </div>
              <p style="color: #666; line-height: 1.6; margin-top: 30px;">
                Thank you for joining us! If you have any questions, please don't hesitate to contact our support team.
              </p>
              <p style="color: #666; line-height: 1.6; margin-top: 20px;">
                Best regards,<br>
                <strong>HRMS Team</strong>
              </p>
            </div>
          </div>
        `
      });
    } else {
      // Send sign-in notification for existing employee
      await sendEmail({
        email: req.user.email,
        subject: 'HRMS - Successful Sign In',
        message: `Hi ${req.user.firstName},\n\nYou have successfully signed in to your HRMS employee account using Google OAuth.\n\nIf this wasn't you, please contact our support team immediately.\n\nBest regards,\nHRMS Team`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Sign In Successful</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Hello ${req.user.firstName} 👋</h2>
              <p style="color: #666; line-height: 1.6;">
                You have successfully signed in to your HRMS employee account using <strong>Google OAuth</strong>.
              </p>
              <div style="margin: 30px 0; padding: 20px; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #4caf50;">
                <p style="margin: 0; color: #2e7d32;">
                  <strong>✅ Login Time:</strong> ${new Date().toLocaleString()}
                </p>
              </div>
              <p style="color: #666; line-height: 1.6; margin-top: 20px;">
                If this wasn't you, please contact our support team immediately to secure your account.
              </p>
              <p style="color: #666; line-height: 1.6; margin-top: 20px;">
                Best regards,<br>
                <strong>HRMS Team</strong>
              </p>
            </div>
          </div>
        `
      });
    }
  } catch (err) {
    console.error('Email send error:', err);
  }

  sendTokenResponse(req.user, 200, res, true);
});

// @desc    LinkedIn OAuth callback
// @route   GET /api/v1/auth/linkedin/callback
// @access  Public
exports.linkedinCallback = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return next(new ErrorResponse('Authentication failed', 401));
  }

  // Get expectedRole from cookie
  const expectedRole = req.cookies.oauth_expected_role;

  // Check if this OAuth was initiated from employee login/register
  if (expectedRole && expectedRole.toLowerCase() === 'employee') {
    // If user is not an employee, deny access
    if (req.user.role.toLowerCase() !== 'employee') {
      // Clear the cookie
      res.clearCookie('oauth_expected_role');
      // Redirect to frontend with error message
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      const errorMessage = encodeURIComponent('You are not an Employee');
      const redirectURL = `${frontendURL}/?error=${errorMessage}`;
      return res.redirect(redirectURL);
    }
    // Clear the cookie after validation
    res.clearCookie('oauth_expected_role');
  }

  // Update last login
  req.user.lastLogin = Date.now();
  await req.user.save({ validateBeforeSave: false });

  // Send email notification based on whether this is a new user or existing user
  try {
    if (req.user.isNewUser) {
      // Send welcome email for new employee registration
      await sendEmail({
        email: req.user.email,
        subject: 'Welcome to HRMS - Registration Successful',
        message: `Hi ${req.user.firstName},\n\nWelcome to our HRMS platform! Your employee account has been successfully created with LinkedIn OAuth.\n\nYou can now access all employee features including:\n- View your profile and update information\n- Apply for new job positions\n- Track your applications\n- Participate in AI interviews\n\nThank you for joining us!\n\nBest regards,\nHRMS Team`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Welcome to HRMS!</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Hello ${req.user.firstName} 👋</h2>
              <p style="color: #666; line-height: 1.6;">
                Your employee account has been successfully created with <strong>LinkedIn OAuth</strong>!
              </p>
              <p style="color: #666; line-height: 1.6;">
                You can now access all employee features including:
              </p>
              <ul style="color: #666; line-height: 2;">
                <li>📋 View your profile and update information</li>
                <li>💼 Apply for new job positions</li>
                <li>📊 Track your applications</li>
                <li>🤖 Participate in AI interviews</li>
              </ul>
              <div style="margin: 30px 0; padding: 20px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
                <p style="margin: 0; color: #1976d2; font-weight: bold;">
                  🎉 Your account is ready to use!
                </p>
              </div>
              <p style="color: #666; line-height: 1.6; margin-top: 30px;">
                Thank you for joining us! If you have any questions, please don't hesitate to contact our support team.
              </p>
              <p style="color: #666; line-height: 1.6; margin-top: 20px;">
                Best regards,<br>
                <strong>HRMS Team</strong>
              </p>
            </div>
          </div>
        `
      });
    } else {
      // Send sign-in notification for existing employee
      await sendEmail({
        email: req.user.email,
        subject: 'HRMS - Successful Sign In',
        message: `Hi ${req.user.firstName},\n\nYou have successfully signed in to your HRMS employee account using LinkedIn OAuth.\n\nIf this wasn't you, please contact our support team immediately.\n\nBest regards,\nHRMS Team`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Sign In Successful</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Hello ${req.user.firstName} 👋</h2>
              <p style="color: #666; line-height: 1.6;">
                You have successfully signed in to your HRMS employee account using <strong>LinkedIn OAuth</strong>.
              </p>
              <div style="margin: 30px 0; padding: 20px; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #4caf50;">
                <p style="margin: 0; color: #2e7d32;">
                  <strong>✅ Login Time:</strong> ${new Date().toLocaleString()}
                </p>
              </div>
              <p style="color: #666; line-height: 1.6; margin-top: 20px;">
                If this wasn't you, please contact our support team immediately to secure your account.
              </p>
              <p style="color: #666; line-height: 1.6; margin-top: 20px;">
                Best regards,<br>
                <strong>HRMS Team</strong>
              </p>
            </div>
          </div>
        `
      });
    }
  } catch (err) {
    console.error('Email send error:', err);
  }

  sendTokenResponse(req.user, 200, res, true);
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res, isOAuth = false) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  // For OAuth, redirect to frontend with token
  if (isOAuth) {
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectURL = `${frontendURL}/auth/oauth-callback?token=${token}`;
    return res.redirect(redirectURL);
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
};
