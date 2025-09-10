-- Enhanced User Management and Audit Logging Schema
-- This schema adds security features and audit logging to the existing database

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status_code INT,
  request_method VARCHAR(10),
  request_url TEXT,
  request_body TEXT,
  response_body TEXT,
  execution_time_ms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at),
  INDEX idx_ip_address (ip_address),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- ENHANCED USERS TABLE (Add new columns to existing table)
-- ============================================================================

-- Add new security-related columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS refresh_token TEXT NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS login_history JSON NULL,
ADD COLUMN IF NOT EXISTS security_questions JSON NULL,
ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS account_locked_reason VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP NULL;

-- Add indexes for security queries
ALTER TABLE users
ADD INDEX IF NOT EXISTS idx_email_verification_token (email_verification_token),
ADD INDEX IF NOT EXISTS idx_password_reset_token (password_reset_token),
ADD INDEX IF NOT EXISTS idx_is_active (is_active),
ADD INDEX IF NOT EXISTS idx_account_locked (account_locked);

-- ============================================================================
-- SESSION MANAGEMENT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  refresh_token VARCHAR(255) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_session_token (session_token),
  INDEX idx_refresh_token (refresh_token),
  INDEX idx_expires_at (expires_at),
  INDEX idx_is_active (is_active),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- SECURITY EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  event_type ENUM('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE', 'PASSWORD_RESET', 'EMAIL_VERIFICATION', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_EXCEEDED', 'INVALID_TOKEN', 'PERMISSION_DENIED') NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSON,
  severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'LOW',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_event_type (event_type),
  INDEX idx_severity (severity),
  INDEX idx_created_at (created_at),
  INDEX idx_ip_address (ip_address),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- API RATE LIMITING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL, -- IP address or user ID
  endpoint VARCHAR(255) NOT NULL,
  request_count INT DEFAULT 1,
  window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  window_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_identifier (identifier),
  INDEX idx_endpoint (endpoint),
  INDEX idx_window_end (window_end),
  UNIQUE KEY unique_rate_limit (identifier, endpoint, window_start)
);

-- ============================================================================
-- SYSTEM CONFIGURATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(255) NOT NULL UNIQUE,
  config_value TEXT,
  config_type ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ARRAY') DEFAULT 'STRING',
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT,
  INDEX idx_config_key (config_key),
  INDEX idx_is_public (is_public),
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- PERMISSIONS AND ROLES TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  permission_id INT NOT NULL,
  granted_by INT,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_user_id (user_id),
  INDEX idx_permission_id (permission_id),
  INDEX idx_is_active (is_active),
  UNIQUE KEY unique_user_permission (user_id, permission_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- INSERT DEFAULT DATA
-- ============================================================================

-- Insert default permissions
INSERT IGNORE INTO permissions (name, description, category) VALUES
('system:config:read', 'Read system configuration', 'System'),
('system:config:write', 'Update system configuration', 'System'),
('system:backup:create', 'Create system backups', 'System'),
('system:status:read', 'Read system status', 'System'),
('users:read', 'Read user information', 'User Management'),
('users:write', 'Create and update users', 'User Management'),
('users:delete', 'Delete users', 'User Management'),
('audit:read', 'Read audit logs', 'Audit'),
('courses:read', 'Read course information', 'Content'),
('courses:write', 'Create and update courses', 'Content'),
('courses:delete', 'Delete courses', 'Content'),
('lessons:read', 'Read lesson information', 'Content'),
('lessons:write', 'Create and update lessons', 'Content'),
('lessons:delete', 'Delete lessons', 'Content');

-- Insert default system configuration
INSERT IGNORE INTO system_config (config_key, config_value, config_type, description, is_public) VALUES
('site_name', 'Forward Africa', 'STRING', 'Website name', TRUE),
('site_description', 'Empowering African professionals through expert-led courses', 'STRING', 'Website description', TRUE),
('maintenance_mode', 'false', 'BOOLEAN', 'Maintenance mode status', TRUE),
('debug_mode', 'false', 'BOOLEAN', 'Debug mode status', FALSE),
('max_upload_size', '50', 'NUMBER', 'Maximum file upload size in MB', TRUE),
('session_timeout', '30', 'NUMBER', 'Session timeout in minutes', FALSE),
('email_notifications', 'true', 'BOOLEAN', 'Enable email notifications', FALSE),
('auto_backup', 'true', 'BOOLEAN', 'Enable automatic backups', FALSE),
('backup_frequency', 'daily', 'STRING', 'Backup frequency', FALSE),
('security_level', 'high', 'STRING', 'Security level', FALSE),
('rate_limiting', 'true', 'BOOLEAN', 'Enable rate limiting', FALSE),
('max_requests_per_minute', '100', 'NUMBER', 'Maximum requests per minute', FALSE),
('database_connection_pool', '10', 'NUMBER', 'Database connection pool size', FALSE),
('cache_enabled', 'true', 'BOOLEAN', 'Enable caching', FALSE),
('cache_ttl', '3600', 'NUMBER', 'Cache TTL in seconds', FALSE),
('cdn_enabled', 'false', 'BOOLEAN', 'Enable CDN', FALSE),
('ssl_enabled', 'true', 'BOOLEAN', 'Enable SSL', TRUE),
('cors_enabled', 'true', 'BOOLEAN', 'Enable CORS', FALSE),
('allowed_origins', '["https://forwardafrica.com", "https://www.forwardafrica.com"]', 'ARRAY', 'Allowed CORS origins', FALSE);

-- ============================================================================
-- CLEANUP PROCEDURES
-- ============================================================================

-- Procedure to clean up expired sessions
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS cleanup_expired_sessions()
BEGIN
  DELETE FROM user_sessions WHERE expires_at < NOW();
  DELETE FROM rate_limits WHERE window_end < NOW();
END //
DELIMITER ;

-- Procedure to clean up old audit logs (keep last 90 days)
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS cleanup_old_audit_logs()
BEGIN
  DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
  DELETE FROM security_events WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
END //
DELIMITER ;

-- ============================================================================
-- TRIGGERS FOR AUDIT LOGGING
-- ============================================================================

-- Trigger to log user updates
DELIMITER //
CREATE TRIGGER IF NOT EXISTS log_user_updates
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  IF OLD.is_active != NEW.is_active THEN
    INSERT INTO security_events (user_id, event_type, details, severity)
    VALUES (
      NEW.id,
      CASE
        WHEN NEW.is_active = 0 THEN 'ACCOUNT_LOCKED'
        ELSE 'ACCOUNT_UNLOCKED'
      END,
      JSON_OBJECT(
        'old_active', OLD.is_active,
        'new_active', NEW.is_active,
        'reason', NEW.account_locked_reason
      ),
      'HIGH'
    );
  END IF;

  IF OLD.failed_login_attempts != NEW.failed_login_attempts THEN
    INSERT INTO security_events (user_id, event_type, details, severity)
    VALUES (
      NEW.id,
      'LOGIN_FAILED',
      JSON_OBJECT(
        'old_attempts', OLD.failed_login_attempts,
        'new_attempts', NEW.failed_login_attempts
      ),
      CASE
        WHEN NEW.failed_login_attempts >= 5 THEN 'CRITICAL'
        WHEN NEW.failed_login_attempts >= 3 THEN 'HIGH'
        ELSE 'MEDIUM'
      END
    );
  END IF;
END //
DELIMITER ;

-- ============================================================================
-- VIEWS FOR EASY QUERYING
-- ============================================================================

-- View for active user sessions
CREATE OR REPLACE VIEW active_sessions AS
SELECT
  us.id,
  us.user_id,
  u.email,
  u.full_name,
  us.ip_address,
  us.user_agent,
  us.created_at,
  us.last_activity,
  us.expires_at
FROM user_sessions us
JOIN users u ON us.user_id = u.id
WHERE us.is_active = TRUE AND us.expires_at > NOW();

-- View for recent security events
CREATE OR REPLACE VIEW recent_security_events AS
SELECT
  se.id,
  se.user_id,
  u.email,
  u.full_name,
  se.event_type,
  se.ip_address,
  se.severity,
  se.created_at,
  se.details
FROM security_events se
LEFT JOIN users u ON se.user_id = u.id
WHERE se.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY se.created_at DESC;

-- View for system statistics
CREATE OR REPLACE VIEW system_stats AS
SELECT
  (SELECT COUNT(*) FROM users WHERE is_active = TRUE) as active_users,
  (SELECT COUNT(*) FROM users WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)) as new_users_30d,
  (SELECT COUNT(*) FROM user_sessions WHERE is_active = TRUE AND expires_at > NOW()) as active_sessions,
  (SELECT COUNT(*) FROM security_events WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) AND severity = 'CRITICAL') as critical_events_24h,
  (SELECT COUNT(*) FROM audit_logs WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)) as audit_events_24h;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Add composite indexes for better query performance
ALTER TABLE audit_logs
ADD INDEX idx_user_action_time (user_id, action, created_at),
ADD INDEX idx_ip_time (ip_address, created_at);

ALTER TABLE security_events
ADD INDEX idx_user_type_time (user_id, event_type, created_at),
ADD INDEX idx_severity_time (severity, created_at);

ALTER TABLE user_sessions
ADD INDEX idx_user_active_time (user_id, is_active, expires_at);

-- ============================================================================
-- COMMENTS
-- ============================================================================

-- Add comments to tables for documentation
ALTER TABLE audit_logs COMMENT = 'Audit trail for all system actions';
ALTER TABLE user_sessions COMMENT = 'Active user sessions and tokens';
ALTER TABLE security_events COMMENT = 'Security-related events and alerts';
ALTER TABLE rate_limits COMMENT = 'API rate limiting data';
ALTER TABLE system_config COMMENT = 'System configuration settings';
ALTER TABLE permissions COMMENT = 'Available system permissions';
ALTER TABLE user_permissions COMMENT = 'User permission assignments';