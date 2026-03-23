import prisma from '../config/database';

export const logActivity = async (data: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
}) => {
  return await prisma.activityLog.create({ data });
};

export const getRecentActivity = async (limit = 20) => {
  return await prisma.activityLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
};
