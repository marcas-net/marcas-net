import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getOrgDocuments,
  getDocument,
  uploadDocument,
  removeDocument,
} from '../controllers/documents';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(pdf|doc|docx|xls|xlsx|png|jpg|jpeg)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, Office documents, and images are allowed'));
    }
  },
});

router.get('/org/:orgId', getOrgDocuments);
router.get('/:id', getDocument);
router.post('/', authenticateToken, upload.single('file'), uploadDocument);
router.delete('/:id', authenticateToken, removeDocument);

export default router;
