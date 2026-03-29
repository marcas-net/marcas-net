import express from 'express';
import { getAdminAuditLogs } from '../controllers/admin';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/permissions';

const router = express.Router();

/**
 * @swagger
 * /api/admin/audit-logs:
 *   get:
 *     tags: [Admin]
 *     summary: Get audit logs (admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *       - in: query
 *         name: fromDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: toDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200: { description: Paginated audit logs }
 *       403: { description: Admin access required }
 */
router.get('/audit-logs', authenticateToken, requireRole('ADMIN'), getAdminAuditLogs);

export default router;
