const rateLimit = require('express-rate-limit');

// Environment-based rate limiting configuration
const getRateLimitConfig = (environment = process.env.NODE_ENV || 'development') => {
  const configs = {
    development: {
      // More lenient limits for development
      auth: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 attempts per 15 minutes
      api: { windowMs: 15 * 60 * 1000, max: 1000 }, // 1000 requests per 15 minutes
      upload: { windowMs: 15 * 60 * 1000, max: 50 }, // 50 uploads per 15 minutes
      search: { windowMs: 15 * 60 * 1000, max: 200 }, // 200 searches per 15 minutes
      admin: { windowMs: 15 * 60 * 1000, max: 500 } // 500 admin requests per 15 minutes
    },
    production: {
      // Stricter limits for production
      auth: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
      api: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
      upload: { windowMs: 15 * 60 * 1000, max: 10 }, // 10 uploads per 15 minutes
      search: { windowMs: 15 * 60 * 1000, max: 50 }, // 50 searches per 15 minutes
      admin: { windowMs: 15 * 60 * 1000, max: 100 } // 100 admin requests per 15 minutes
    },
    testing: {
      // Very lenient limits for testing
      auth: { windowMs: 15 * 60 * 1000, max: 1000 },
      api: { windowMs: 15 * 60 * 1000, max: 10000 },
      upload: { windowMs: 15 * 60 * 1000, max: 1000 },
      search: { windowMs: 15 * 60 * 1000, max: 1000 },
      admin: { windowMs: 15 * 60 * 1000, max: 1000 }
    }
  };

  return configs[environment] || configs.development;
};

// Create rate limiters with environment-specific configuration
const createRateLimiter = (type, customConfig = {}) => {
  const config = getRateLimitConfig();
  const baseConfig = config[type] || config.api;

  return rateLimit({
    windowMs: customConfig.windowMs || baseConfig.windowMs,
    max: customConfig.max || baseConfig.max,
    message: {
      error: 'Too many requests',
      message: `Rate limit exceeded. Please try again in ${Math.ceil(baseConfig.windowMs / 60000)} minutes.`,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(baseConfig.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${Math.ceil(baseConfig.windowMs / 60000)} minutes.`,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(baseConfig.windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    },
    keyGenerator: (req) => {
      // Use IP address and user ID if available for more granular rate limiting
      const userIdentifier = req.user?.id || req.ip;
      return `${req.ip}-${userIdentifier}`;
    },
    skip: (req) => {
      // Skip rate limiting for certain conditions
      if (process.env.NODE_ENV === 'testing') return true;
      if (req.path === '/api/health') return true;
      return false;
    }
  });
};

// Pre-configured rate limiters
const rateLimiters = {
  auth: createRateLimiter('auth'),
  api: createRateLimiter('api'),
  upload: createRateLimiter('upload'),
  search: createRateLimiter('search'),
  admin: createRateLimiter('admin'),

  // Custom limiters for specific endpoints
  login: createRateLimiter('auth', { max: 5, windowMs: 15 * 60 * 1000 }), // 5 login attempts per 15 minutes
  register: createRateLimiter('auth', { max: 3, windowMs: 60 * 60 * 1000 }), // 3 registrations per hour
  passwordReset: createRateLimiter('auth', { max: 3, windowMs: 60 * 60 * 1000 }), // 3 password resets per hour
  fileUpload: createRateLimiter('upload', { max: 10, windowMs: 15 * 60 * 1000 }), // 10 file uploads per 15 minutes
  searchQueries: createRateLimiter('search', { max: 30, windowMs: 5 * 60 * 1000 }), // 30 searches per 5 minutes
  adminActions: createRateLimiter('admin', { max: 50, windowMs: 15 * 60 * 1000 }) // 50 admin actions per 15 minutes
};

// Dynamic rate limiter creator
const createDynamicRateLimiter = (type, customConfig = {}) => {
  return createRateLimiter(type, customConfig);
};

// Rate limiting status endpoint
const getRateLimitStatus = (req, res) => {
  const config = getRateLimitConfig();
  res.json({
    success: true,
    data: {
      environment: process.env.NODE_ENV || 'development',
      limits: config,
      currentIP: req.ip,
      userAgent: req.get('User-Agent')
    }
  });
};

module.exports = {
  rateLimiters,
  createDynamicRateLimiter,
  getRateLimitConfig,
  getRateLimitStatus
};