import axiosClient from '../api/axiosClient';

const notificationService = {
  getMyNotifications: () => axiosClient.get('/api/notifications'),

  markAsRead: (id) => axiosClient.put(`/api/notifications/${id}/read`),

  markAllAsRead: () => axiosClient.put('/api/notifications/read-all'),
};

export default notificationService;
