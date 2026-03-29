import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const getJobs = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const where: any = { isOpen: true };
    if (type && type !== 'ALL') where.type = type;

    const jobs = await prisma.job.findMany({
      where,
      include: {
        organization: { select: { id: true, name: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ jobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getJobById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        organization: { select: { id: true, name: true, type: true } },
      },
    });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ job });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, location, type } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.organizationId) {
      return res.status(400).json({ error: 'You must belong to an organization to post jobs' });
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        location,
        type: type || 'FULL_TIME',
        organizationId: user.organizationId,
      },
      include: {
        organization: { select: { id: true, name: true, type: true } },
      },
    });
    res.status(201).json({ job });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const closeJob = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user?.organizationId !== job.organizationId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await prisma.job.update({
      where: { id },
      data: { isOpen: false },
    });
    res.json({ job: updated });
  } catch (error) {
    console.error('Close job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
