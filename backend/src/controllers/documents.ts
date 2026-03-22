import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  createDocument,
  findDocumentsByOrg,
  findDocumentById,
  deleteDocumentById,
} from '../models/document';

export const getOrgDocuments = async (req: Request, res: Response) => {
  try {
    const docs = await findDocumentsByOrg(req.params['orgId'] as string);
    res.json({ documents: docs });
  } catch (error) {
    console.error('Get documents error:', error);
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

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, organizationId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'File is required' });
    if (!title) return res.status(400).json({ error: 'Title is required' });
    if (!organizationId) return res.status(400).json({ error: 'organizationId is required' });

    const fileUrl = `/uploads/${file.filename}`;
    const doc = await createDocument({
      title,
      description,
      fileUrl,
      organizationId,
      uploadedById: req.user.id,
    });

    res.status(201).json({ message: 'Document uploaded', document: doc });
  } catch (error) {
    console.error('Upload document error:', error);
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

    await deleteDocumentById(req.params['id'] as string);
    res.json({ message: 'Document deleted' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
