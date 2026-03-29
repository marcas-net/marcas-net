import { Role } from '@prisma/client';
import prisma from '../config/database';

export const createUser = async (data: {
  email: string;
  password: string;
  name?: string;
  role?: Role;
  organizationId?: string;
}) => {
  return await prisma.user.create({ data });
};

export const findUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
    include: { organization: { select: { id: true, name: true, type: true } } },
  });
};

export const findUserById = async (id: string) => {
  return await prisma.user.findUnique({
    where: { id },
    include: { organization: { select: { id: true, name: true, type: true } } },
  });
};

export const updateUser = async (id: string, data: { name?: string; email?: string; bio?: string }) => {
  return await prisma.user.update({
    where: { id },
    data,
    include: { organization: { select: { id: true, name: true, type: true } } },
  });
};

export const updateUserPassword = async (id: string, hashedPassword: string) => {
  return await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });
};

export const findPublicUserById = async (id: string) => {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      role: true,
      avatarUrl: true,
      organizationId: true,
      organization: { select: { id: true, name: true, type: true } },
      documents: {
        select: { id: true, title: true, fileType: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      activityLogs: {
        select: { id: true, action: true, entityType: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      createdAt: true,
    },
  });
};

export const findAllUsers = async () => {
  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      role: true,
      avatarUrl: true,
      organization: { select: { id: true, name: true, type: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};