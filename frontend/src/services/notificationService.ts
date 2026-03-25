import api from './api';

export interface Notification {
  id: string;
  userId: string;
  type: 'INVITATION' | 'DOCUMENT' | 'ORGANIZATION' | 'SYSTEM';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export const getNotifications = async (): Promise<{ notifications: Notification[]; unreadCount: number }> => {
  const res = await api.get('/notifications');
  return res.data;
};

export const markNotificationRead = async (id: string): Promise<void> => {
  await api.patch(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await api.patch('/notifications/read-all');
};
