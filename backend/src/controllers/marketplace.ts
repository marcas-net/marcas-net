import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

// ─── Products ───────────────────────────────────────────

export const getProducts = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { isPublished: true },
      include: {
        organization: { select: { id: true, name: true, type: true, country: true } },
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

export const getProduct = async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id as string },
      include: {
        organization: { select: { id: true, name: true, type: true, country: true } },
        batches: {
          where: { status: 'ACTIVE', availableQuantity: { gt: 0 } },
          select: { id: true, batchCode: true, availableQuantity: true, expiryDate: true, productionDate: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { batches: true, requests: true } },
      },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
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
        batches: {
          select: { id: true, batchCode: true, availableQuantity: true, totalQuantity: true, status: true, expiryDate: true },
          orderBy: { createdAt: 'desc' },
        },
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
    const { name, description, category, unit, origin, moq, price, currency, leadTimeDays, isCertified } = req.body;
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
        unit,
        origin,
        moq: moq ?? null,
        price: price ?? null,
        currency: currency ?? 'EUR',
        leadTimeDays: leadTimeDays ?? null,
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

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id as string } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user?.organizationId !== product.organizationId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { name, description, category, unit, origin, moq, price, currency, leadTimeDays, isCertified, isPublished } = req.body;
    const updated = await prisma.product.update({
      where: { id: req.params.id as string },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(unit !== undefined && { unit }),
        ...(origin !== undefined && { origin }),
        ...(moq !== undefined && { moq }),
        ...(price !== undefined && { price }),
        ...(currency !== undefined && { currency }),
        ...(leadTimeDays !== undefined && { leadTimeDays }),
        ...(isCertified !== undefined && { isCertified }),
        ...(isPublished !== undefined && { isPublished }),
      },
      include: { organization: { select: { id: true, name: true, type: true } } },
    });
    res.json({ product: updated });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Batches (supplier-only) ────────────────────────────

export const createBatch = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, batchCode, totalQuantity, productionDate, expiryDate, notes } = req.body;
    if (!productId || !batchCode || !totalQuantity) {
      return res.status(400).json({ error: 'productId, batchCode, and totalQuantity are required' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user?.organizationId !== product.organizationId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const batch = await prisma.batch.create({
      data: {
        productId,
        batchCode,
        totalQuantity,
        availableQuantity: totalQuantity,
        productionDate: productionDate ? new Date(productionDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        notes,
      },
    });
    res.status(201).json({ batch });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'Batch code already exists for this product' });
    }
    console.error('Create batch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProductBatches = async (req: AuthRequest, res: Response) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.productId as string } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user?.organizationId !== product.organizationId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const batches = await prisma.batch.findMany({
      where: { productId: req.params.productId as string },
      include: {
        _count: { select: { allocations: true } },
        allocations: {
          include: {
            request: {
              select: { id: true, requester: { select: { id: true, name: true } }, status: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ batches });
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Sourcing Requests ──────────────────────────────────

export const createSourcingRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, quantity, unit, message } = req.body;
    if (!productId || !quantity) {
      return res.status(400).json({ error: 'Product and quantity are required' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    // Prevent self-sourcing
    if (user?.organizationId === product.organizationId) {
      return res.status(400).json({ error: 'Cannot request from your own organization' });
    }

    const request = await prisma.sourcingRequest.create({
      data: {
        productId,
        requesterId: req.user.id,
        organizationId: product.organizationId,
        buyerOrgId: user?.organizationId ?? null,
        quantity,
        unit: unit ?? product.unit,
        message,
      },
      include: {
        product: { select: { id: true, name: true, unit: true } },
        requester: { select: { id: true, name: true, avatarUrl: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    // Create notification for supplier org admins
    const orgMembers = await prisma.membership.findMany({
      where: { organizationId: product.organizationId, role: { in: ['OWNER', 'ADMIN', 'MANAGER'] } },
      select: { userId: true },
    });
    if (orgMembers.length > 0) {
      await prisma.notification.createMany({
        data: orgMembers.map(m => ({
          userId: m.userId,
          type: 'SOURCING',
          title: 'New sourcing request',
          message: `${user?.name ?? 'Someone'} requested ${quantity} ${unit ?? product.unit ?? 'units'} of ${product.name}`,
          link: `/sourcing/requests`,
        })),
      });
    }

    res.status(201).json({ request });
  } catch (error) {
    console.error('Create sourcing request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrgSourcingRequests = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.params.orgId as string;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user?.organizationId !== orgId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const requests = await prisma.sourcingRequest.findMany({
      where: { organizationId: orgId },
      include: {
        product: { select: { id: true, name: true, unit: true, category: true } },
        requester: { select: { id: true, name: true, avatarUrl: true } },
        allocations: {
          include: { batch: { select: { id: true, batchCode: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ requests });
  } catch (error) {
    console.error('Get sourcing requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMySourcingRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await prisma.sourcingRequest.findMany({
      where: { requesterId: req.user.id },
      include: {
        product: { select: { id: true, name: true, unit: true, category: true } },
        organization: { select: { id: true, name: true, type: true } },
        allocations: {
          include: { batch: { select: { id: true, batchCode: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ requests });
  } catch (error) {
    console.error('Get my sourcing requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSourcingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, supplierNotes } = req.body;
    const validStatuses = ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CONFIRMED', 'IN_FULFILMENT', 'DELIVERED', 'CLOSED', 'WITHDRAWN'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const request = await prisma.sourcingRequest.findUnique({
      where: { id: req.params.requestId as string },
      include: { product: true, organization: true },
    });
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user?.organizationId !== request.organizationId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // CONFIRMED triggers batch allocation
    if (status === 'CONFIRMED') {
      const batches = await prisma.batch.findMany({
        where: { productId: request.productId, status: 'ACTIVE', availableQuantity: { gt: 0 } },
        orderBy: { expiryDate: 'asc' }, // FEFO: First Expiry First Out
      });

      let remaining = Number(request.quantity);
      const allocations: { batchId: string; allocatedQuantity: number }[] = [];

      for (const batch of batches) {
        if (remaining <= 0) break;
        const available = Number(batch.availableQuantity);
        const toAllocate = Math.min(remaining, available);
        allocations.push({ batchId: batch.id, allocatedQuantity: toAllocate });
        remaining -= toAllocate;
      }

      if (remaining > 0) {
        return res.status(400).json({
          error: `Insufficient batch inventory. Short by ${remaining} ${request.unit ?? 'units'}.`,
        });
      }

      // Create allocations and update batch quantities in a transaction
      await prisma.$transaction(async (tx) => {
        for (const alloc of allocations) {
          await tx.batchAllocation.create({
            data: {
              batchId: alloc.batchId,
              requestId: request.id,
              allocatedQuantity: alloc.allocatedQuantity,
            },
          });
          await tx.batch.update({
            where: { id: alloc.batchId },
            data: {
              availableQuantity: { decrement: alloc.allocatedQuantity },
            },
          });
        }
        // Deplete batches that hit 0
        await tx.batch.updateMany({
          where: { availableQuantity: { lte: 0 }, status: 'ACTIVE' },
          data: { status: 'DEPLETED' },
        });
      });
    }

    const updated = await prisma.sourcingRequest.update({
      where: { id: req.params.requestId as string },
      data: {
        status,
        ...(supplierNotes !== undefined && { supplierNotes }),
      },
      include: {
        product: { select: { id: true, name: true, unit: true } },
        requester: { select: { id: true, name: true } },
        allocations: {
          include: { batch: { select: { id: true, batchCode: true } } },
        },
      },
    });

    // Notify buyer of status change
    await prisma.notification.create({
      data: {
        userId: request.requesterId,
        type: 'SOURCING',
        title: `Order ${status.toLowerCase().replace('_', ' ')}`,
        message: `Your request for ${request.product.name} has been ${status.toLowerCase().replace('_', ' ')}`,
        link: `/sourcing/requests`,
      },
    });

    res.json({ request: updated });
  } catch (error) {
    console.error('Update sourcing status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Recall / Withdrawal ────────────────────────────────

export const createRecall = async (req: AuthRequest, res: Response) => {
  try {
    const { batchId, type, issue, instructions } = req.body;
    if (!batchId || !issue || !instructions) {
      return res.status(400).json({ error: 'batchId, issue, and instructions are required' });
    }

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { product: true },
    });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user?.organizationId !== batch.product.organizationId && req.user.role !== 'ADMIN' && req.user.role !== 'REGULATOR') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Mark batch as recalled
    await prisma.batch.update({
      where: { id: batchId },
      data: { status: 'RECALLED' },
    });

    // Find all affected downstream allocations
    const affected = await prisma.batchAllocation.findMany({
      where: { batchId },
      include: {
        request: {
          include: {
            requester: { select: { id: true, name: true } },
            product: { select: { name: true } },
          },
        },
      },
    });

    const recall = await prisma.recall.create({
      data: {
        batchId,
        organizationId: batch.product.organizationId,
        type: type ?? 'WITHDRAWAL',
        issue,
        instructions,
        createdById: req.user.id,
      },
      include: {
        batch: { select: { id: true, batchCode: true, product: { select: { name: true } } } },
      },
    });

    // Notify all affected downstream parties
    const notificationData = affected.map(a => ({
      userId: a.request.requesterId,
      type: 'RECALL' as const,
      title: `${type === 'RECALL' ? 'Product recall' : 'Product withdrawal'}: ${batch.product.name}`,
      message: `Batch ${batch.batchCode} of ${batch.product.name} has been ${type === 'RECALL' ? 'recalled' : 'withdrawn'}. ${instructions}`,
      link: `/sourcing/requests`,
    }));

    if (notificationData.length > 0) {
      await prisma.notification.createMany({ data: notificationData });
    }

    res.status(201).json({
      recall,
      affectedOrganizations: affected.length,
      affectedQuantity: affected.reduce((sum, a) => sum + Number(a.allocatedQuantity), 0),
    });
  } catch (error) {
    console.error('Create recall error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrgRecalls = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.params.orgId as string;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user?.organizationId !== orgId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const recalls = await prisma.recall.findMany({
      where: { organizationId: orgId },
      include: {
        batch: {
          include: {
            product: { select: { id: true, name: true } },
            allocations: {
              include: {
                request: {
                  select: {
                    id: true,
                    requester: { select: { id: true, name: true } },
                    quantity: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ recalls });
  } catch (error) {
    console.error('Get recalls error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
