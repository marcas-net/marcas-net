import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getAuditLogs } from '../models/activityLog';
import prisma from '../config/database';

export const getAdminAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, action, fromDate, toDate, limit, offset } = req.query;

    const result = await getAuditLogs({
      userId: userId as string | undefined,
      action: action as string | undefined,
      fromDate: fromDate as string | undefined,
      toDate: toDate as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : 50,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });

    res.json(result);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



// ─── Platform Stats ─────────────────────────────────────

export const getPlatformStats = async (_req: AuthRequest, res: Response) => {
  try {
    const [users, organizations, products, posts, jobs, documents, formTemplates, formEntries] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.product.count(),
      prisma.post.count(),
      prisma.job.count(),
      prisma.document.count(),
      prisma.formTemplate.count(),
      prisma.formEntry.count(),
    ]);

    const recentUsers = await prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    });

    const roleDistribution = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    const orgTypes = await prisma.organization.groupBy({
      by: ['type'],
      _count: { type: true },
    });

    res.json({
      totals: { users, organizations, products, posts, jobs, documents, formTemplates, formEntries },
      recentUsers7d: recentUsers,
      roleDistribution: roleDistribution.map(r => ({ role: r.role, count: r._count.role })),
      orgTypes: orgTypes.map(o => ({ type: o.type, count: o._count.type })),
    });
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Users List ─────────────────────────────────────────

export const getAdminUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { search, role, limit, offset } = req.query;
    const take = limit ? parseInt(limit as string, 10) : 50;
    const skip = offset ? parseInt(offset as string, 10) : 0;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role as string;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, role: true, country: true, avatarUrl: true, organizationId: true, createdAt: true, organization: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, limit: take, offset: skip });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Organizations List ─────────────────────────────────

export const getAdminOrganizations = async (req: AuthRequest, res: Response) => {
  try {
    const { search, type, limit, offset } = req.query;
    const take = limit ? parseInt(limit as string, 10) : 50;
    const skip = offset ? parseInt(offset as string, 10) : 0;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (type) where.type = type as string;

    const [orgs, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        select: { id: true, name: true, type: true, country: true, logoUrl: true, isVerified: true, createdAt: true, _count: { select: { members: true, products: true } } },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.organization.count({ where }),
    ]);

    res.json({ orgs, total, limit: take, offset: skip });
  } catch (error) {
    console.error('Get admin organizations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Update User Role ───────────────────────────────────

export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: 'Role is required' });

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json(user);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Verify Organization ────────────────────────────────

export const verifyOrganization = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { verified } = req.body;

    const org = await prisma.organization.update({
      where: { id },
      data: { isVerified: Boolean(verified) },
      select: { id: true, name: true, isVerified: true },
    });

    res.json(org);
  } catch (error) {
    console.error('Verify organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
