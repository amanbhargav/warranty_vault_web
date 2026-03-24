import { create } from 'zustand';
import { notificationsAPI } from '../services/api';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  },

  // Fetch notifications
  fetchNotifications: async (params = {}) => {
    set({ loading: true });
    try {
      const response = await notificationsAPI.getAll(params);
      const { notifications, pagination, unread_count } = response.data;
      
      set({ 
        notifications, 
        unreadCount: unread_count,
        pagination,
        loading: false 
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ loading: false });
    }
  },

  // Mark as read
  markAsRead: async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  // Mark all as read
  markAllAsRead: async () => {
    try {
      await notificationsAPI.markAllAsRead();

      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      // Handle 404 or other errors gracefully
      console.log('Mark all as read API not available');
      
      // Fallback: update local state only
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    }
  },

  // Delete notification
  deleteNotification: async (id) => {
    try {
      await notificationsAPI.delete(id);
      
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: state.unreadCount,
      }));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  },

  // Clear all
  clearAll: async () => {
    try {
      await notificationsAPI.clearAll();
      set({ notifications: [], unreadCount: 0 });
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  },
}));

export default useNotificationStore;
