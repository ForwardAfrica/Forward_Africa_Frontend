-- Enhanced Video Progress Tracking Tables

-- User Engagement Metrics Table
CREATE TABLE user_engagement_metrics (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    daily_active_minutes INT DEFAULT 0,
    courses_accessed JSON,
    lessons_completed INT DEFAULT 0,
    pages_visited INT DEFAULT 0,
    login_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, date)
);

-- Video Progress Sessions
CREATE TABLE video_progress_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    course_id VARCHAR(36) NOT NULL,
    lesson_id VARCHAR(36) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    device_id VARCHAR(100),
    device_type VARCHAR(50) DEFAULT 'desktop',
    browser_info JSON,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    total_watch_time INT DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

-- Video Progress Intervals (30-second granular tracking)
CREATE TABLE video_progress_intervals (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    start_time_seconds INT NOT NULL,
    end_time_seconds INT NOT NULL,
    time_spent_seconds INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    interactions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES video_progress_sessions(id) ON DELETE CASCADE
);

-- Video Resume Points (Smart Resume functionality)
CREATE TABLE video_resume_points (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    course_id VARCHAR(36) NOT NULL,
    lesson_id VARCHAR(36) NOT NULL,
    resume_time_seconds INT NOT NULL,
    buffer_time_seconds INT DEFAULT 10,
    device_id VARCHAR(100),
    session_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_lesson (user_id, course_id, lesson_id)
);

-- Enhanced User Progress with Video Tracking
ALTER TABLE user_progress
ADD COLUMN video_sessions_count INT DEFAULT 0,
ADD COLUMN total_watch_time INT DEFAULT 0,
ADD COLUMN last_video_progress DECIMAL(5,2) DEFAULT 0,
ADD COLUMN engagement_score DECIMAL(5,2) DEFAULT 0,
ADD COLUMN completion_date TIMESTAMP NULL;

-- Video Analytics Summary
CREATE TABLE video_analytics_summary (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    course_id VARCHAR(36) NOT NULL,
    lesson_id VARCHAR(36) NOT NULL,
    total_sessions INT DEFAULT 0,
    total_watch_time INT DEFAULT 0,
    average_session_duration INT DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    engagement_score DECIMAL(5,2) DEFAULT 0,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_lesson_analytics (user_id, course_id, lesson_id)
);

-- Indexes for Performance
CREATE INDEX idx_video_sessions_user ON video_progress_sessions(user_id);
CREATE INDEX idx_video_sessions_course ON video_progress_sessions(course_id);
CREATE INDEX idx_video_sessions_lesson ON video_progress_sessions(lesson_id);
CREATE INDEX idx_video_intervals_session ON video_progress_intervals(session_id);
CREATE INDEX idx_video_resume_user ON video_resume_points(user_id);
CREATE INDEX idx_video_resume_lesson ON video_resume_points(lesson_id);
CREATE INDEX idx_video_analytics_user ON video_analytics_summary(user_id);
CREATE INDEX idx_video_analytics_course ON video_analytics_summary(course_id);