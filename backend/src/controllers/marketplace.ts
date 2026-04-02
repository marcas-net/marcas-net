import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

// ─── Products (kept under org context) ──────────────────

export const getProducts = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        organization: { select: { id: true, name: true, type: true } },
        _count: { select: { batches: true, requests: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrgProducts = async (req: Request, res: Response) => {
  try {
    const orgId = req.params.orgId as string;
    const products = await prisma.product.findMany({
      where: { organizationId: orgId },
      include: {
        organization: { select: { id: true, name: true, type: true } },
        _count: { select: { batches: true, requests: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ products });
  } catch (error) {
    console.error('Get org products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, category, unit, isCertified } = req.body;
    if (!name) return res.status(400).json({ error: 'Product name is required' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id as string } });
    if (!user?.organizationId) {
      return res.status(400).json({ error: 'You must belong to an organization to add products' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        category,
        unit,
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

// ─── Sourcing Requests ──────────────────────────────────

export const createSourcingRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, quantity, message } = req.body;
    if (!productId || !quantity) {
      return res.status(400).json({ error: 'Product and quantity are required' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const request = await prisma.sourcingRequest.create({
      data: {
        productId,
        requesterId: req.user.id as string,
        organizationId: product.organizationId,
        quantity,
        message,
      },
      include: {
        product: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ request });
  } catch (error) {
    console.error('Create sourcing request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrgSourcingRequests = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.params.orgId as string;
    const user = await prisma.user.findUnique({ where: { id: req.user.id as string } });
    if (user?.organizationId !== orgId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const requests = await prisma.sourcingRequest.findMany({
      where: { organizationId: orgId },
      include: {
        product: { select: { id: true, name: true, unit: true } },
        requester: { select: { id: true, name: true, avatarUrl: true } },
        allocations: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ requests });
  } catch (error) {
    console.error('Get sourcing requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSourcingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['APPROVED', 'REJECTED', 'CONFIRMED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const request = await prisma.sourcingRequest.findUnique({
      where: { id: req.params.requestId as string },
      include: { organization: true },
    });
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id as string } });
    if (user?.organizationId !== request.organizationId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await prisma.sourcingRequest.update({
      where: { id: req.params.requestId as string },
      data: { status },
      include: {
        product: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true } },
      },
    });

    res.json({ request: updated });
  } catch (error) {
    console.error('Update sourcing status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMySourcingRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await prisma.sourcingRequest.findMany({
      where: { requesterId: req.user.id as string },
      include: {
        product: { select: { id: true, name: true, unit: true } },
        organization: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ requests });
  } catch (error) {
    console.error('Get my sourcing requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
