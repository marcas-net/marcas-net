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
  getDocumentVersions,
  getSignedDownloadUrl,
  downloadWithSignedUrl,
} from '../controllers/documents';
import { authenticateToken } from '../middleware/auth';
import { requireOrgMembership } from '../middleware/permissions';

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

/**
 * @swagger
 * /api/docs:
 *   get:
 *     tags: [Documents]
 *     summary: Search documents with filters
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         schema: { type: string }
 *       - in: query
 *         name: fileType
 *         schema: { type: string }
 *       - in: query
 *         name: uploadedById
 *         schema: { type: string }
 *       - in: query
 *         name: fromDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: toDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Filtered documents array }
 */
router.get('/', searchDocuments);

/**
 * @swagger
 * /api/docs/org/{orgId}:
 *   get:
 *     tags: [Documents]
 *     summary: Get all documents for an organization
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Organization documents }
 */
router.get('/org/:orgId', getOrgDocuments);

/**
 * @swagger
 * /api/docs/signed-download/{id}:
 *   get:
 *     tags: [Documents]
 *     summary: Download document using a signed URL
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: expires
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: signature
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: File download }
 *       403: { description: Invalid or expired signature }
 */
router.get('/signed-download/:id', downloadWithSignedUrl);

/**
 * @swagger
 * /api/docs/{id}:
 *   get:
 *     tags: [Documents]
 *     summary: Get document by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Document details }
 *       404: { description: Not found }
 */
router.get('/:id', getDocument);

/**
 * @swagger
 * /api/docs/{id}/download:
 *   get:
 *     tags: [Documents]
 *     summary: Download document (requires org membership)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: File download }
 *       403: { description: Not an org member }
 */
router.get('/:id/download', authenticateToken, downloadDocument);

/**
 * @swagger
 * /api/docs/{id}/signed-url:
 *   get:
 *     tags: [Documents]
 *     summary: Get a temporary signed download URL (30 min)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Signed URL }
 *       403: { description: Not an org member }
 */
router.get('/:id/signed-url', authenticateToken, getSignedDownloadUrl);

/**
 * @swagger
 * /api/docs/{id}/versions:
 *   get:
 *     tags: [Documents]
 *     summary: Get version history for a document
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Array of document versions }
 */
router.get('/:id/versions', getDocumentVersions);

/**
 * @swagger
 * /api/docs/upload:
 *   post:
 *     tags: [Documents]
 *     summary: Upload a document (supports versioning via parentDocumentId)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, organizationId, file]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               organizationId: { type: string }
 *               parentDocumentId: { type: string, description: ID of parent document for versioning }
 *               file: { type: string, format: binary }
 *     responses:
 *       201: { description: Document uploaded }
 *       400: { description: Missing required fields }
 */
router.post('/upload', authenticateToken, upload.single('file'), uploadDocument);
router.post('/', authenticateToken, upload.single('file'), uploadDocument);

/**
 * @swagger
 * /api/docs/{id}:
 *   delete:
 *     tags: [Documents]
 *     summary: Delete a document
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Document deleted }
 *       403: { description: Insufficient permissions }
 */
router.delete('/:id', authenticateToken, removeDocument);

export default router;
