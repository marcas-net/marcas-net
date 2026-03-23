import prisma from '../config/database';
import { Role } from '@prisma/client';

export const createInvitation = async (data: {
  email: string;
  organizationId: string;
  role: Role;
}) => {
  return await prisma.invitation.upsert({
    where: { email_organizationId: { email: data.email, organizationId: data.organizationId } },
    update: { role: data.role, status: 'PENDING' },
    create: data,
  });
};

export const findPendingInvitation = async (email: string, organizationId: string) => {
  return await prisma.invitation.findUnique({
    where: { email_organizationId: { email, organizationId } },
  });
};

export const acceptInvitation = async (email: string, organizationId: string) => {
  return await prisma.invitation.updateMany({
    where: { email, organizationId, status: 'PENDING' },
    data: { status: 'ACCEPTED' },
  });
};
