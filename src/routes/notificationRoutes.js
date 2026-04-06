const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authmiddleware');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  createNotification
} = require('../controllers/notificationcontroller');

// Notifications
router.get('/', authMiddleware, getNotifications);
router.get('/unread-count', authMiddleware, getUnreadCount);
router.put('/:id/read', authMiddleware, markAsRead);
router.post('/', authMiddleware, createNotification);

module.exports = router;