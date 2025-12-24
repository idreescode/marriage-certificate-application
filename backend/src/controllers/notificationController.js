const { pool } = require('../config/database');

// Get Notifications
const getNotifications = async (req, res) => {
  try {
    const { role } = req.user; 
    let query = '';
    let params = [];

    if (role === 'admin') {
      // Admins see all admin notifications
      query = `SELECT * FROM notifications WHERE role = 'admin' ORDER BY created_at DESC LIMIT 50`;
    } else {
      // Applicants see only their own notifications
      // Linking via application_id which should be in req.user.id for applicants
      query = `SELECT * FROM notifications WHERE role = 'applicant' AND application_id = ? ORDER BY created_at DESC LIMIT 50`;
      params = [req.user.id];
    }

    const [notifications] = await pool.execute(query, params);

    // Get unread count
    let countQuery = '';
    if (role === 'admin') {
      countQuery = `SELECT COUNT(*) as count FROM notifications WHERE role = 'admin' AND is_read = FALSE`;
    } else {
      countQuery = `SELECT COUNT(*) as count FROM notifications WHERE role = 'applicant' AND application_id = ? AND is_read = FALSE`;
    }
    const [countRows] = await pool.execute(countQuery, params);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount: countRows[0].count
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

// Mark as Read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};

// Mark All as Read
const markAllAsRead = async (req, res) => {
  try {
    const { role } = req.user;
    let query = '';
    let params = [];

    if (role === 'admin') {
      query = `UPDATE notifications SET is_read = TRUE WHERE role = 'admin' AND is_read = FALSE`;
    } else {
      query = `UPDATE notifications SET is_read = TRUE WHERE role = 'applicant' AND application_id = ? AND is_read = FALSE`;
      params = [req.user.id];
    }

    await pool.execute(query, params);
    res.json({ success: true, message: 'All marked as read' });

  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
};

// Internal Helper to Create Notification
const createNotification = async ({ applicationId, role, type, title, message }) => {
  try {
    await pool.execute(
      `INSERT INTO notifications (application_id, role, type, title, message) VALUES (?, ?, ?, ?, ?)`,
      [applicationId, role, type, title, message]
    );
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification
};
