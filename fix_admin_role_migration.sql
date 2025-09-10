-- Migration script to fix admin role references
-- This script updates existing users with 'admin' role to 'community_manager' role
-- and updates the database schema to match the new role system

USE forward_africa_db;

-- First, update the users table schema to include the new roles
ALTER TABLE users MODIFY COLUMN role ENUM('user', 'content_manager', 'community_manager', 'user_support', 'super_admin') DEFAULT 'user';

-- Update existing users with 'admin' role to 'community_manager' role
UPDATE users SET role = 'community_manager' WHERE role = 'admin';

-- Verify the changes
SELECT id, email, full_name, role FROM users WHERE role IN ('community_manager', 'user_support', 'super_admin');

-- Show the updated role distribution
SELECT role, COUNT(*) as count FROM users GROUP BY role;