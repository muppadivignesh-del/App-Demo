import api from './api';

export const notificationAPI = {
  getNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      if (response.data?.data?.notifications) {
        const notifs = response.data.data.notifications;
        localStorage.setItem('agri_notifications', JSON.stringify(notifs));
        return { data: { data: { notifications: notifs, unreadCount: response.data.data.unreadCount } } };
      }
    } catch (err) {
      console.warn('Backend unavailable, reading notifications from localStorage.');
    }

    const raw = localStorage.getItem('agri_notifications');
    const notifs = raw ? JSON.parse(raw) : [];
    return { data: { data: { notifications: notifs, unreadCount: notifs.filter((n) => !n.isRead).length } } };
  },

  markAsRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
    } catch (err) {
      console.warn('Backend unavailable, marking notification as read locally.');
    }

    const raw = localStorage.getItem('agri_notifications');
    const notifs = raw ? JSON.parse(raw) : [];
    const updated = notifs.map((n) => (String(n.id) === String(id) || String(n._id) === String(id) ? { ...n, isRead: true } : n));
    localStorage.setItem('agri_notifications', JSON.stringify(updated));
    return { data: { success: true } };
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notifications/read-all');
    } catch (err) {}

    const raw = localStorage.getItem('agri_notifications');
    const notifs = raw ? JSON.parse(raw) : [];
    const updated = notifs.map((n) => ({ ...n, isRead: true }));
    localStorage.setItem('agri_notifications', JSON.stringify(updated));
    return { data: { success: true } };
  },

  clearRead: async () => {
    try {
      await api.delete('/notifications/clear');
    } catch (err) {}

    const raw = localStorage.getItem('agri_notifications');
    const notifs = raw ? JSON.parse(raw) : [];
    const updated = notifs.filter((n) => !n.isRead);
    localStorage.setItem('agri_notifications', JSON.stringify(updated));
    return { data: { success: true } };
  },

  dismissNotification: async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
    } catch (err) {}

    const raw = localStorage.getItem('agri_notifications');
    const notifs = raw ? JSON.parse(raw) : [];
    const updated = notifs.filter((n) => String(n.id) !== String(id) && String(n._id) !== String(id));
    localStorage.setItem('agri_notifications', JSON.stringify(updated));
    return { data: { success: true } };
  },
};
