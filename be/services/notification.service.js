const Notification = require('../models/notification.model');

const createNotification = async ({ userId, type, title, message, link = '', relatedId = null }) => {
  return Notification.create({ userId, type, title, message, link, relatedId });
};

const getNotifications = async (userId) => {
  return Notification.find({ userId }).sort({ createdAt: -1 }).limit(30);
};

const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ userId, isRead: false });
};

const markAsRead = async (id, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { isRead: true },
    { new: true }
  );
  return notification;
};

const markAllAsRead = async (userId) => {
  return Notification.updateMany({ userId, isRead: false }, { isRead: true });
};

module.exports = {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
