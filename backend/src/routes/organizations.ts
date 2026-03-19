import express from 'express';
import {
  getOrganizations,
  getOrganization,
  createOrg,
  updateOrg,
  joinOrg,
} from '../controllers/organizations';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Public — list + view
router.get('/', getOrganizations);
router.get('/:id', getOrganization);

// Protected — create, update, join
router.post('/', authenticateToken, createOrg);
router.put('/:id', authenticateToken, updateOrg);
router.post('/:id/join', authenticateToken, joinOrg);

export default router;