import express from 'express';
import { globalSearch } from '../controllers/search';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/search:
 *   get:
 *     tags: [Search]
 *     summary: Global search across organizations, documents, and users
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *         description: Search query (minimum 2 characters)
 *     responses:
 *       200: { description: Search results grouped by type }
 */
router.get('/', authenticateToken, globalSearch);

export default router;
