import express from 'express';
import {
  getOrganizations,
  getOrganization,
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

// Protected — create, update, join
router.post('/', authenticateToken, validate(createOrgSchema), createOrg);
router.put('/:id', authenticateToken, validate(updateOrgSchema), updateOrg);
router.post('/:id/join', authenticateToken, joinOrg);

export default router;