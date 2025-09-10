-- Add lessons for course 77 (Technology Innovation Strategies)
-- This will fix the URL issue where course 77 has no lessons

USE forward_africa_db;

-- Add lessons for course 77
INSERT INTO lessons (id, course_id, title, duration, thumbnail, video_url, description, xp_points, order_index) VALUES
-- Course 77 Lessons (Technology Innovation Strategies)
('lesson77_1', '77', 'Introduction to Technology Innovation', '25:30', 'https://images.pexels.com/photos/3861960/pexels-photo-3861960.jpeg', 'https://www.youtube.com/watch?v=8jPQjjsBbIc', 'Learn the fundamentals of technology innovation and its impact on modern business.', 100, 1),
('lesson77_2', '77', 'Innovation Strategy Development', '32:15', 'https://images.pexels.com/photos/3861961/pexels-photo-3861961.jpeg', 'https://www.youtube.com/watch?v=9bZkp7q19f0', 'Develop comprehensive innovation strategies that drive business growth and competitive advantage.', 120, 2),
('lesson77_3', '77', 'Digital Transformation', '28:45', 'https://images.pexels.com/photos/3861962/pexels-photo-3861962.jpeg', 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', 'Understand the principles of digital transformation and how to implement them effectively.', 110, 3),
('lesson77_4', '77', 'Emerging Technologies', '35:20', 'https://images.pexels.com/photos/3861963/pexels-photo-3861963.jpeg', 'https://www.youtube.com/watch?v=L_jWHffIx5E', 'Explore cutting-edge technologies and their potential applications in business.', 130, 4),
('lesson77_5', '77', 'Innovation Leadership', '40:10', 'https://images.pexels.com/photos/3861964/pexels-photo-3861964.jpeg', 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ', 'Learn how to lead innovation initiatives and build innovative teams.', 140, 5);

-- Verify the lessons were added
SELECT c.title as course_title, l.title as lesson_title, l.id as lesson_id, l.order_index
FROM courses c
JOIN lessons l ON c.id = l.course_id
WHERE c.id = '77'
ORDER BY l.order_index;