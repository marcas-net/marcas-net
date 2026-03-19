import prisma from '../config/database';

export const createUser = async (data: { email: string; password: string; name?: string; role?: string }) => {
  return await prisma.user.create({
    data,
  });
};

export const findUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
  });
};

export const findUserById = async (id: string) => {
  return await prisma.user.findUnique({
    where: { id },
  });
};