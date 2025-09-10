const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const { parsePermissions } = require('../lib/permissions');

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'forward_africa_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map();

// Helper function to validate and sanitize parameters
const sanitizeParam = (param) => {
  if (param === undefined || param === null) {
    return null;
  }
  if (typeof param === 'string' && param.trim() === '') {
    return null;
  }
  return param;
};

// Helper function to validate user ID
const validateUserId = (userId) => {
  if (!userId || userId === undefined || userId === null) {
    return false;
  }
  // Ensure userId is a number or can be converted to one
  const numUserId = parseInt(userId);
  return !isNaN(numUserId) && numUserId > 0;
};

// Enhanced token verification middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('🔍 Token Authentication Debug:', {
      hasAuthHeader: !!authHeader,
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    });

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if token is expired
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      console.log('❌ Token expired');
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Validate userId from token
    if (!validateUserId(decoded.userId)) {
      console.log('❌ Invalid userId in token:', decoded.userId);
      return res.status(401).json({
        error: 'Invalid token payload',
        code: 'TOKEN_INVALID'
      });
    }

    // Verify user still exists and is active
    try {
      const sanitizedUserId = sanitizeParam(decoded.userId);

      if (!sanitizedUserId) {
        console.log('❌ Sanitized userId is null/undefined');
        return res.status(401).json({
          error: 'Invalid token payload',
          code: 'TOKEN_INVALID'
        });
      }

      const [users] = await pool.execute(
        'SELECT id, email, full_name, role, permissions, is_active, last_login FROM users WHERE id = ? AND is_active = 1',
        [sanitizedUserId]
      );

      if (users.length === 0) {
        console.log('❌ User not found or inactive');
        return res.status(401).json({
          error: 'User account not found or inactive',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = users[0];

      // Check if user has been banned or suspended
      if (!user.is_active) {
        console.log('❌ User account is inactive');
        return res.status(403).json({
          error: 'Account is suspended',
          code: 'ACCOUNT_SUSPENDED'
        });
      }

      // Add user info to request
      req.user = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        permissions: parsePermissions(user.permissions),
        last_login: user.last_login
      };

      console.log('✅ Token verified, user:', req.user.email);
      next();
    } catch (dbError) {
      console.error('❌ Database error during token verification:', dbError);
      return res.status(500).json({
        error: 'Authentication service unavailable',
        code: 'AUTH_SERVICE_ERROR'
      });
    }
  } catch (jwtError) {
    console.log('❌ Token verification failed:', jwtError.message);

    if (jwtError.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    } else if (jwtError.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

// Role-based authorization middleware
const authorizeRole = (roles) => {
  return (req, res, next) => {
    console.log('🔍 Role Authorization Debug:', {
      user: req.user?.email,
      userRole: req.user?.role,
      requiredRoles: roles,
      hasRole: req.user ? roles.includes(req.user.role) : false
    });

    if (!req.user) {
      console.log('❌ No user found in request');
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      console.log('❌ User role not authorized:', req.user.role, 'Required:', roles);
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    console.log('✅ Role authorization passed');
    next();
  };
};

// Permission-based authorization middleware
const authorizePermission = (permissions) => {
  return (req, res, next) => {
    console.log('🔍 Permission Authorization Debug:', {
      user: req.user?.email,
      userPermissions: req.user?.permissions,
      requiredPermissions: permissions
    });

    if (!req.user) {
      console.log('❌ No user found in request');
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userPermissions = req.user.permissions || [];
    const hasAllPermissions = permissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      console.log('❌ User lacks required permissions:', permissions);
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredPermissions: permissions,
        userPermissions: userPermissions
      });
    }

    console.log('✅ Permission authorization passed');
    next();
  };
};

// Rate limiting middleware
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    } else {
      const record = rateLimitStore.get(key);

      if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
      } else {
        record.count++;
      }

      if (record.count > maxRequests) {
        console.log('❌ Rate limit exceeded for IP:', key);
        return res.status(429).json({
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        });
      }
    }

    next();
  };
};

// Generate JWT token
const generateToken = (userId, role) => {
  // Validate inputs
  if (!validateUserId(userId)) {
    throw new Error('Invalid userId for token generation');
  }

  if (!role || typeof role !== 'string') {
    throw new Error('Invalid role for token generation');
  }

  return jwt.sign(
    {
      userId: parseInt(userId),
      role,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  // Validate inputs
  if (!validateUserId(userId)) {
    throw new Error('Invalid userId for refresh token generation');
  }

  return jwt.sign(
    {
      userId: parseInt(userId),
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
};

// Verify refresh token
const verifyRefreshToken = (refreshToken) => {
  try {
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new Error('Invalid refresh token format');
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Validate userId from decoded token
    if (!validateUserId(decoded.userId)) {
      throw new Error('Invalid userId in refresh token');
    }

    return decoded;
  } catch (error) {
    throw error;
  }
};

// Hash password
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Update user's last login
const updateLastLogin = async (userId) => {
  try {
    const sanitizedUserId = sanitizeParam(userId);
    if (!sanitizedUserId) {
      console.error('Invalid userId for last login update:', userId);
      return;
    }

    await pool.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [sanitizedUserId]
    );
  } catch (error) {
    console.error('Error updating last login:', error);
  }
};

// Audit log middleware
const auditLog = (action) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function(data) {
      // Log the action after response is sent
      setTimeout(async () => {
        try {
          const userId = req.user?.id ? sanitizeParam(req.user.id) : null;
          const ipAddress = sanitizeParam(req.ip || req.connection.remoteAddress);
          const userAgent = sanitizeParam(req.headers['user-agent']);

          await pool.execute(
            'INSERT INTO audit_logs (user_id, action, ip_address, user_agent, status_code, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [userId, action, ipAddress, userAgent, res.statusCode]
          );
        } catch (error) {
          console.error('Error logging audit:', error);
        }
      }, 0);

      originalSend.call(this, data);
    };

    next();
  };
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Strict transport security (HTTPS only)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Content security policy
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https: http://localhost:3002; connect-src 'self' http://localhost:3002 https:; font-src 'self' https:;");

  next();
};

module.exports = {
  authenticateToken,
  authorizeRole,
  authorizePermission,
  rateLimit,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
  updateLastLogin,
  auditLog,
  securityHeaders,
  sanitizeParam,
  validateUserId
};