import express from 'express';
import { getInvitationByToken, acceptInvitation } from '../controllers/invitations';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/invitations/{token}:
 *   get:
 *     tags: [Invitations]
 *     summary: Get invitation details by token
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Invitation details with organization info }
 *       404: { description: Invitation not found }
 *       400: { description: Invitation expired or already used }
 */
router.get('/:token', getInvitationByToken);

/**
 * @swagger
 * /api/invitations/{token}/accept:
 *   post:
 *     tags: [Invitations]
 *     summary: Accept an invitation (must be logged in with matching email)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Successfully joined organization }
 *       403: { description: Email mismatch }
 *       400: { description: Invitation expired or already used }
 */
router.post('/:token/accept', authenticateToken, acceptInvitation);

export default router;
