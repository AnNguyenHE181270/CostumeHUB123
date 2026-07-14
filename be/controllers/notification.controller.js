const notificationService = require('../services/notification.service');
const HttpError = require('../models/http-error.model');

const getMyNotifications = async (req, res, next) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      notificationService.getNotifications(req.userData.id),
      notificationService.getUnreadCount(req.userData.id),
    ]);
    res.status(200).json({ notifications, unreadCount });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Fetching notifications failed', 500));
  }
};

const markRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.userData.id);
    if (!notification) throw new HttpError('Notification not found', 404);
    res.status(200).json({ notification });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Marking notification failed', 500));
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.userData.id);
    res.status(200).json({ message: 'Đã đánh dấu tất cả thông báo là đã đọc' });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Marking all notifications failed', 500));
  }
};

module.exports = { getMyNotifications, markRead, markAllRead };
