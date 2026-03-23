import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getOrgDocuments,
  getDocument,
  searchDocuments,
  uploadDocument,
  downloadDocument,
  removeDocument,
} from '../controllers/documents';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(pdf|doc|docx|xls|xlsx)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Office documents are allowed'));
    }
  },
});

// Search with filters: ?organizationId=&fileType=&uploadedById=&fromDate=&toDate=
router.get('/', searchDocuments);

router.get('/org/:orgId', getOrgDocuments);
router.get('/:id', getDocument);
router.get('/:id/download', authenticateToken, downloadDocument);

// POST /api/documents/upload  (also keep POST / for backward compat)
router.post('/upload', authenticateToken, upload.single('file'), uploadDocument);
router.post('/', authenticateToken, upload.single('file'), uploadDocument);

router.delete('/:id', authenticateToken, removeDocument);

export default router;
