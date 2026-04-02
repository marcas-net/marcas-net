import express from 'express';
import {
  getProducts, getOrgProducts, createProduct,
  createSourcingRequest, getOrgSourcingRequests, updateSourcingStatus, getMySourcingRequests,
} from '../controllers/marketplace';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Products
router.get('/products', getProducts);
router.get('/products/org/:orgId', getOrgProducts);
router.post('/products', authenticateToken, createProduct);

// Sourcing
router.post('/sourcing', authenticateToken, createSourcingRequest);
router.get('/sourcing/mine', authenticateToken, getMySourcingRequests);
router.get('/sourcing/org/:orgId', authenticateToken, getOrgSourcingRequests);
router.put('/sourcing/:requestId/status', authenticateToken, updateSourcingStatus);

export default router;
