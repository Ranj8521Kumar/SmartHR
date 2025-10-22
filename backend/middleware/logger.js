const Log = require('../models/Log');

const logger = async (req, res, next) => {
  // Store original methods
  const originalSend = res.send;
  const originalJson = res.json;
  const startTime = Date.now();

  // Override send method
  res.send = function(data) {
    res.body = data;
    return originalSend.call(this, data);
  };

  // Override json method
  res.json = function(data) {
    res.body = data;
    return originalJson.call(this, data);
  };

  // Log after response is sent
  res.on('finish', async () => {
    try {
      const responseTime = Date.now() - startTime;
      
      // Determine log level
      let level = 'info';
      if (res.statusCode >= 400 && res.statusCode < 500) {
        level = 'warn';
      } else if (res.statusCode >= 500) {
        level = 'error';
      }

      // Determine category based on endpoint
      let category = 'system';
      if (req.path.includes('/auth')) category = 'auth';
      else if (req.path.includes('/applications')) category = 'application';
      else if (req.path.includes('/jobs')) category = 'job';
      else if (req.path.includes('/resumes')) category = 'resume';
      else if (req.path.includes('/users')) category = 'user';

      const logData = {
        level,
        message: `${req.method} ${req.path} - ${res.statusCode}`,
        category,
        user: req.user ? req.user._id : null,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime
      };

      await Log.create(logData);
    } catch (error) {
      console.error('Logging error:', error);
    }
  });

  next();
};

module.exports = logger;
