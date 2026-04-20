import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getProducts, getProduct, getOrgProducts, createProduct, updateProduct,
  createBatch, getProductBatches,
  createSourcingRequest, getOrgSourcingRequests, updateSourcingStatus, getMySourcingRequests,
  createRecall, getOrgRecalls,
  uploadProductImages, deleteProductImage,
  getOrgSourcingActivity, getOrgAllocations,
} from '../controllers/marketplace';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// ─── Product image upload config ─────────────────────────
const mediaDir = path.join(__dirname, '../../uploads/media');
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

const imgStorage = multer.diskStorage({
  destination: mediaDir,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    let ext = path.extname(file.originalname);
    if (!ext || ext === '.') {
      const mimeMap: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp' };
      ext = mimeMap[file.mimetype] || '.bin';
    }
    cb(null, `${unique}${ext}`);
  },
});

const imgUpload = multer({
  storage: imgStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowedMime = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMime.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
  },
});

// Products
router.get('/products', getProducts);
router.get('/products/:id', getProduct);
router.get('/products/org/:orgId', getOrgProducts);
router.post('/products', authenticateToken, createProduct);
router.put('/products/:id', authenticateToken, updateProduct);

// Product Images
router.post('/products/:id/images', authenticateToken, imgUpload.array('images', 8), uploadProductImages);
router.delete('/products/:id/images/:imageId', authenticateToken, deleteProductImage);

// Batches
router.post('/batches', authenticateToken, createBatch);
router.get('/batches/product/:productId', authenticateToken, getProductBatches);

// Sourcing Requests
router.post('/sourcing', authenticateToken, createSourcingRequest);
router.get('/sourcing/mine', authenticateToken, getMySourcingRequests);
router.get('/sourcing/org/:orgId', authenticateToken, getOrgSourcingRequests);
router.put('/sourcing/:requestId/status', authenticateToken, updateSourcingStatus);

// Allocations
router.get('/allocations/org/:orgId', authenticateToken, getOrgAllocations);

// Activity
router.get('/activity/org/:orgId', getOrgSourcingActivity);

// Recalls
router.post('/recalls', authenticateToken, createRecall);
router.get('/recalls/org/:orgId', authenticateToken, getOrgRecalls);

export default router;
