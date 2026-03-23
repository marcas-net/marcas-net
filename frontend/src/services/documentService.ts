import api from './api';

export interface DocumentUploader {
  id: string;
  name: string | null;
  email: string;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  organizationId: string;
  uploadedById: string;
  uploadedBy: DocumentUploader;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentFilters {
  organizationId?: string;
  fileType?: string;
  uploadedById?: string;
  fromDate?: string;
  toDate?: string;
}

export const getDocuments = async (filters?: DocumentFilters): Promise<Document[]> => {
  const res = await api.get('/docs', { params: filters });
  return res.data.documents;
};

export const getOrgDocuments = async (orgId: string): Promise<Document[]> => {
  const res = await api.get(`/docs/org/${orgId}`);
  return res.data.documents;
};

export const getDocument = async (id: string): Promise<Document> => {
  const res = await api.get(`/docs/${id}`);
  return res.data.document;
};

export const uploadDocument = async (data: FormData): Promise<Document> => {
  const res = await api.post('/docs/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.document;
};

export const deleteDocument = async (id: string): Promise<void> => {
  await api.delete(`/docs/${id}`);
};

export const getDownloadUrl = (documentId: string): string => {
  const base = (import.meta.env['VITE_API_URL'] as string) || 'http://localhost:5000/api';
  // strip trailing /api if present to build origin URL
  const origin = base.endsWith('/api') ? base.slice(0, -4) : base;
  return `${origin}/api/docs/${documentId}/download`;
};
