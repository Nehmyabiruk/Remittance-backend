const pool = require("../db/db");

// Get notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 8;

    const result = await pool.query(
      `SELECT id, type, title, message, data, is_read, created_at 
       FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );

    res.json({
      success: true,
      notifications: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT COUNT(*) as unread_count 
       FROM notifications 
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    res.json({
      success: true,
      unreadCount: parseInt(result.rows[0].unread_count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Mark as read (single)
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = true, read_at = NOW() 
       WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true, message: "Notification marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// Create a new notification (POST /api/notifications)
exports.createNotification = async (req, res) => {
  try {
    const userId = req.user.id;                    // Current logged in user
    const { type, title, message, data = {} } = req.body;

    const result = await pool.query(
      `INSERT INTO notifications 
       (user_id, type, title, message, data, channels)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [userId, type, title, message, data, ['inapp']]
    );

    res.json({
      success: true,
      message: "Notification created",
      notificationId: result.rows[0].id
    });
  } catch (err) {
    console.error("Create notification error:", err);
    res.status(500).json({ success: false, message: "Failed to create notification" });
  }
};