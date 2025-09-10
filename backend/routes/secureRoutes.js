const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const {
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
  securityHeaders
} = require('../middleware/auth');
const { parsePermissions } = require('../lib/permissions');

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

const pool = mysql.createPool(dbConfig);

// Apply security headers to all routes
router.use(securityHeaders);

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

// Login endpoint with rate limiting
router.post('/auth/login',
  rateLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  auditLog('LOGIN_ATTEMPT'),
  async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required',
          code: 'MISSING_CREDENTIALS'
        });
      }

      // Get user from database
      const [users] = await pool.execute(
        'SELECT id, email, full_name, password, role, permissions, is_active, failed_login_attempts, last_failed_login FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      const user = users[0];

      // Validate user data
      if (!user.id || !user.role) {
        console.error('❌ Invalid user data from database:', user);
        return res.status(500).json({
          error: 'Invalid user data',
          code: 'INTERNAL_ERROR'
        });
      }

      // Check if account is active
      if (!user.is_active) {
        return res.status(403).json({
          error: 'Account is suspended',
          code: 'ACCOUNT_SUSPENDED'
        });
      }

      // Check for too many failed login attempts
      if (user.failed_login_attempts >= 5) {
        const lockoutTime = 15 * 60 * 1000; // 15 minutes
        const timeSinceLastFailed = Date.now() - new Date(user.last_failed_login).getTime();

        if (timeSinceLastFailed < lockoutTime) {
          return res.status(429).json({
            error: 'Account temporarily locked due to too many failed attempts',
            code: 'ACCOUNT_LOCKED',
            retryAfter: Math.ceil((lockoutTime - timeSinceLastFailed) / 1000)
          });
        } else {
          // Reset failed attempts after lockout period
          await pool.execute(
            'UPDATE users SET failed_login_attempts = 0 WHERE id = ?',
            [user.id]
          );
        }
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.password);

      if (!isValidPassword) {
        // Increment failed login attempts
        await pool.execute(
          'UPDATE users SET failed_login_attempts = failed_login_attempts + 1, last_failed_login = NOW() WHERE id = ?',
          [user.id]
        );

        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Reset failed login attempts on successful login
      await pool.execute(
        'UPDATE users SET failed_login_attempts = 0, last_login = NOW() WHERE id = ?',
        [user.id]
      );

      // Generate tokens with validation
      try {
        const accessToken = generateToken(user.id, user.role);
        const refreshToken = generateRefreshToken(user.id);

        // Store refresh token in database
        await pool.execute(
          'UPDATE users SET refresh_token = ? WHERE id = ?',
          [refreshToken, user.id]
        );



        // Return user data (without password)
        const userData = {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          permissions: parsePermissions(user.permissions)
        };

        res.json({
          message: 'Login successful',
          token: accessToken,
          refreshToken: refreshToken,
          user: userData
        });
      } catch (tokenError) {
        console.error('❌ Token generation error:', tokenError);
        return res.status(500).json({
          error: 'Token generation failed',
          code: 'TOKEN_GENERATION_ERROR'
        });
      }

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// Token refresh endpoint
router.post('/auth/refresh',
  rateLimit(10, 15 * 60 * 1000), // 10 attempts per 15 minutes
  async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          error: 'Refresh token is required',
          code: 'MISSING_REFRESH_TOKEN'
        });
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Validate userId from decoded token
      if (!decoded.userId) {
        console.error('❌ Invalid userId in refresh token:', decoded);
        return res.status(401).json({
          error: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      // Check if refresh token exists in database
      const [users] = await pool.execute(
        'SELECT id, email, full_name, role, permissions, refresh_token FROM users WHERE id = ? AND refresh_token = ?',
        [decoded.userId, refreshToken]
      );

      if (users.length === 0) {
        return res.status(401).json({
          error: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      const user = users[0];

      // Validate user data
      if (!user.id || !user.role) {
        console.error('❌ Invalid user data from database:', user);
        return res.status(500).json({
          error: 'Invalid user data',
          code: 'INTERNAL_ERROR'
        });
      }

      // Generate new tokens
      const newAccessToken = generateToken(user.id, user.role);
      const newRefreshToken = generateRefreshToken(user.id);

      // Update refresh token in database
      await pool.execute(
        'UPDATE users SET refresh_token = ? WHERE id = ?',
        [newRefreshToken, user.id]
      );

      // Return new tokens
      res.json({
        message: 'Token refreshed successfully',
        token: newAccessToken,
        refreshToken: newRefreshToken
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
  }
);

// Logout endpoint
router.post('/auth/logout',
  authenticateToken,
  auditLog('LOGOUT'),
  async (req, res) => {
    try {
      // Clear refresh token from database
      await pool.execute(
        'UPDATE users SET refresh_token = NULL WHERE id = ?',
        [req.user.id]
      );

      res.json({
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// Verify token endpoint (for server-side verification)
router.post('/auth/verify',
  async (req, res) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          error: 'Access token required',
          code: 'TOKEN_MISSING'
        });
      }

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Check if token is expired
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        return res.status(401).json({
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }

      // Verify user still exists and is active
      const [users] = await pool.execute(
        'SELECT id, email, full_name, role, permissions, is_active FROM users WHERE id = ? AND is_active = 1',
        [decoded.userId]
      );

      if (users.length === 0) {
        return res.status(401).json({
          error: 'User account not found or inactive',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = users[0];

      res.json({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        permissions: parsePermissions(user.permissions),
        is_active: user.is_active
      });

    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }
  }
);

// Get current user profile
router.get('/auth/me',
  authenticateToken,
  async (req, res) => {
    try {
      const [users] = await pool.execute(
        'SELECT id, email, full_name, role, permissions, avatar_url, onboarding_completed, industry, experience_level, business_stage, country, state_province, city, created_at, last_login FROM users WHERE id = ?',
        [req.user.id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = users[0];

      res.json({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        permissions: parsePermissions(user.permissions),
        avatar_url: user.avatar_url,
        onboarding_completed: user.onboarding_completed,
        industry: user.industry,
        experience_level: user.experience_level,
        business_stage: user.business_stage,
        country: user.country,
        state_province: user.state_province,
        city: user.city,
        created_at: user.created_at,
        last_login: user.last_login
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// ============================================================================
// SYSTEM CONFIGURATION ROUTES (Super Admin Only)
// ============================================================================

// Get system configuration
router.get('/system/config',
  authenticateToken,
  authorizeRole(['super_admin']),
  auditLog('GET_SYSTEM_CONFIG'),
  async (req, res) => {
    try {
      // In a real application, you might store this in a database
      const config = {
        siteName: 'Forward Africa',
        siteDescription: 'Empowering African professionals through expert-led courses',
        maintenanceMode: false,
        debugMode: false,
        maxUploadSize: 50,
        sessionTimeout: 30,
        emailNotifications: true,
        autoBackup: true,
        backupFrequency: 'daily',
        securityLevel: 'high',
        rateLimiting: true,
        maxRequestsPerMinute: 100,
        databaseConnectionPool: 10,
        cacheEnabled: true,
        cacheTTL: 3600,
        cdnEnabled: false,
        sslEnabled: true,
        corsEnabled: true,
        allowedOrigins: ['https://forwardafrica.com', 'https://www.forwardafrica.com']
      };

      res.json(config);
    } catch (error) {
      console.error('Get system config error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// Update system configuration
router.put('/system/config',
  authenticateToken,
  authorizeRole(['super_admin']),
  auditLog('UPDATE_SYSTEM_CONFIG'),
  async (req, res) => {
    try {
      const config = req.body;

      // Validate configuration
      if (!config.siteName || !config.siteDescription) {
        return res.status(400).json({
          error: 'Site name and description are required',
          code: 'INVALID_CONFIG'
        });
      }

      // In a real application, you would save this to a database
      console.log('System configuration updated:', config);

      res.json({
        message: 'System configuration updated successfully',
        config: config
      });
    } catch (error) {
      console.error('Update system config error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// Get system status
router.get('/system/status',
  authenticateToken,
  authorizeRole(['super_admin']),
  auditLog('GET_SYSTEM_STATUS'),
  async (req, res) => {
    try {
      // Get database status
      const [dbStatus] = await pool.execute('SELECT 1 as status');

      // Get user count
      const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');

      // Get course count
      const [courseCount] = await pool.execute('SELECT COUNT(*) as count FROM courses');

      const status = {
        database: {
          status: dbStatus.length > 0 ? 'operational' : 'error',
          size: '2.5 GB',
          connectionPool: '10/10'
        },
        systemResources: {
          cpuUsage: Math.floor(Math.random() * 30) + 10, // 10-40%
          memoryUsage: Math.floor(Math.random() * 20) + 20, // 20-40%
          diskUsage: Math.floor(Math.random() * 15) + 25, // 25-40%
          responseTime: Math.floor(Math.random() * 50) + 50, // 50-100ms
          uptime: 99.9,
          activeUsers: Math.floor(Math.random() * 50) + 10, // 10-60
          errorRate: 0.1
        },
        lastBackup: new Date().toISOString(),
        backupSize: '1.2 GB',
        userCount: userCount[0]?.count || 0,
        courseCount: courseCount[0]?.count || 0
      };

      res.json(status);
    } catch (error) {
      console.error('Get system status error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// Create system backup
router.post('/system/backup',
  authenticateToken,
  authorizeRole(['super_admin']),
  auditLog('CREATE_SYSTEM_BACKUP'),
  async (req, res) => {
    try {
      // In a real application, you would implement actual backup logic
      console.log('Creating system backup...');

      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 2000));

      res.json({
        message: 'System backup created successfully',
        backupId: `backup-${Date.now()}`,
        size: '1.2 GB',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Create backup error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// ============================================================================
// USER MANAGEMENT ROUTES (Admin/Super Admin Only)
// ============================================================================

// Get all users
router.get('/users',
  authenticateToken,
  authorizeRole(['super_admin', 'community_manager']),
  rateLimit(100, 15 * 60 * 1000), // 100 requests per 15 minutes
  auditLog('GET_USERS'),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const search = req.query.search || '';

      let query = `
        SELECT id, email, full_name, role, is_active, created_at, last_login
        FROM users
        WHERE 1=1
      `;
      let params = [];

      if (search) {
        query += ` AND (email LIKE ? OR full_name LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const [users] = await pool.execute(query, params);

      // Get total count
      let countQuery = `SELECT COUNT(*) as total FROM users WHERE 1=1`;
      if (search) {
        countQuery += ` AND (email LIKE ? OR full_name LIKE ?)`;
      }
      const [countResult] = await pool.execute(countQuery, search ? [`%${search}%`, `%${search}%`] : []);
      const total = countResult[0].total;

      res.json({
        users: users,
        pagination: {
          page: page,
          limit: limit,
          total: total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// Update user
router.put('/users/:userId',
  authenticateToken,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { full_name, role, is_active, permissions, email, avatar_url, industry, experience_level, business_stage, country, state_province, city } = req.body;

      // Check if user exists
      const [users] = await pool.execute(
        'SELECT id, role FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = users[0];

      // Allow users to update their own profile, or admins to update any user
      const isOwnProfile = req.user.id === userId;
      const isAdmin = req.user.role === 'super_admin' || req.user.role === 'community_manager' || req.user.role === 'content_manager';

      if (!isOwnProfile && !isAdmin) {
        return res.status(403).json({
          error: 'You can only update your own profile',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // Regular users can only update certain fields

      // Build update fields based on permissions
      const updateFields = [];
      const updateValues = [];

      // Fields that any user can update on their own profile
      if (full_name !== undefined) {
        updateFields.push('full_name = ?');
        updateValues.push(full_name);
      }
      if (email !== undefined && (isOwnProfile || isAdmin)) {
        updateFields.push('email = ?');
        updateValues.push(email);
      }
      if (avatar_url !== undefined) {
        updateFields.push('avatar_url = ?');
        updateValues.push(avatar_url);
      }
      if (industry !== undefined) {
        updateFields.push('industry = ?');
        updateValues.push(industry);
      }
      if (experience_level !== undefined) {
        updateFields.push('experience_level = ?');
        updateValues.push(experience_level);
      }
      if (business_stage !== undefined) {
        updateFields.push('business_stage = ?');
        updateValues.push(business_stage);
      }
      if (country !== undefined) {
        updateFields.push('country = ?');
        updateValues.push(country);
      }
      if (state_province !== undefined) {
        updateFields.push('state_province = ?');
        updateValues.push(state_province);
      }
      if (city !== undefined) {
        updateFields.push('city = ?');
        updateValues.push(city);
      }

      // Admin-only fields
      if (isAdmin) {
        if (role !== undefined) {
          updateFields.push('role = ?');
          updateValues.push(role);
        }
        if (is_active !== undefined) {
          updateFields.push('is_active = ?');
          updateValues.push(is_active);
        }
        if (permissions !== undefined) {
          updateFields.push('permissions = ?');
          updateValues.push(JSON.stringify(permissions));
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update',
          code: 'NO_FIELDS_TO_UPDATE'
        });
      }

      // Add the WHERE clause parameter
      updateValues.push(userId);

      // Execute the update
      const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      await pool.execute(updateQuery, updateValues);

      // Return the updated user data
      const [updatedUsers] = await pool.execute(
        'SELECT id, email, full_name, avatar_url, role, onboarding_completed, industry, experience_level, business_stage, country, state_province, city, is_active, permissions FROM users WHERE id = ?',
        [userId]
      );

      if (updatedUsers.length === 0) {
        return res.status(404).json({
          error: 'User not found after update',
          code: 'USER_NOT_FOUND'
        });
      }

      const updatedUser = updatedUsers[0];

      // Parse permissions if it's a JSON string
      if (updatedUser.permissions && typeof updatedUser.permissions === 'string') {
        try {
          updatedUser.permissions = JSON.parse(updatedUser.permissions);
        } catch (error) {
          updatedUser.permissions = [];
        }
      }

      res.json(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// ============================================================================
// PASSWORD MANAGEMENT ROUTES
// ============================================================================

// Change password endpoint
router.post('/auth/change-password',
  authenticateToken,
  rateLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  auditLog('CHANGE_PASSWORD'),
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'Current password and new password are required',
          code: 'MISSING_PASSWORDS'
        });
      }

      // Validate new password strength
      if (newPassword.length < 8) {
        return res.status(400).json({
          error: 'New password must be at least 8 characters long',
          code: 'WEAK_PASSWORD'
        });
      }

      // Get current user data
      const [users] = await pool.execute(
        'SELECT password FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = users[0];

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          error: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password in database
      await pool.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedNewPassword, userId]
      );

      res.json({
        message: 'Password changed successfully',
        code: 'PASSWORD_CHANGED'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// ============================================================================
// AUDIT LOGS ROUTES (Super Admin Only)
// ============================================================================

// Get audit logs
router.get('/audit-logs',
  authenticateToken,
  authorizeRole(['super_admin']),
  rateLimit(50, 15 * 60 * 1000), // 50 requests per 15 minutes
  auditLog('GET_AUDIT_LOGS'),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      const action = req.query.action || '';
      const userId = req.query.userId || '';

      let query = `
        SELECT al.*, u.email, u.full_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE 1=1
      `;
      let params = [];

      if (action) {
        query += ` AND al.action LIKE ?`;
        params.push(`%${action}%`);
      }

      if (userId) {
        query += ` AND al.user_id = ?`;
        params.push(userId);
      }

      query += ` ORDER BY al.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

      const [logs] = await pool.execute(query, params);

      // Get total count
      let countQuery = `SELECT COUNT(*) as total FROM audit_logs al WHERE 1=1`;
      let countParams = [];

      if (action) {
        countQuery += ` AND al.action LIKE ?`;
        countParams.push(`%${action}%`);
      }
      if (userId) {
        countQuery += ` AND al.user_id = ?`;
        countParams.push(userId);
      }

      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;

      res.json({
        logs: logs,
        pagination: {
          page: page,
          limit: limit,
          total: total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

module.exports = router;