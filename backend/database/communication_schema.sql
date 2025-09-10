-- Communication Center Database Schema
-- This file contains all tables needed for the communication center functionality

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    audience ENUM('all', 'users', 'instructors', 'admins') DEFAULT 'all',
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    created_by INT NOT NULL,
    published_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    views_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_audience (audience),
    INDEX idx_created_at (created_at)
);

-- Email campaigns table
CREATE TABLE IF NOT EXISTS email_campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    audience ENUM('all', 'users', 'instructors', 'admins', 'custom') DEFAULT 'all',
    custom_audience_ids JSON NULL, -- For custom audience selection
    status ENUM('draft', 'scheduled', 'sending', 'sent', 'cancelled') DEFAULT 'draft',
    scheduled_at TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    total_recipients INT DEFAULT 0,
    delivered_count INT DEFAULT 0,
    opened_count INT DEFAULT 0,
    clicked_count INT DEFAULT 0,
    bounce_count INT DEFAULT 0,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_scheduled_at (scheduled_at)
);

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    variables JSON NULL, -- Template variables like {{name}}, {{email}}, etc.
    is_default BOOLEAN DEFAULT FALSE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Push notifications table
CREATE TABLE IF NOT EXISTS push_notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    audience ENUM('all', 'users', 'instructors', 'admins', 'custom') DEFAULT 'all',
    custom_audience_ids JSON NULL,
    status ENUM('draft', 'scheduled', 'sent', 'cancelled') DEFAULT 'draft',
    scheduled_at TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    total_recipients INT DEFAULT 0,
    delivered_count INT DEFAULT 0,
    opened_count INT DEFAULT 0,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_scheduled_at (scheduled_at)
);

-- Notification delivery tracking table
CREATE TABLE IF NOT EXISTS notification_deliveries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    notification_id INT NOT NULL,
    notification_type ENUM('email', 'push', 'announcement') NOT NULL,
    user_id INT NOT NULL,
    status ENUM('pending', 'delivered', 'opened', 'clicked', 'failed', 'bounced') DEFAULT 'pending',
    delivered_at TIMESTAMP NULL,
    opened_at TIMESTAMP NULL,
    clicked_at TIMESTAMP NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notification (notification_id, notification_type),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
);

-- Communication settings table
CREATE TABLE IF NOT EXISTS communication_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT NULL,
    updated_by INT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default communication settings
INSERT INTO communication_settings (setting_key, setting_value, description) VALUES
('default_sender_email', 'noreply@forwardafrica.com', 'Default sender email address'),
('default_sender_name', 'Forward Africa', 'Default sender name'),
('enable_email_notifications', 'true', 'Enable email notifications'),
('enable_push_notifications', 'true', 'Enable push notifications'),
('require_email_confirmation', 'true', 'Require email confirmation for new users'),
('enable_sms_notifications', 'false', 'Enable SMS notifications'),
('email_daily_limit', '1000', 'Daily email sending limit'),
('notification_retention_days', '30', 'Days to keep notification records');

-- Insert default email templates
INSERT INTO email_templates (name, subject, content, variables, is_default, created_by) VALUES
('Welcome Email', 'Welcome to Forward Africa!',
'<h2>Welcome to Forward Africa!</h2>
<p>Hi {{name}},</p>
<p>Welcome to Forward Africa! We''re excited to have you join our learning community.</p>
<p>Get started by exploring our courses and connecting with other learners.</p>
<p>Best regards,<br>The Forward Africa Team</p>',
'["name", "email"]', true, 1),

('Course Reminder', 'Continue Your Learning Journey',
'<h2>Don''t Forget Your Learning Goals!</h2>
<p>Hi {{name}},</p>
<p>We noticed you haven''t been active in your course "{{course_name}}" recently.</p>
<p>Keep up the momentum and continue your learning journey!</p>
<p>Best regards,<br>The Forward Africa Team</p>',
'["name", "email", "course_name"]', false, 1),

('Maintenance Notice', 'Scheduled Maintenance Notice',
'<h2>Scheduled Maintenance Notice</h2>
<p>Hi {{name}},</p>
<p>We will be performing scheduled maintenance on {{maintenance_date}} from {{start_time}} to {{end_time}} UTC.</p>
<p>During this time, the platform will be temporarily unavailable.</p>
<p>We apologize for any inconvenience.</p>
<p>Best regards,<br>The Forward Africa Team</p>',
'["name", "email", "maintenance_date", "start_time", "end_time"]', false, 1);