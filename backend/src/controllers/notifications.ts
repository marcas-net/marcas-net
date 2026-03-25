import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../models/notification';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(req.user.id),
      getUnreadCount(req.user.id),
    ]);
    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const readNotification = async (req: AuthRequest, res: Response) => {
  try {
    await markAsRead(req.params['id'] as string, req.user.id);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Read notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const readAllNotifications = async (req: AuthRequest, res: Response) => {
  try {
    await markAllAsRead(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Read all notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
