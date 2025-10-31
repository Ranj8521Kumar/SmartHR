const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const fileupload = require('express-fileupload');
const session = require('express-session');

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const loggerMiddleware = require('./middleware/logger');
const logger = require('./utils/logger');

// Load env vars FIRST before importing passport
dotenv.config();

// Import passport AFTER env vars are loaded
const passport = require('./config/passport');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});

// Connect to database
connectDB();

// Initialize AI model
const { initAIModel } = require('./services/aiService');
initAIModel().catch(console.error);

const app = express();

// Body parser with increased limits for large payloads (recordings, base64, etc.)
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// Cookie parser
app.use(cookieParser());

// Sessions (needed for OAuth providers that require state like LinkedIn)
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_session_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // set true when behind HTTPS/proxy
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Initialize Passport (required for OAuth routes)
app.use(passport.initialize());
app.use(passport.session());

// File upload with size limit
app.use(fileupload({
  createParentPath: true,
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB
}));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Sanitize data
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Enable CORS
const allowedOrigins = [
  'http://localhost:5000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://0.0.0.0:5173',
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In development, allow localhost origins more permissively
    if (process.env.NODE_ENV === 'development') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('0.0.0.0')) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // 10 minutes
}));

// Set security headers
app.use(helmet());

// Compress responses
app.use(compression());

// Custom logger middleware
app.use(loggerMiddleware);

// Session configuration (required for OAuth with state)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/jobs', require('./routes/jobRoutes'));
app.use('/api/v1/applications', require('./routes/applicationRoutes'));
app.use('/api/v1/resumes', require('./routes/resumeRoutes'));
app.use('/api/v1/analytics', require('./routes/analyticsRoutes'));
app.use('/api/v1/transcriptions', require('./routes/transcriptionRoutes'));
app.use('/api/v1/interview-recordings', require('./routes/interviewRecordingRoutes'));
app.use('/api/v1/tts', require('./routes/ttsRoutes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HRMS Backend is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API documentation endpoint
app.get('/api/v1', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HRMS API v1.0',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      jobs: '/api/v1/jobs',
      applications: '/api/v1/applications',
      resumes: '/api/v1/resumes',
      analytics: '/api/v1/analytics',
      interviewRecordings: '/api/v1/interview-recordings',
      tts: '/api/v1/tts'
    },
    documentation: 'See README.md for detailed API documentation'
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Increase timeout for large video uploads (10 minutes)
server.timeout = 600000; // 10 minutes
server.keepAliveTimeout = 610000; // Slightly higher than timeout
server.headersTimeout = 620000; // Slightly higher than keepAliveTimeout

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, _promise) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

module.exports = app;
