import { Role } from '@prisma/client';
import prisma from '../config/database';

function baseUsername(name?: string | null, email?: string): string {
  const src = name || email?.split('@')[0] || 'user';
  return src.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'user';
}

async function uniqueUsername(name?: string | null, email?: string): Promise<string> {
  const base = baseUsername(name, email);
  const existing = await prisma.user.findUnique({ where: { username: base } });
  if (!existing) return base;
  // Append random 4-digit suffix
  let attempt = `${base}_${Math.floor(1000 + Math.random() * 9000)}`;
  const conflict = await prisma.user.findUnique({ where: { username: attempt } });
  return conflict ? `${base}_${Date.now().toString(36)}` : attempt;
}

export const createUser = async (data: {
  email: string;
  password: string;
  name?: string;
  role?: Role;
  organizationId?: string;
  dateOfBirth?: Date;
  country?: string;
}) => {
  const username = await uniqueUsername(data.name, data.email);
  return await prisma.user.create({ data: { ...data, username } });
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

export const updateUser = async (id: string, data: { name?: string; username?: string; email?: string; bio?: string; country?: string; headline?: string; skills?: string[] }) => {
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
      username: true,
      bio: true,
      headline: true,
      skills: true,
      role: true,
      avatarUrl: true,
      coverImageUrl: true,
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
      bio: true,
      role: true,
      avatarUrl: true,
      organization: { select: { id: true, name: true, type: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};