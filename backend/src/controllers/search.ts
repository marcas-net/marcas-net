import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const globalSearch = async (req: AuthRequest, res: Response) => {
  try {
    const q = (req.query['q'] as string || '').trim();
    if (!q || q.length < 2) {
      return res.json({ organizations: [], documents: [], users: [], posts: [], jobs: [] });
    }

    const [organizations, documents, users, posts, jobs] = await Promise.all([
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
          ],
        },
        select: { id: true, name: true, role: true, avatarUrl: true },
        take: 5,
      }),
      prisma.post.findMany({
        where: { content: { contains: q, mode: 'insensitive' } },
        select: {
          id: true,
          content: true,
          category: true,
          author: { select: { id: true, name: true } },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.job.findMany({
        where: {
          isOpen: true,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          location: true,
          type: true,
          organization: { select: { name: true } },
        },
        take: 5,
      }),
    ]);

    res.json({ organizations, documents, users, posts, jobs });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
