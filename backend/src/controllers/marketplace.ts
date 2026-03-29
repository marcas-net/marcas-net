import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const getProducts = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        organization: { select: { id: true, name: true, type: true } },
        _count: { select: { batches: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getServices = async (_req: Request, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      include: {
        organization: { select: { id: true, name: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ services });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, category, isCertified } = req.body;
    if (!name) return res.status(400).json({ error: 'Product name is required' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.organizationId) {
      return res.status(400).json({ error: 'You must belong to an organization to add products' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        category,
        isCertified: isCertified ?? false,
        organizationId: user.organizationId,
      },
      include: {
        organization: { select: { id: true, name: true, type: true } },
      },
    });
    res.status(201).json({ product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createService = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Service name is required' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.organizationId) {
      return res.status(400).json({ error: 'You must belong to an organization to add services' });
    }

    const service = await prisma.service.create({
      data: {
        name,
        description,
        organizationId: user.organizationId,
      },
      include: {
        organization: { select: { id: true, name: true, type: true } },
      },
    });
    res.status(201).json({ service });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
