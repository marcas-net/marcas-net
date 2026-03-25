import prisma from '../config/database';
import { NotificationType } from '@prisma/client';

export const createNotification = async (data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) => {
  return await prisma.notification.create({ data });
};

export const getUserNotifications = async (userId: string, limit = 20) => {
  return await prisma.notification.findMany({
    where: { userId },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
};

export const getUnreadCount = async (userId: string) => {
  return await prisma.notification.count({
    where: { userId, isRead: false },
  });
};

export const markAsRead = async (id: string, userId: string) => {
  return await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
};

export const markAllAsRead = async (userId: string) => {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};
