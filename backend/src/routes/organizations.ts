import express from 'express';
import {
  getOrganizations,
  getOrganization,
  getOrgMembers,
  inviteMember,
  createOrg,
  updateOrg,
  joinOrg,
} from '../controllers/organizations';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createOrgSchema, updateOrgSchema } from '../schemas/organization';

const router = express.Router();

// Public — list + view
router.get('/', getOrganizations);
router.get('/:id', getOrganization);

// Members — protected, must be a member
router.get('/:id/members', authenticateToken, getOrgMembers);

// Protected — create, update, join, invite
router.post('/', authenticateToken, validate(createOrgSchema), createOrg);
router.put('/:id', authenticateToken, validate(updateOrgSchema), updateOrg);
router.post('/:id/join', authenticateToken, joinOrg);
router.post('/:id/invite', authenticateToken, inviteMember);

export default router;