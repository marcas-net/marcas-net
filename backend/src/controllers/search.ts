import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const globalSearch = async (req: AuthRequest, res: Response) => {
  try {
    const q = (req.query['q'] as string || '').trim();
    if (!q || q.length < 2) {
      return res.json({ organizations: [], documents: [], users: [] });
    }

    const search = `%${q}%`;

    const [organizations, documents, users] = await Promise.all([
      prisma.organization.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, type: true, _count: { select: { members: true } } },
        take: 5,
      }),
      prisma.document.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          fileType: true,
          organizationId: true,
          organization: { select: { name: true } },
        },
        take: 5,
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, email: true, role: true },
        take: 5,
      }),
    ]);

    res.json({ organizations, documents, users });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
