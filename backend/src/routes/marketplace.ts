import express from 'express';
import { getProducts, getServices, createProduct, createService } from '../controllers/marketplace';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/products', getProducts);
router.get('/services', getServices);
router.post('/products', authenticateToken, createProduct);
router.post('/services', authenticateToken, createService);

export default router;
