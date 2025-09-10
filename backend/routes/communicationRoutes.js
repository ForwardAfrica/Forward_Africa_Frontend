const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { rateLimiters } = require('../middleware/rateLimiter');
const { apiResponseMiddleware } = require('../middleware/apiResponse');

// Database connection
const getConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'forwardafrica_db'
  });
};

// ==================== ANNOUNCEMENTS ====================

// Get all announcements
router.get('/announcements', authenticateToken, authorizeRole(['super_admin', 'content_manager']), async (req, res) => {
  try {
    const connection = await getConnection();
    const { page = 1, limit = 10, status, audience } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND a.status = ?';
      params.push(status);
    }

    if (audience) {
      whereClause += ' AND a.audience = ?';
      params.push(audience);
    }

    const query = `
      SELECT a.*, u.full_name as created_by_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [announcements] = await connection.execute(query, [...params, parseInt(limit), offset]);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM announcements a ${whereClause}`;
    const [countResult] = await connection.execute(countQuery, params);
    const total = countResult[0].total;

    await connection.end();

    res.apiSuccess({
      announcements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.apiError('Failed to fetch announcements', 'FETCH_ERROR', null, 500);
  }
});

// Create new announcement
router.post('/announcements', authenticateToken, authorizeRole(['super_admin']), rateLimiters.api, async (req, res) => {
  try {
    const { title, content, audience, status, expires_at } = req.body;
    const created_by = req.user.id;

    if (!title || !content) {
      return res.apiError('Title and content are required', 'VALIDATION_ERROR', null, 400);
    }

    const connection = await getConnection();

    const query = `
      INSERT INTO announcements (title, content, audience, status, created_by, expires_at, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const published_at = status === 'published' ? new Date() : null;

    const [result] = await connection.execute(query, [
      title, content, audience || 'all', status || 'draft',
      created_by, expires_at, published_at
    ]);

    await connection.end();

    res.apiSuccess({
      message: 'Announcement created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.apiError('Failed to create announcement', 'CREATE_ERROR', null, 500);
  }
});

// Update announcement
router.put('/announcements/:id', authenticateToken, authorizeRole(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, audience, status, expires_at } = req.body;

    const connection = await getConnection();

    const query = `
      UPDATE announcements
      SET title = ?, content = ?, audience = ?, status = ?, expires_at = ?,
          published_at = CASE WHEN status = 'published' AND published_at IS NULL THEN NOW() ELSE published_at END,
          updated_at = NOW()
      WHERE id = ?
    `;

    await connection.execute(query, [title, content, audience, status, expires_at, id]);
    await connection.end();

    res.apiSuccess({ message: 'Announcement updated successfully' });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.apiError('Failed to update announcement', 'UPDATE_ERROR', null, 500);
  }
});

// Delete announcement
router.delete('/announcements/:id', authenticateToken, authorizeRole(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await getConnection();

    await connection.execute('DELETE FROM announcements WHERE id = ?', [id]);
    await connection.end();

    res.apiSuccess({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.apiError('Failed to delete announcement', 'DELETE_ERROR', null, 500);
  }
});

// ==================== EMAIL CAMPAIGNS ====================

// Get all email campaigns
router.get('/email-campaigns', authenticateToken, authorizeRole(['super_admin']), async (req, res) => {
  try {
    const connection = await getConnection();
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND ec.status = ?';
      params.push(status);
    }

    const query = `
      SELECT ec.*, u.full_name as created_by_name
      FROM email_campaigns ec
      LEFT JOIN users u ON ec.created_by = u.id
      ${whereClause}
      ORDER BY ec.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [campaigns] = await connection.execute(query, [...params, parseInt(limit), offset]);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM email_campaigns ec ${whereClause}`;
    const [countResult] = await connection.execute(countQuery, params);
    const total = countResult[0].total;

    await connection.end();

    res.apiSuccess({
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching email campaigns:', error);
    res.apiError('Failed to fetch email campaigns', 'FETCH_ERROR', null, 500);
  }
});

// Create new email campaign
router.post('/email-campaigns', authenticateToken, authorizeRole(['super_admin']), rateLimiters.api, async (req, res) => {
  try {
    const { name, subject, content, audience, custom_audience_ids, scheduled_at } = req.body;
    const created_by = req.user.id;

    if (!name || !subject || !content) {
      return res.apiError('Name, subject, and content are required', 'ERROR', null, 400);
    }

    const connection = await getConnection();

    const query = `
      INSERT INTO email_campaigns (name, subject, content, audience, custom_audience_ids, scheduled_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(query, [
      name, subject, content, audience || 'all',
      custom_audience_ids ? JSON.stringify(custom_audience_ids) : null,
      scheduled_at, created_by
    ]);

    await connection.end();

    res.apiSuccess({
      message: 'Email campaign created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating email campaign:', error);
    res.apiError('Failed to create email campaign', 'ERROR', null, 500);
  }
});

// Send email campaign
router.post('/email-campaigns/:id/send', authenticateToken, authorizeRole(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await getConnection();

    // Get campaign details
    const [campaigns] = await connection.execute(
      'SELECT * FROM email_campaigns WHERE id = ?',
      [id]
    );

    if (campaigns.length === 0) {
      await connection.end();
      return res.apiError('Campaign not found', 'ERROR', null, 404);
    }

    const campaign = campaigns[0];

    // Get recipients based on audience
    let recipients = [];
    if (campaign.audience === 'all') {
      const [users] = await connection.execute('SELECT id, email, full_name FROM users WHERE is_active = 1');
      recipients = users;
    } else if (campaign.audience === 'custom' && campaign.custom_audience_ids) {
      const audienceIds = JSON.parse(campaign.custom_audience_ids);
      const [users] = await connection.execute(
        'SELECT id, email, full_name FROM users WHERE id IN (?) AND is_active = 1',
        [audienceIds]
      );
      recipients = users;
    }

    // Update campaign status
    await connection.execute(
      'UPDATE email_campaigns SET status = "sending", total_recipients = ? WHERE id = ?',
      [recipients.length, id]
    );

    // Create delivery records
    const deliveryValues = recipients.map(user => [id, 'email', user.id, 'pending']).join(',');
    if (deliveryValues) {
      await connection.execute(`
        INSERT INTO notification_deliveries (notification_id, notification_type, user_id, status)
        VALUES ${deliveryValues}
      `);
    }

    await connection.end();

    // TODO: Implement actual email sending logic here
    // For now, we'll just mark as sent
    setTimeout(async () => {
      const conn = await getConnection();
      await conn.execute(
        'UPDATE email_campaigns SET status = "sent", sent_at = NOW() WHERE id = ?',
        [id]
      );
      await conn.end();
    }, 1000);

    res.apiSuccess({
      message: 'Email campaign queued for sending',
      recipients_count: recipients.length
    });
  } catch (error) {
    console.error('Error sending email campaign:', error);
    res.apiError('Failed to send email campaign', 'ERROR', null, 500);
  }
});

// ==================== PUSH NOTIFICATIONS ====================

// Get all push notifications
router.get('/push-notifications', authenticateToken, authorizeRole(['super_admin']), async (req, res) => {
  try {
    const connection = await getConnection();
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND pn.status = ?';
      params.push(status);
    }

    const query = `
      SELECT pn.*, u.full_name as created_by_name
      FROM push_notifications pn
      LEFT JOIN users u ON pn.created_by = u.id
      ${whereClause}
      ORDER BY pn.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [notifications] = await connection.execute(query, [...params, parseInt(limit), offset]);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM push_notifications pn ${whereClause}`;
    const [countResult] = await connection.execute(countQuery, params);
    const total = countResult[0].total;

    await connection.end();

    res.apiSuccess({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching push notifications:', error);
    res.apiError('Failed to fetch push notifications', 'ERROR', null, 500);
  }
});

// Create new push notification
router.post('/push-notifications', authenticateToken, authorizeRole(['super_admin']), rateLimiters.api, async (req, res) => {
  try {
    const { title, message, audience, custom_audience_ids, scheduled_at } = req.body;
    const created_by = req.user.id;

    if (!title || !message) {
      return res.apiError('Title and message are required', 'ERROR', null, 400);
    }

    const connection = await getConnection();

    const query = `
      INSERT INTO push_notifications (title, message, audience, custom_audience_ids, scheduled_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(query, [
      title, message, audience || 'all',
      custom_audience_ids ? JSON.stringify(custom_audience_ids) : null,
      scheduled_at, created_by
    ]);

    await connection.end();

    res.apiSuccess({
      message: 'Push notification created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating push notification:', error);
    res.apiError('Failed to create push notification', 'ERROR', null, 500);
  }
});

// Send push notification
router.post('/push-notifications/:id/send', authenticateToken, authorizeRole(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await getConnection();

    // Get notification details
    const [notifications] = await connection.execute(
      'SELECT * FROM push_notifications WHERE id = ?',
      [id]
    );

    if (notifications.length === 0) {
      await connection.end();
      return res.apiError('Notification not found', 'ERROR', null, 404);
    }

    const notification = notifications[0];

    // Get recipients based on audience
    let recipients = [];
    if (notification.audience === 'all') {
      const [users] = await connection.execute('SELECT id, email, full_name FROM users WHERE is_active = 1');
      recipients = users;
    } else if (notification.audience === 'custom' && notification.custom_audience_ids) {
      const audienceIds = JSON.parse(notification.custom_audience_ids);
      const [users] = await connection.execute(
        'SELECT id, email, full_name FROM users WHERE id IN (?) AND is_active = 1',
        [audienceIds]
      );
      recipients = users;
    }

    // Update notification status
    await connection.execute(
      'UPDATE push_notifications SET status = "sent", sent_at = NOW(), total_recipients = ? WHERE id = ?',
      [recipients.length, id]
    );

    // Create delivery records
    const deliveryValues = recipients.map(user => [id, 'push', user.id, 'pending']).join(',');
    if (deliveryValues) {
      await connection.execute(`
        INSERT INTO notification_deliveries (notification_id, notification_type, user_id, status)
        VALUES ${deliveryValues}
      `);
    }

    await connection.end();

    // TODO: Implement actual push notification sending logic here
    // For now, we'll just mark as sent
    setTimeout(async () => {
      const conn = await getConnection();
      await conn.execute(
        'UPDATE push_notifications SET delivered_count = total_recipients WHERE id = ?',
        [id]
      );
      await conn.end();
    }, 1000);

    res.apiSuccess({
      message: 'Push notification sent successfully',
      recipients_count: recipients.length
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    res.apiError('Failed to send push notification', 'ERROR', null, 500);
  }
});

// ==================== EMAIL TEMPLATES ====================

// Get all email templates
router.get('/email-templates', authenticateToken, authorizeRole(['super_admin']), async (req, res) => {
  try {
    const connection = await getConnection();

    const query = `
      SELECT et.*, u.full_name as created_by_name
      FROM email_templates et
      LEFT JOIN users u ON et.created_by = u.id
      ORDER BY et.created_at DESC
    `;

    const [templates] = await connection.execute(query);
    await connection.end();

    res.apiSuccess({ templates });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.apiError('Failed to fetch email templates', 'ERROR', null, 500);
  }
});

// Create new email template
router.post('/email-templates', authenticateToken, authorizeRole(['super_admin']), async (req, res) => {
  try {
    const { name, subject, content, variables, is_default } = req.body;
    const created_by = req.user.id;

    if (!name || !subject || !content) {
      return res.apiError('Name, subject, and content are required', 'ERROR', null, 400);
    }

    const connection = await getConnection();

    const query = `
      INSERT INTO email_templates (name, subject, content, variables, is_default, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(query, [
      name, subject, content,
      variables ? JSON.stringify(variables) : null,
      is_default || false, created_by
    ]);

    await connection.end();

    res.apiSuccess({
      message: 'Email template created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating email template:', error);
    res.apiError('Failed to create email template', 'ERROR', null, 500);
  }
});

// ==================== COMMUNICATION SETTINGS ====================

// Get communication settings
router.get('/settings', authenticateToken, authorizeRole(['super_admin']), async (req, res) => {
  try {
    const connection = await getConnection();

    const [settings] = await connection.execute('SELECT * FROM communication_settings');
    await connection.end();

    // Convert to key-value object
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });

    res.apiSuccess({ settings: settingsObj });
  } catch (error) {
    console.error('Error fetching communication settings:', error);
    res.apiError('Failed to fetch communication settings', 'ERROR', null, 500);
  }
});

// Update communication settings
router.put('/settings', authenticateToken, authorizeRole(['super_admin']), async (req, res) => {
  try {
    const settings = req.body;
    const updated_by = req.user.id;
    const connection = await getConnection();

    for (const [key, value] of Object.entries(settings)) {
      await connection.execute(
        'UPDATE communication_settings SET setting_value = ?, updated_by = ?, updated_at = NOW() WHERE setting_key = ?',
        [value, updated_by, key]
      );
    }

    await connection.end();

    res.apiSuccess({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating communication settings:', error);
    res.apiError('Failed to update communication settings', 'ERROR', null, 500);
  }
});

// ==================== ANALYTICS ====================

// Get communication analytics
router.get('/analytics', authenticateToken, authorizeRole(['super_admin']), async (req, res) => {
  try {
    const connection = await getConnection();

    // Get counts
    const [announcementCount] = await connection.execute('SELECT COUNT(*) as count FROM announcements');
    const [emailCount] = await connection.execute('SELECT COUNT(*) as count FROM email_campaigns');
    const [notificationCount] = await connection.execute('SELECT COUNT(*) as count FROM push_notifications');

    // Get delivery statistics
    const [deliveryStats] = await connection.execute(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'opened' THEN 1 ELSE 0 END) as opened,
        SUM(CASE WHEN status = 'clicked' THEN 1 ELSE 0 END) as clicked
      FROM notification_deliveries
    `);

    await connection.end();

    const stats = deliveryStats[0];
    const analytics = {
      total_announcements: announcementCount[0].count,
      total_emails: emailCount[0].count,
      total_notifications: notificationCount[0].count,
      delivery_rate: stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(1) : 0,
      open_rate: stats.delivered > 0 ? ((stats.opened / stats.delivered) * 100).toFixed(1) : 0,
      click_rate: stats.opened > 0 ? ((stats.clicked / stats.opened) * 100).toFixed(1) : 0
    };

    res.apiSuccess({ analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.apiError('Failed to fetch analytics', 'ERROR', null, 500);
  }
});

module.exports = router;