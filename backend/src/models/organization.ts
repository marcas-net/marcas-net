import { OrgType } from '@prisma/client';
import prisma from '../config/database';

export const createOrganization = async (data: {
  name: string;
  type: OrgType;
  country?: string;
  description?: string;
  logoUrl?: string;
}) => {
  return await prisma.organization.create({ data });
};

export const findAllOrganizations = async () => {
  return await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      country: true,
      description: true,
      logoUrl: true,
      isVerified: true,
      createdAt: true,
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const findOrganizationById = async (id: string) => {
  return await prisma.organization.findUnique({
    where: { id },
    include: {
      members: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
};

export const updateOrganization = async (
  id: string,
  data: { name?: string; type?: OrgType; country?: string; description?: string; logoUrl?: string; isVerified?: boolean }
) => {
  return await prisma.organization.update({ where: { id }, data });
};

export const joinOrganization = async (userId: string, orgId: string) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { organizationId: orgId },
  });
};

export const findOrgMembers = async (orgId: string) => {
  return await prisma.user.findMany({
    where: { organizationId: orgId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
};