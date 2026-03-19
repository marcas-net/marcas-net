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