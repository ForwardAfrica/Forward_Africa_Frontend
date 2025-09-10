-- Fix missing banner columns in system_configuration table
-- This script adds the missing columns that are causing the banner API to fail

USE forward_africa_db;

-- Add the missing banner columns
ALTER TABLE system_configuration
ADD COLUMN homepage_banner_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN homepage_banner_overlay_opacity DECIMAL(3,2) DEFAULT 0.70;

-- Update existing record with default values
UPDATE system_configuration
SET
    homepage_banner_enabled = FALSE,
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