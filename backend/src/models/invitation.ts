import prisma from '../config/database';
import { Role } from '@prisma/client';

export const createInvitation = async (data: {
  email: string;
  organizationId: string;
  role: Role;
  token: string;
  expiresAt: Date;
}) => {
  return await prisma.invitation.upsert({
    where: { email_organizationId: { email: data.email, organizationId: data.organizationId } },
    update: { role: data.role, status: 'PENDING', token: data.token, expiresAt: data.expiresAt },
    create: data,
    include: { organization: { select: { id: true, name: true } } },
  });
};

export const findPendingInvitation = async (email: string, organizationId: string) => {
  return await prisma.invitation.findUnique({
    where: { email_organizationId: { email, organizationId } },
  });
};

export const findInvitationByToken = async (token: string) => {
  return await prisma.invitation.findUnique({
    where: { token },
    include: { organization: { select: { id: true, name: true, type: true } } },
  });
};

export const acceptInvitationByToken = async (token: string) => {
  return await prisma.invitation.update({
    where: { token },
    data: { status: 'ACCEPTED' },
  });
};
