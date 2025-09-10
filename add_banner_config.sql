-- Add banner configuration fields to existing system_configuration table
-- This script should be run on existing databases to add the new banner management features

USE forward_africa_db;

-- Add banner configuration columns to system_configuration table
ALTER TABLE system_configuration
ADD COLUMN homepage_banner_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN homepage_banner_type ENUM('video', 'image', 'course') DEFAULT 'course',
ADD COLUMN homepage_banner_video_url VARCHAR(500) NULL,
ADD COLUMN homepage_banner_image_url VARCHAR(500) NULL,
ADD COLUMN homepage_banner_title VARCHAR(255) NULL,
ADD COLUMN homepage_banner_subtitle TEXT NULL,
ADD COLUMN homepage_banner_description TEXT NULL,
ADD COLUMN homepage_banner_button_text VARCHAR(100) DEFAULT 'Get Started',
ADD COLUMN homepage_banner_button_url VARCHAR(500) NULL,
ADD COLUMN homepage_banner_overlay_opacity DECIMAL(3,2) DEFAULT 0.70;

-- Create banners upload directory if it doesn't exist
-- Note: This is a placeholder comment - the actual directory creation should be done manually
-- or through the application code when the upload endpoint is first used

-- Insert default banner configuration if no system_configuration record exists
INSERT IGNORE INTO system_configuration (
    id,
    site_name,
    site_description,
    homepage_banner_enabled,
    homepage_banner_type,
    homepage_banner_button_text,
    homepage_banner_overlay_opacity
) VALUES (
    1,
    'Forward Africa',
    'Empowering African professionals through expert-led courses',
    FALSE,
    'course',
    'Get Started',
    0.70
);

-- Update existing system_configuration record with banner defaults if it exists
UPDATE system_configuration
SET
    homepage_banner_enabled = FALSE,
    homepage_banner_type = 'course',
    homepage_banner_button_text = 'Get Started',
    homepage_banner_overlay_opacity = 0.70
WHERE id = 1;

-- Verify the changes
SELECT
    id,
    site_name,
    homepage_banner_enabled,
    homepage_banner_type,
    homepage_banner_button_text,
    homepage_banner_overlay_opacity
FROM system_configuration
WHERE id = 1;