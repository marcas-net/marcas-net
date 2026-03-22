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
  organizationId: string;
  uploadedById: string;
  uploadedBy: DocumentUploader;
  createdAt: string;
  updatedAt: string;
}

export const getOrgDocuments = async (orgId: string): Promise<Document[]> => {
  const res = await api.get(`/docs/org/${orgId}`);
  return res.data.documents;
};

export const getDocument = async (id: string): Promise<Document> => {
  const res = await api.get(`/docs/${id}`);
  return res.data.document;
};

export const uploadDocument = async (data: FormData): Promise<Document> => {
  const res = await api.post('/docs', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.document;
};

export const deleteDocument = async (id: string): Promise<void> => {
  await api.delete(`/docs/${id}`);
};
