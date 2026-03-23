import prisma from '../config/database';

const uploadedBySelect = {
  select: { id: true, name: true, email: true },
};

export const createDocument = async (data: {
  title: string;
  description?: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  organizationId: string;
  uploadedById: string;
}) => {
  return await prisma.document.create({
    data,
    include: { uploadedBy: uploadedBySelect },
  });
};

export interface DocumentFilters {
  organizationId?: string;
  fileType?: string;
  uploadedById?: string;
  fromDate?: string;
  toDate?: string;
}

export const findDocuments = async (filters: DocumentFilters) => {
  const where: Record<string, unknown> = {};
  if (filters.organizationId) where['organizationId'] = filters.organizationId;
  if (filters.fileType) where['fileType'] = filters.fileType;
  if (filters.uploadedById) where['uploadedById'] = filters.uploadedById;
  if (filters.fromDate || filters.toDate) {
    where['createdAt'] = {
      ...(filters.fromDate ? { gte: new Date(filters.fromDate) } : {}),
      ...(filters.toDate ? { lte: new Date(filters.toDate) } : {}),
    };
  }
  return await prisma.document.findMany({
    where,
    include: { uploadedBy: uploadedBySelect, organization: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

export const findDocumentsByOrg = async (organizationId: string) => {
  return await prisma.document.findMany({
    where: { organizationId },
    include: { uploadedBy: uploadedBySelect },
    orderBy: { createdAt: 'desc' },
  });
};

export const findDocumentById = async (id: string) => {
  return await prisma.document.findUnique({
    where: { id },
    include: {
      uploadedBy: uploadedBySelect,
      organization: { select: { id: true, name: true } },
    },
  });
};

export const deleteDocumentById = async (id: string) => {
  return await prisma.document.delete({ where: { id } });
};
