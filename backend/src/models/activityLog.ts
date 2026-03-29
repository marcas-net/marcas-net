import prisma from '../config/database';

export const logActivity = async (data: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: string;
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

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

export const getAuditLogs = async (filters: AuditLogFilters) => {
  const where: Record<string, unknown> = {};
  if (filters.userId) where['userId'] = filters.userId;
  if (filters.action) where['action'] = filters.action;
  if (filters.fromDate || filters.toDate) {
    where['createdAt'] = {
      ...(filters.fromDate ? { gte: new Date(filters.fromDate) } : {}),
      ...(filters.toDate ? { lte: new Date(filters.toDate) } : {}),
    };
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      take: filters.limit || 50,
      skip: filters.offset || 0,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.activityLog.count({ where }),
  ]);

  return { logs, total };
};
