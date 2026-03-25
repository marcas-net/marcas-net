import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../middleware/auth';
import {
  createDocument,
  findDocuments,
  findDocumentsByOrg,
  findDocumentById,
  findDocumentVersions,
  deleteDocumentById,
} from '../models/document';
import { logActivity } from '../models/activityLog';
import { generateSignedUrl, verifySignedUrl } from '../utils/signedUrl';

export const getOrgDocuments = async (req: Request, res: Response) => {
  try {
    const docs = await findDocumentsByOrg(req.params['orgId'] as string);
    res.json({ documents: docs });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const searchDocuments = async (req: Request, res: Response) => {
  try {
    const { organizationId, fileType, uploadedById, fromDate, toDate } = req.query;
    const docs = await findDocuments({
      organizationId: organizationId as string | undefined,
      fileType: fileType as string | undefined,
      uploadedById: uploadedById as string | undefined,
      fromDate: fromDate as string | undefined,
      toDate: toDate as string | undefined,
    });
    res.json({ documents: docs });
  } catch (error) {
    console.error('Search documents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDocument = async (req: Request, res: Response) => {
  try {
    const doc = await findDocumentById(req.params['id'] as string);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json({ document: doc });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const downloadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const doc = await findDocumentById(req.params['id'] as string);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Security: check org membership
    if (req.user.role !== 'ADMIN' && req.user.organizationId !== doc.organizationId) {
      return res.status(403).json({ error: 'You must be a member of this organization to download' });
    }

    const filePath = path.join(__dirname, '../..', doc.fileUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    const filename = path.basename(filePath);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSignedDownloadUrl = async (req: AuthRequest, res: Response) => {
  try {
    const doc = await findDocumentById(req.params['id'] as string);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Security: check org membership
    if (req.user.role !== 'ADMIN' && req.user.organizationId !== doc.organizationId) {
      return res.status(403).json({ error: 'You must be a member of this organization' });
    }

    const signedPath = generateSignedUrl(doc.id);
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    const url = `${backendUrl}/api/docs/signed-download/${signedPath}`;

    res.json({ url, expiresIn: '30 minutes' });
  } catch (error) {
    console.error('Get signed URL error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const downloadWithSignedUrl = async (req: Request, res: Response) => {
  try {
    const docId = req.params['id'] as string;
    const { expires, signature } = req.query;

    if (!expires || !signature) {
      return res.status(400).json({ error: 'Missing signature parameters' });
    }

    if (!verifySignedUrl(docId, expires as string, signature as string)) {
      return res.status(403).json({ error: 'Invalid or expired download link' });
    }

    const doc = await findDocumentById(docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const filePath = path.join(__dirname, '../..', doc.fileUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    const filename = path.basename(filePath);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Signed download error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, organizationId, parentDocumentId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'File is required' });
    if (!title) return res.status(400).json({ error: 'Title is required' });
    if (!organizationId) return res.status(400).json({ error: 'organizationId is required' });

    const fileUrl = `/uploads/documents/${file.filename}`;
    const fileType = path.extname(file.originalname).replace('.', '').toLowerCase();

    let version = 1;
    if (parentDocumentId) {
      const parent = await findDocumentById(parentDocumentId);
      if (!parent) return res.status(404).json({ error: 'Parent document not found' });
      // Find the highest version number
      const versions = await findDocumentVersions(parentDocumentId);
      version = Math.max(...versions.map((v: any) => v.version)) + 1;
    }

    const doc = await createDocument({
      title,
      description,
      fileUrl,
      fileSize: file.size,
      fileType,
      organizationId,
      uploadedById: req.user.id,
      version,
      parentDocumentId: parentDocumentId || undefined,
    });

    await logActivity({
      userId: req.user.id,
      action: parentDocumentId ? 'document_new_version' : 'document_uploaded',
      entityType: 'document',
      entityId: doc.id,
    });

    res.status(201).json({ message: 'Document uploaded', document: doc });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDocumentVersions = async (req: Request, res: Response) => {
  try {
    const docId = req.params['id'] as string;
    const doc = await findDocumentById(docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Get versions from the root parent
    const rootId = doc.parentDocumentId || doc.id;
    const versions = await findDocumentVersions(rootId);

    res.json({ versions });
  } catch (error) {
    console.error('Get document versions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeDocument = async (req: AuthRequest, res: Response) => {
  try {
    const doc = await findDocumentById(req.params['id'] as string);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const { role, id: userId } = req.user;
    const isOwner = doc.uploadedById === userId;
    const isPrivileged = role === 'ADMIN' || role === 'ORG_ADMIN';

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const filePath = path.join(__dirname, '../..', doc.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await deleteDocumentById(req.params['id'] as string);

    await logActivity({
      userId: req.user.id,
      action: 'document_deleted',
      entityType: 'document',
      entityId: req.params['id'] as string,
    });

    res.json({ message: 'Document deleted' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
