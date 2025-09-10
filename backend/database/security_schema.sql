-- Security and Audit Schema for Forward Africa
-- Add security features to existing database

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status_code INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Add security columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS refresh_token TEXT NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL;

-- Security events table
CREATE TABLE IF NOT EXISTS security_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  event_type VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_event_type (event_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- System configuration table
CREATE TABLE IF NOT EXISTS system_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(255) NOT NULL UNIQUE,
  config_value TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default system config
INSERT IGNORE INTO system_config (config_key, config_value, description) VALUES
('site_name', 'Forward Africa', 'Website name'),
('maintenance_mode', 'false', 'Maintenance mode status'),
('max_upload_size', '50', 'Maximum file upload size in MB'),
('session_timeout', '30', 'Session timeout in minutes'),
('security_level', 'high', 'Security level');