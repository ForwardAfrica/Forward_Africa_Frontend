const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { executeQuery } = require('../lib/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Start video progress session
router.post('/sessions/start', authenticateToken, async (req, res) => {
  try {
    const { courseId, lessonId, deviceId, deviceType, browserInfo } = req.body;
    const sessionId = uuidv4();
    const id = uuidv4();

    await executeQuery(`
      INSERT INTO video_progress_sessions
      (id, user_id, course_id, lesson_id, session_id, device_id, device_type, browser_info)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, req.user.id, courseId, lessonId, sessionId, deviceId, deviceType, JSON.stringify(browserInfo)]);

    res.status(201).json({
      sessionId,
      message: 'Video session started successfully'
    });
  } catch (error) {
    console.error('Error starting video session:', error);
    res.status(500).json({ error: 'Failed to start video session' });
  }
});

// End video progress session
router.put('/sessions/:sessionId/end', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { totalWatchTime, engagementRate } = req.body;

    await executeQuery(`
      UPDATE video_progress_sessions
      SET end_time = NOW(), total_watch_time = ?, engagement_rate = ?
      WHERE session_id = ? AND user_id = ?
    `, [totalWatchTime, engagementRate, sessionId, req.user.id]);

    res.json({ message: 'Video session ended successfully' });
  } catch (error) {
    console.error('Error ending video session:', error);
    res.status(500).json({ error: 'Failed to end video session' });
  }
});

// Record video progress interval
router.post('/intervals', authenticateToken, async (req, res) => {
  try {
    const { sessionId, startTimeSeconds, endTimeSeconds, timeSpentSeconds, isActive, interactions } = req.body;
    const id = uuidv4();

    await executeQuery(`
      INSERT INTO video_progress_intervals
      (id, session_id, start_time_seconds, end_time_seconds, time_spent_seconds, is_active, interactions)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, sessionId, startTimeSeconds, endTimeSeconds, timeSpentSeconds, isActive, JSON.stringify(interactions)]);

    res.status(201).json({ message: 'Progress interval recorded successfully' });
  } catch (error) {
    console.error('Error recording progress interval:', error);
    res.status(500).json({ error: 'Failed to record progress interval' });
  }
});

// Update resume point
router.put('/resume-points', authenticateToken, async (req, res) => {
  try {
    const { courseId, lessonId, resumeTimeSeconds, bufferTimeSeconds, deviceId, sessionId } = req.body;
    const id = uuidv4();

    await executeQuery(`
      INSERT INTO video_resume_points
      (id, user_id, course_id, lesson_id, resume_time_seconds, buffer_time_seconds, device_id, session_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      resume_time_seconds = VALUES(resume_time_seconds),
      buffer_time_seconds = VALUES(buffer_time_seconds),
      device_id = VALUES(device_id),
      session_id = VALUES(session_id),
      updated_at = NOW()
    `, [id, req.user.id, courseId, lessonId, resumeTimeSeconds, bufferTimeSeconds, deviceId, sessionId]);

    res.json({ message: 'Resume point updated successfully' });
  } catch (error) {
    console.error('Error updating resume point:', error);
    res.status(500).json({ error: 'Failed to update resume point' });
  }
});

// Get resume point
router.get('/resume-points/:courseId/:lessonId', authenticateToken, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    const [resumePoint] = await executeQuery(`
      SELECT * FROM video_resume_points
      WHERE user_id = ? AND course_id = ? AND lesson_id = ?
    `, [req.user.id, courseId, lessonId]);

    res.json(resumePoint || { resumeTimeSeconds: 0, bufferTimeSeconds: 10 });
  } catch (error) {
    console.error('Error fetching resume point:', error);
    res.status(500).json({ error: 'Failed to fetch resume point' });
  }
});

// Get video analytics summary
router.get('/analytics/:courseId/:lessonId', authenticateToken, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    const [analytics] = await executeQuery(`
      SELECT * FROM video_analytics_summary
      WHERE user_id = ? AND course_id = ? AND lesson_id = ?
    `, [req.user.id, courseId, lessonId]);

    if (!analytics) {
      return res.json({
        totalSessions: 0,
        totalWatchTime: 0,
        averageSessionDuration: 0,
        completionRate: 0,
        engagementScore: 0
      });
    }

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching video analytics:', error);
    res.status(500).json({ error: 'Failed to fetch video analytics' });
  }
});

// Update video analytics summary
router.put('/analytics/:courseId/:lessonId', authenticateToken, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { totalSessions, totalWatchTime, averageSessionDuration, completionRate, engagementScore } = req.body;
    const id = uuidv4();

    await executeQuery(`
      INSERT INTO video_analytics_summary
      (id, user_id, course_id, lesson_id, total_sessions, total_watch_time, average_session_duration, completion_rate, engagement_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      total_sessions = VALUES(total_sessions),
      total_watch_time = VALUES(total_watch_time),
      average_session_duration = VALUES(average_session_duration),
      completion_rate = VALUES(completion_rate),
      engagement_score = VALUES(engagement_score),
      last_accessed = NOW(),
      updated_at = NOW()
    `, [id, req.user.id, courseId, lessonId, totalSessions, totalWatchTime, averageSessionDuration, completionRate, engagementScore]);

    res.json({ message: 'Video analytics updated successfully' });
  } catch (error) {
    console.error('Error updating video analytics:', error);
    res.status(500).json({ error: 'Failed to update video analytics' });
  }
});

module.exports = router;