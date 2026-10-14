const prisma = require('../config/prisma');

async function getMyNotifications(req, res) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    return res.json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: err.message });
  }
}

async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    await prisma.notification.updateMany({
      where: { id, userId: req.user.id },
      data: { isRead: true },
    });
    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update notification', error: err.message });
  }
}

async function markAllAsRead(req, res) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update notifications', error: err.message });
  }
}

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
