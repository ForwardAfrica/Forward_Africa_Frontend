-- Forward Africa Learning Platform Database Schema
-- MySQL Database with Sample Data

-- Create database
CREATE DATABASE IF NOT EXISTS forward_africa_db;
USE forward_africa_db;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS system_configuration;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS community_groups;
DROP TABLE IF EXISTS group_members;
DROP TABLE IF EXISTS group_messages;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS user_progress;
DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS instructors;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS user_favorites;

-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(191) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255), -- Added for authentication
    avatar_url TEXT,
    education_level ENUM('high-school', 'associate', 'bachelor', 'master', 'phd', 'professional', 'other'),
    job_title VARCHAR(255),
    topics_of_interest JSON,
    industry VARCHAR(255),
    experience_level VARCHAR(100),
    business_stage VARCHAR(100),
    country VARCHAR(100),
    state_province VARCHAR(100),
    city VARCHAR(100),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    role ENUM('user', 'content_manager', 'community_manager', 'user_support', 'super_admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Instructors table
CREATE TABLE instructors (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    image TEXT NOT NULL,
    bio TEXT,
    email VARCHAR(191) UNIQUE NOT NULL,
    phone VARCHAR(50),
    expertise JSON,
    experience INT,
    social_links JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE courses (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    instructor_id VARCHAR(36) NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    thumbnail TEXT NOT NULL,
    banner TEXT NOT NULL,
    video_url TEXT,
    description TEXT NOT NULL,
    featured BOOLEAN DEFAULT FALSE,
    total_xp INT DEFAULT 0,
    coming_soon BOOLEAN DEFAULT FALSE,
    release_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Lessons table
CREATE TABLE lessons (
    id VARCHAR(36) PRIMARY KEY,
    course_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    duration VARCHAR(10) NOT NULL,
    thumbnail TEXT NOT NULL,
    video_url TEXT NOT NULL,
    description TEXT NOT NULL,
    xp_points INT DEFAULT 0,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- System Configuration table
CREATE TABLE system_configuration (
    id INT PRIMARY KEY DEFAULT 1,
    site_name VARCHAR(255) NOT NULL DEFAULT 'Forward Africa',
    site_description TEXT,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    debug_mode BOOLEAN DEFAULT FALSE,
    max_upload_size INT DEFAULT 50,
    session_timeout INT DEFAULT 30,
    email_notifications BOOLEAN DEFAULT TRUE,
    auto_backup BOOLEAN DEFAULT TRUE,
    backup_frequency ENUM('hourly', 'daily', 'weekly', 'monthly') DEFAULT 'daily',
    security_level ENUM('low', 'medium', 'high', 'maximum') DEFAULT 'high',
    rate_limiting BOOLEAN DEFAULT TRUE,
    max_requests_per_minute INT DEFAULT 100,
    database_connection_pool INT DEFAULT 10,
    cache_enabled BOOLEAN DEFAULT TRUE,
    cache_ttl INT DEFAULT 3600,
    cdn_enabled BOOLEAN DEFAULT FALSE,
    ssl_enabled BOOLEAN DEFAULT TRUE,
    cors_enabled BOOLEAN DEFAULT TRUE,
    allowed_origins JSON,
    -- Homepage Banner Configuration
    homepage_banner_enabled BOOLEAN DEFAULT FALSE,
    homepage_banner_type ENUM('video', 'image', 'course') DEFAULT 'course',
    homepage_banner_video_url VARCHAR(500),
    homepage_banner_image_url VARCHAR(500),
    homepage_banner_title VARCHAR(255),
    homepage_banner_subtitle TEXT,
    homepage_banner_description TEXT,
    homepage_banner_button_text VARCHAR(100) DEFAULT 'Get Started',
    homepage_banner_button_url VARCHAR(500),
    homepage_banner_overlay_opacity DECIMAL(3,2) DEFAULT 0.70,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User Progress table
CREATE TABLE user_progress (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    course_id VARCHAR(36) NOT NULL,
    lesson_id VARCHAR(36) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    progress DECIMAL(5,2) DEFAULT 0.00,
    last_watched TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    xp_earned INT DEFAULT 0,
    completed_lessons JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_course (user_id, course_id)
);

-- Certificates table
CREATE TABLE certificates (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    course_id VARCHAR(36) NOT NULL,
    course_title VARCHAR(255) NOT NULL,
    earned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    student_name VARCHAR(255) NOT NULL,
    instructor_name VARCHAR(255) NOT NULL,
    verification_code VARCHAR(191) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Achievements table
CREATE TABLE achievements (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(255) NOT NULL,
    xp_points INT DEFAULT 0,
    earned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress DECIMAL(5,2) DEFAULT 0.00,
    type ENUM('course', 'streak', 'social', 'milestone') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add after the existing tables
CREATE TABLE user_favorites (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    course_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_course (user_id, course_id)
);

-- Insert sample data

-- Users
INSERT INTO users (id, email, full_name, avatar_url, education_level, job_title, topics_of_interest, industry, experience_level, business_stage, country, state_province, city, onboarding_completed, role) VALUES
('u1', 'john.doe@example.com', 'John Doe', 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg', 'bachelor', 'Software Developer', '["technology", "programming", "business"]', 'Technology', 'Mid-level', 'Growth', 'Nigeria', 'Lagos', 'Lagos', TRUE, 'user'),
('u2', 'jane.smith@example.com', 'Jane Smith', 'https://images.pexels.com/photos/1587009/pexels-photo-1587009.jpeg', 'master', 'Product Manager', '["business", "leadership", "innovation"]', 'Finance', 'Senior', 'Established', 'Kenya', 'Nairobi', 'Nairobi', TRUE, 'community_manager'),
('u3', 'mike.johnson@example.com', 'Mike Johnson', 'https://images.pexels.com/photos/5439367/pexels-photo-5439367.jpeg', 'phd', 'Data Scientist', '["technology", "data-science", "analytics"]', 'Technology', 'Expert', 'Scale-up', 'South Africa', 'Gauteng', 'Johannesburg', TRUE, 'content_manager'),
('u4', 'sarah.wilson@example.com', 'Sarah Wilson', 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg', 'bachelor', 'Marketing Specialist', '["marketing", "business", "social-media"]', 'Marketing', 'Entry-level', 'Startup', 'Ghana', 'Greater Accra', 'Accra', TRUE, 'user'),
('u5', 'admin@forwardafrica.com', 'Super Administrator', 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg', 'master', 'System Administrator', '["technology", "management", "leadership"]', 'Technology', 'Senior', 'Established', 'Nigeria', 'Lagos', 'Lagos', TRUE, 'super_admin');

-- Categories
INSERT INTO categories (id, name, description) VALUES
('cat1', 'Business', 'Business fundamentals and management courses'),
('cat2', 'Entrepreneurship', 'Entrepreneurial skills and startup guidance'),
('cat3', 'Finance', 'Financial management and investment strategies'),
('cat4', 'Personal Development', 'Personal growth and leadership development'),
('cat5', 'Technology', 'Technology and innovation courses');

-- Instructors
INSERT INTO instructors (id, name, title, image, bio, email, phone, expertise, experience, social_links) VALUES
('inst1', 'Ray Dalio', 'Founder of Bridgewater Associates', 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg', 'Ray Dalio is the founder of Bridgewater Associates, one of the world\'s largest hedge funds. His principles for success have influenced business leaders worldwide.', 'ray.dalio@forwardafrica.com', '+1-555-0101', '["Investment Strategy", "Business Principles", "Economic Analysis"]', 45, '{"linkedin": "https://linkedin.com/in/raydalio", "twitter": "https://twitter.com/raydalio", "website": "https://principles.com"}'),
('inst2', 'Sara Blakely', 'Founder of SPANX', 'https://images.pexels.com/photos/1587009/pexels-photo-1587009.jpeg', 'Sara Blakely is the founder of SPANX and the youngest self-made female billionaire. She revolutionized the shapewear industry through innovative entrepreneurship.', 'sara.blakely@forwardafrica.com', '+1-555-0102', '["Entrepreneurship", "Product Development", "Brand Building"]', 25, '{"linkedin": "https://linkedin.com/in/sarablakely", "twitter": "https://twitter.com/sarablakely"}'),
('inst3', 'Howard Marks', 'Co-founder of Oaktree Capital', 'https://images.pexels.com/photos/5439367/pexels-photo-5439367.jpeg', 'Howard Marks is the co-founder of Oaktree Capital Management and a renowned expert in investment strategy and market cycles.', 'howard.marks@forwardafrica.com', '+1-555-0103', '["Investment Management", "Market Cycles", "Risk Assessment"]', 50, '{"linkedin": "https://linkedin.com/in/howardmarks", "website": "https://oaktreecapital.com"}'),
('inst4', 'Brené Brown', 'Leadership Researcher & Author', 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg', 'Brené Brown is a research professor and bestselling author known for her work on leadership, courage, and vulnerability.', 'brene.brown@forwardafrica.com', '+1-555-0104', '["Leadership", "Vulnerability", "Courage", "Team Building"]', 20, '{"linkedin": "https://linkedin.com/in/brenebrown", "twitter": "https://twitter.com/brenebrown", "website": "https://brenebrown.com"}'),
('inst5', 'Elon Musk', 'CEO of Tesla & SpaceX', 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg', 'Elon Musk is a technology entrepreneur and business magnate known for founding and leading multiple groundbreaking companies including Tesla, SpaceX, and Neuralink.', 'elon.musk@forwardafrica.com', '+1-555-0105', '["Innovation", "Technology", "Space Exploration", "Electric Vehicles", "Artificial Intelligence"]', 25, '{"linkedin": "https://linkedin.com/in/elonmusk", "twitter": "https://twitter.com/elonmusk", "website": "https://tesla.com"}');

-- Courses
INSERT INTO courses (id, title, instructor_id, category_id, thumbnail, banner, video_url, description, featured, total_xp, coming_soon) VALUES
('course1', 'Business Fundamentals & Essentials', 'inst1', 'cat1', 'https://images.pexels.com/photos/7681118/pexels-photo-7681118.jpeg', 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg', 'https://www.youtube.com/watch?v=8jPQjjsBbIc', 'Master the core principles of business with Ray Dalio. Learn strategic thinking, decision-making, and organizational leadership that drove Bridgewater\'s success.', TRUE, 500, FALSE),
('course2', 'Innovation & Technology Leadership', 'inst5', 'cat5', 'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg', 'https://images.pexels.com/photos/3861959/pexels-photo-3861959.jpeg', 'https://www.youtube.com/watch?v=cdiD-9MMpb0', 'Learn from Elon Musk about innovation, technology leadership, and building companies that change the world. Discover the mindset and strategies behind Tesla, SpaceX, and other revolutionary ventures.', TRUE, 600, FALSE),
('course3', 'Entrepreneurial Success Strategies', 'inst2', 'cat2', 'https://images.pexels.com/photos/7681119/pexels-photo-7681119.jpeg', 'https://images.pexels.com/photos/3184293/pexels-photo-3184293.jpeg', 'https://www.youtube.com/watch?v=8jPQjjsBbIc', 'Discover the entrepreneurial journey with Sara Blakely. Learn how to build a successful business from the ground up with innovative thinking and strategic planning.', FALSE, 450, FALSE),
('course4', 'Investment Strategy Masterclass', 'inst3', 'cat3', 'https://images.pexels.com/photos/7681120/pexels-photo-7681120.jpeg', 'https://images.pexels.com/photos/3184294/pexels-photo-3184294.jpeg', 'https://www.youtube.com/watch?v=9bZkp7q19f0', 'Master investment strategies with Howard Marks. Learn about market cycles, risk assessment, and building a successful investment portfolio.', FALSE, 550, FALSE),
('course5', 'Leadership & Vulnerability', 'inst4', 'cat4', 'https://images.pexels.com/photos/7681121/pexels-photo-7681121.jpeg', 'https://images.pexels.com/photos/3184295/pexels-photo-3184295.jpeg', 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', 'Transform your leadership style with Brené Brown. Learn how vulnerability and courage can create stronger teams and more effective leadership.', FALSE, 400, FALSE),
('course6', 'Advanced AI & Machine Learning', 'inst5', 'cat5', 'https://images.pexels.com/photos/3861965/pexels-photo-3861965.jpeg', 'https://images.pexels.com/photos/3861966/pexels-photo-3861966.jpeg', 'https://www.youtube.com/watch?v=test123', 'Advanced course on artificial intelligence and machine learning. Coming soon with comprehensive content.', FALSE, 800, TRUE);

-- Lessons
INSERT INTO lessons (id, course_id, title, duration, thumbnail, video_url, description, xp_points, order_index) VALUES
-- Course 1 Lessons
('lesson1', 'course1', 'Understanding Business Fundamentals', '32:15', 'https://images.pexels.com/photos/7681891/pexels-photo-7681891.jpeg', 'https://www.youtube.com/watch?v=8jPQjjsBbIc', 'Ray introduces the essential components of successful business operations and the foundational principles that every entrepreneur needs to understand.', 100, 1),
('lesson2', 'course1', 'Strategic Decision Making', '41:30', 'https://images.pexels.com/photos/7681866/pexels-photo-7681866.jpeg', 'https://www.youtube.com/watch?v=9bZkp7q19f0', 'Learn how to make effective business decisions using proven frameworks and analytical thinking processes.', 100, 2),
('lesson3', 'course1', 'Building High-Performance Teams', '38:45', 'https://images.pexels.com/photos/7681892/pexels-photo-7681892.jpeg', 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', 'Discover the secrets to creating and managing teams that consistently deliver exceptional results.', 100, 3),
('lesson4', 'course1', 'Financial Management Essentials', '45:20', 'https://images.pexels.com/photos/7681893/pexels-photo-7681893.jpeg', 'https://www.youtube.com/watch?v=L_jWHffIx5E', 'Master the fundamentals of business finance, cash flow management, and financial planning strategies.', 100, 4),
('lesson5', 'course1', 'Scaling Your Business', '52:10', 'https://images.pexels.com/photos/7681894/pexels-photo-7681894.jpeg', 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ', 'Learn proven strategies for scaling your business operations while maintaining quality and culture.', 100, 5),

-- Course 2 Lessons
('lesson6', 'course2', 'First Principles Thinking', '28:30', 'https://images.pexels.com/photos/3861960/pexels-photo-3861960.jpeg', 'https://www.youtube.com/watch?v=cdiD-9MMpb0', 'Master the art of first principles thinking to break down complex problems and find innovative solutions.', 120, 1),
('lesson7', 'course2', 'Building Revolutionary Products', '35:45', 'https://images.pexels.com/photos/3861961/pexels-photo-3861961.jpeg', 'https://www.youtube.com/watch?v=cdiD-9MMpb0', 'Learn how to design and develop products that fundamentally change industries and create new markets.', 120, 2),
('lesson8', 'course2', 'Managing Risk in Innovation', '42:15', 'https://images.pexels.com/photos/3861962/pexels-photo-3861962.jpeg', 'https://www.youtube.com/watch?v=cdiD-9MMpb0', 'Understand how to balance bold innovation with calculated risk management in high-stakes ventures.', 120, 3),
('lesson9', 'course2', 'Leading Through Disruption', '39:20', 'https://images.pexels.com/photos/3861963/pexels-photo-3861963.jpeg', 'https://www.youtube.com/watch?v=cdiD-9MMpb0', 'Learn strategies for leading organizations through periods of significant change and disruption.', 120, 4),
('lesson10', 'course2', 'Future of Technology', '48:55', 'https://images.pexels.com/photos/3861964/pexels-photo-3861964.jpeg', 'https://www.youtube.com/watch?v=cdiD-9MMpb0', 'Explore emerging technologies and their potential impact on business and society.', 120, 5);

-- User Progress (sample data)
INSERT INTO user_progress (id, user_id, course_id, lesson_id, completed, progress, last_watched, xp_earned, completed_lessons) VALUES
('prog1', 'u1', 'course1', 'lesson2', FALSE, 25.50, '2024-01-15 10:30:00', 100, '["lesson1"]'),
('prog2', 'u2', 'course1', 'lesson4', FALSE, 75.00, '2024-01-16 14:20:00', 300, '["lesson1", "lesson2", "lesson3"]'),
('prog3', 'u3', 'course2', 'lesson7', FALSE, 50.00, '2024-01-17 09:15:00', 240, '["lesson6"]'),
('prog4', 'u4', 'course1', 'lesson5', TRUE, 100.00, '2024-01-18 16:45:00', 500, '["lesson1", "lesson2", "lesson3", "lesson4", "lesson5"]');

-- Certificates (sample data)
INSERT INTO certificates (id, user_id, course_id, course_title, earned_date, student_name, instructor_name, verification_code) VALUES
('cert1', 'u4', 'course1', 'Business Fundamentals & Essentials', '2024-01-18 16:45:00', 'Sarah Wilson', 'Ray Dalio', 'CERT-2024-001-ABC123'),
('cert2', 'u2', 'course2', 'Innovation & Technology Leadership', '2024-01-20 11:30:00', 'Jane Smith', 'Elon Musk', 'CERT-2024-002-DEF456');

-- Achievements (sample data)
INSERT INTO achievements (id, user_id, title, description, icon, xp_points, earned_date, progress, type) VALUES
('ach1', 'u4', 'Course Completion', 'Completed your first course', 'graduation-cap', 100, '2024-01-18 16:45:00', 100.00, 'course'),
('ach2', 'u2', 'Learning Streak', 'Maintained a 7-day learning streak', 'flame', 50, '2024-01-20 11:30:00', 100.00, 'streak'),
('ach3', 'u1', 'First Lesson', 'Completed your first lesson', 'play-circle', 25, '2024-01-15 10:30:00', 100.00, 'milestone'),
('ach4', 'u3', 'XP Collector', 'Earned 500 XP points', 'star', 75, '2024-01-17 09:15:00', 100.00, 'milestone');

-- Notifications table
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('course', 'achievement', 'system', 'community') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Community Groups table
CREATE TABLE community_groups (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    image TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    max_members INT DEFAULT 100,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Group Members table
CREATE TABLE group_members (
    id VARCHAR(36) PRIMARY KEY,
    group_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role ENUM('member', 'moderator', 'admin') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES community_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_group_member (group_id, user_id)
);

-- Group Messages table
CREATE TABLE group_messages (
    id VARCHAR(36) PRIMARY KEY,
    group_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    message TEXT NOT NULL,
    message_type ENUM('text', 'image', 'file', 'link') DEFAULT 'text',
    file_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES community_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit Logs table
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(36),
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_courses_featured ON courses(featured);
CREATE INDEX idx_courses_category ON courses(category_id);
CREATE INDEX idx_lessons_course ON lessons(course_id);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_course ON user_progress(course_id);
CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_achievements_user ON achievements(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_community_groups_category ON community_groups(category);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_messages_group ON group_messages(group_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Insert sample data for new tables

-- Sample notifications
INSERT INTO notifications (id, user_id, title, message, type, is_read, data) VALUES
('notif1', 'u1', 'Welcome to Forward Africa!', 'Thank you for joining our learning platform. Start your journey today!', 'system', FALSE, '{"action": "welcome"}'),
('notif2', 'u1', 'Course Available', 'New course "Business Fundamentals" is now available for you.', 'course', FALSE, '{"courseId": "course1", "courseTitle": "Business Fundamentals & Essentials"}'),
('notif3', 'u4', 'Achievement Unlocked!', 'Congratulations! You completed your first course.', 'achievement', FALSE, '{"achievementId": "ach1", "achievementTitle": "Course Completion"}'),
('notif4', 'u2', 'Community Invitation', 'You have been invited to join the "Entrepreneurs Network" group.', 'community', FALSE, '{"groupId": "group1", "groupName": "Entrepreneurs Network"}');

-- Sample community groups
INSERT INTO community_groups (id, name, description, category, image, is_private, max_members, created_by) VALUES
('group1', 'Entrepreneurs Network', 'A community for African entrepreneurs to connect, share ideas, and grow together.', 'Business', 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg', FALSE, 200, 'u2'),
('group2', 'Tech Innovators', 'For technology enthusiasts and innovators across Africa.', 'Technology', 'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg', FALSE, 150, 'u3'),
('group3', 'Finance Masters', 'Discussion group for financial management and investment strategies.', 'Finance', 'https://images.pexels.com/photos/7681120/pexels-photo-7681120.jpeg', TRUE, 100, 'u3');

-- Sample group members
INSERT INTO group_members (id, group_id, user_id, role) VALUES
('gm1', 'group1', 'u1', 'member'),
('gm2', 'group1', 'u2', 'admin'),
('gm3', 'group1', 'u4', 'member'),
('gm4', 'group2', 'u3', 'admin'),
('gm5', 'group2', 'u1', 'member'),
('gm6', 'group3', 'u3', 'admin'),
('gm7', 'group3', 'u2', 'moderator');

-- Sample group messages
INSERT INTO group_messages (id, group_id, user_id, message, message_type) VALUES
('msg1', 'group1', 'u2', 'Welcome everyone to the Entrepreneurs Network! Let\'s build something amazing together.', 'text'),
('msg2', 'group1', 'u1', 'Excited to be part of this community! Anyone working on e-commerce projects?', 'text'),
('msg3', 'group1', 'u4', 'I\'m working on a fintech startup. Would love to connect with others in the space.', 'text'),
('msg4', 'group2', 'u3', 'Great discussion about AI in Africa. The opportunities are endless!', 'text'),
('msg5', 'group2', 'u1', 'Has anyone tried implementing blockchain solutions in their business?', 'text');

-- Sample audit logs
INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address) VALUES
('audit1', 'u1', 'login', 'user', 'u1', '{"method": "email", "success": true}', '192.168.1.100'),
('audit2', 'u2', 'create_course', 'course', 'course1', '{"title": "Business Fundamentals", "instructor": "inst1"}', '192.168.1.101'),
('audit3', 'u4', 'complete_course', 'course', 'course1', '{"courseTitle": "Business Fundamentals", "xpEarned": 500}', '192.168.1.102'),
('audit4', 'u3', 'join_group', 'community_group', 'group2', '{"groupName": "Tech Innovators"}', '192.168.1.103'),
('audit5', 'u2', 'update_profile', 'user', 'u2', '{"fields": ["job_title", "topics_of_interest"]}', '192.168.1.101');

-- Show sample queries
SELECT 'Database setup complete!' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_courses FROM courses;
SELECT COUNT(*) as total_lessons FROM lessons;
SELECT COUNT(*) as total_notifications FROM notifications;
SELECT COUNT(*) as total_groups FROM community_groups;
SELECT COUNT(*) as total_messages FROM group_messages;