import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const getJobs = async (req: AuthRequest, res: Response) => {
  try {
    const type = req.query.type as string | undefined;
    const where: any = { isOpen: true };
    if (type && type !== 'ALL') where.type = type;

    const jobs = await prisma.job.findMany({
      where,
      include: {
        organization: { select: { id: true, name: true, type: true } },
        postedBy: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const userId = req.user?.id;
    let appliedJobIds: string[] = [];
    if (userId) {
      const apps = await prisma.jobApplication.findMany({
        where: { userId },
        select: { jobId: true },
      });
      appliedJobIds = apps.map((a) => a.jobId);
    }

    const mapped = jobs.map((j: any) => ({
      ...j,
      applicationsCount: j._count.applications,
      applied: appliedJobIds.includes(j.id),
      _count: undefined,
    }));

    res.json({ jobs: mapped });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getJobById = async (req: AuthRequest, res: Response) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id as string },
      include: {
        organization: { select: { id: true, name: true, type: true } },
        postedBy: { select: { id: true, name: true, avatarUrl: true, role: true } },
        _count: { select: { applications: true } },
      },
    });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    let applied = false;
    if (req.user?.id) {
      const app = await prisma.jobApplication.findUnique({
        where: { userId_jobId: { userId: req.user.id, jobId: job.id } },
      });
      applied = !!app;
    }

    res.json({ job: { ...job, applicationsCount: (job as any)._count.applications, applied, _count: undefined } });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, location, type, salary } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.organizationId) {
      return res.status(400).json({ error: 'You must belong to an organization to post jobs' });
    }

    const job = await prisma.job.create({
      data: {
        title, description, location, salary,
        type: type || 'FULL_TIME',
        organizationId: user.organizationId,
        postedById: req.user.id,
      },
      include: {
        organization: { select: { id: true, name: true, type: true } },
        postedBy: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Notify followers of the organization
    const followers = await prisma.follow.findMany({
      where: { followingOrgId: user.organizationId },
      select: { followerId: true },
    });
    for (const f of followers) {
      await prisma.notification.create({
        data: {
          userId: f.followerId,
          type: 'JOB',
          title: 'New Job Posted',
          message: `${job.organization.name} posted: ${title}`,
          link: `/jobs`,
        },
      });
    }

    res.status(201).json({ job: { ...job, applicationsCount: 0, applied: false } });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const applyToJob = async (req: AuthRequest, res: Response) => {
  try {
    const jobId = req.params.id as string;
    const { coverLetter } = req.body;

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (!job.isOpen) return res.status(400).json({ error: 'This position is no longer open' });

    const existing = await prisma.jobApplication.findUnique({
      where: { userId_jobId: { userId: req.user.id, jobId: jobId } },
    });
    if (existing) return res.status(400).json({ error: 'Already applied' });

    const application = await prisma.jobApplication.create({
      data: { jobId: jobId, userId: req.user.id, coverLetter },
    });

    res.status(201).json({ application });
  } catch (error) {
    console.error('Apply to job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getJobApplications = async (req: AuthRequest, res: Response) => {
  try {
    const jobId = req.params.id as string;
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user?.organizationId !== job.organizationId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const applications = await prisma.jobApplication.findMany({
      where: { jobId },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ applications });
  } catch (error) {
    console.error('Get applications error:', error);
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

    const updated = await prisma.job.update({ where: { id }, data: { isOpen: false } });
    res.json({ job: updated });
  } catch (error) {
    console.error('Close job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyApplications = async (req: AuthRequest, res: Response) => {
  try {
    const applications = await prisma.jobApplication.findMany({
      where: { userId: req.user.id },
      include: {
        job: {
          include: { organization: { select: { id: true, name: true, type: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ applications });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
