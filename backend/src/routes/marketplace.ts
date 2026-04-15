import express from 'express';
import {
  getProducts, getProduct, getOrgProducts, createProduct, updateProduct,
  createBatch, getProductBatches,
  createSourcingRequest, getOrgSourcingRequests, updateSourcingStatus, getMySourcingRequests,
  createRecall, getOrgRecalls,
} from '../controllers/marketplace';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Products
router.get('/products', getProducts);
router.get('/products/:id', getProduct);
router.get('/products/org/:orgId', getOrgProducts);
router.post('/products', authenticateToken, createProduct);
router.put('/products/:id', authenticateToken, updateProduct);

// Batches
router.post('/batches', authenticateToken, createBatch);
router.get('/batches/product/:productId', authenticateToken, getProductBatches);

// Sourcing Requests
router.post('/sourcing', authenticateToken, createSourcingRequest);
router.get('/sourcing/mine', authenticateToken, getMySourcingRequests);
router.get('/sourcing/org/:orgId', authenticateToken, getOrgSourcingRequests);
router.put('/sourcing/:requestId/status', authenticateToken, updateSourcingStatus);

// Recalls
router.post('/recalls', authenticateToken, createRecall);
router.get('/recalls/org/:orgId', authenticateToken, getOrgRecalls);

export default router;
