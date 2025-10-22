const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['info', 'warn', 'error', 'debug'],
    required: true,
    default: 'info'
  },
  message: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['auth', 'application', 'job', 'resume', 'user', 'system', 'email', 'ai'],
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  endpoint: {
    type: String
  },
  method: {
    type: String
  },
  statusCode: {
    type: Number
  },
  responseTime: {
    type: Number
  },
  error: {
    message: String,
    stack: String
  }
}, {
  timestamps: true
});

// Index for efficient log queries
LogSchema.index({ level: 1, category: 1, createdAt: -1 });
LogSchema.index({ user: 1, createdAt: -1 });

// TTL index to automatically delete logs older than 90 days
LogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('Log', LogSchema);
