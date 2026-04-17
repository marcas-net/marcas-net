import express from 'express';
import {
  getNotifications,
  readNotification,
  readAllNotifications,
  removeNotification,
} from '../controllers/notifications';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get user notifications with unread count
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Notifications array and unread count }
 */
router.get('/', authenticateToken, getNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a notification as read
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Notification marked as read }
 */
router.patch('/:id/read', authenticateToken, readNotification);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: All notifications marked as read }
 */
router.patch('/read-all', authenticateToken, readAllNotifications);
router.delete('/:id', authenticateToken, removeNotification);

export default router;
