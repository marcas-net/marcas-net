import prisma from '../config/database';

const uploadedBySelect = {
  select: { id: true, name: true, email: true },
};

export const createDocument = async (data: {
  title: string;
  description?: string;
  fileUrl: string;
  organizationId: string;
  uploadedById: string;
}) => {
  return await prisma.document.create({
    data,
    include: { uploadedBy: uploadedBySelect },
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
