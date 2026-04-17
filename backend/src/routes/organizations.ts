import express from 'express';
import {
  getOrganizations,
  getOrganization,
  getOrgMembers,
  inviteMember,
  createOrg,
  updateOrg,
  joinOrg,
  getDashboardStats,
  deleteOrg,
  removeMember,
  getOrgPosts,
} from '../controllers/organizations';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createOrgSchema, updateOrgSchema } from '../schemas/organization';
import { requireOrgRole, requireRole } from '../middleware/permissions';

const router = express.Router();

/**
 * @swagger
 * /api/orgs/dashboard-stats:
 *   get:
 *     tags: [Organizations]
 *     summary: Get dashboard statistics for current user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Dashboard stats (totalOrgs, userDocuments, orgDocuments, orgMembers) }
 */
router.get('/dashboard-stats', authenticateToken, getDashboardStats);

/**
 * @swagger
 * /api/orgs:
 *   get:
 *     tags: [Organizations]
 *     summary: List all organizations
 *     responses:
 *       200: { description: Array of organizations }
 */
router.get('/', getOrganizations);

/**
 * @swagger
 * /api/orgs/{id}:
 *   get:
 *     tags: [Organizations]
 *     summary: Get organization by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Organization details }
 *       404: { description: Not found }
 */
router.get('/:id', getOrganization);

/**
 * @swagger
 * /api/orgs/{id}/members:
 *   get:
 *     tags: [Organizations]
 *     summary: Get organization members
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Array of members }
 *       403: { description: Not a member }
 */
router.get('/:id/members', authenticateToken, getOrgMembers);

/**
 * @swagger
 * /api/orgs:
 *   post:
 *     tags: [Organizations]
 *     summary: Create a new organization
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type]
 *             properties:
 *               name: { type: string }
 *               type: { type: string, enum: [COMPANY, LABORATORY, UNIVERSITY, REGULATOR, PROFESSIONAL] }
 *               country: { type: string }
 *               description: { type: string }
 *     responses:
 *       201: { description: Organization created }
 */
router.post('/', authenticateToken, validate(createOrgSchema), createOrg);

/**
 * @swagger
 * /api/orgs/{id}:
 *   put:
 *     tags: [Organizations]
 *     summary: Update organization
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Organization updated }
 */
router.put('/:id', authenticateToken, validate(updateOrgSchema), updateOrg);

/**
 * @swagger
 * /api/orgs/{id}/join:
 *   post:
 *     tags: [Organizations]
 *     summary: Join an organization
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Joined organization }
 */
router.post('/:id/join', authenticateToken, joinOrg);

/**
 * @swagger
 * /api/orgs/{id}/invite:
 *   post:
 *     tags: [Organizations]
 *     summary: Invite a member to organization (requires ORG_ADMIN or ADMIN)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *               role: { type: string, enum: [ADMIN, ORG_ADMIN, USER, REGULATOR, LAB] }
 *     responses:
 *       201: { description: Invitation sent }
 *       403: { description: Insufficient permissions }
 */
router.post('/:id/invite', authenticateToken, requireOrgRole('ORG_ADMIN'), inviteMember);

router.delete('/:id', authenticateToken, requireOrgRole('ORG_ADMIN'), deleteOrg);
router.delete('/:id/members/:memberId', authenticateToken, requireOrgRole('ORG_ADMIN'), removeMember);
router.get('/:id/posts', getOrgPosts);

export default router;