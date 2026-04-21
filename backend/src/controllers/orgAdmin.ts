import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { emitToUser } from '../utils/socket';
import { LotStatus, LoadStatus, SourcingStatus } from '@prisma/client';

// ─── Dashboard Stats ────────────────────────────────────

export const getOrgAdminDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.params['id'] as string;

    const [
      totalRequests,
      pendingRequests,
      activeRequests,
      confirmedRequests,
      totalBatches,
      activeBatches,
      totalLots,
      pendingLots,
      totalLoads,
      transitLoads,
      recentRequests,
      recentActivity,
    ] = await Promise.all([
      prisma.sourcingRequest.count({ where: { organizationId: orgId } }),
      prisma.sourcingRequest.count({ where: { organizationId: orgId, status: 'PENDING' } }),
      prisma.sourcingRequest.count({ where: { organizationId: orgId, status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] } } }),
      prisma.sourcingRequest.count({ where: { organizationId: orgId, status: { in: ['CONFIRMED', 'IN_FULFILMENT'] } } }),
      prisma.batch.count({ where: { product: { organizationId: orgId } } }),
      prisma.batch.count({ where: { product: { organizationId: orgId }, status: 'ACTIVE' } }),
      prisma.lot.count({ where: { organizationId: orgId } }),
      prisma.lot.count({ where: { organizationId: orgId, status: { in: ['OPEN', 'LOADING'] } } }),
      prisma.load.count({ where: { lot: { organizationId: orgId } } }),
      prisma.load.count({ where: { lot: { organizationId: orgId }, status: 'IN_TRANSIT' } }),
      prisma.sourcingRequest.findMany({
        where: { organizationId: orgId },
        select: {
          id: true, status: true, quantity: true, unit: true, createdAt: true, updatedAt: true,
          product: { select: { id: true, name: true, category: true } },
          requester: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      prisma.activityLog.findMany({
        where: { entityId: orgId, entityType: 'organization' },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Stock overview: total available across all org batches
    const stockAgg = await prisma.batch.aggregate({
      _sum: { availableQuantity: true, totalQuantity: true },
      where: { product: { organizationId: orgId }, status: 'ACTIVE' },
    });

    res.json({
      stats: {
        totalRequests,
        pendingRequests,
        activeRequests,
        confirmedRequests,
        totalBatches,
        activeBatches,
        totalLots,
        pendingLots,
        totalLoads,
        transitLoads,
        availableStock: Number(stockAgg._sum.availableQuantity ?? 0),
        totalStock: Number(stockAgg._sum.totalQuantity ?? 0),
      },
      recentRequests,
      recentActivity,
    });
  } catch (error) {
    console.error('Org admin dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Lots ───────────────────────────────────────────────

export const getOrgLots = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.params['id'] as string;
    const { status } = req.query;

    const lots = await prisma.lot.findMany({
      where: {
        organizationId: orgId,
        ...(status ? { status: status as LotStatus } : {}),
      },
      include: {
        request: {
          select: {
            id: true, quantity: true, unit: true, status: true,
            product: { select: { id: true, name: true, category: true } },
            requester: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        loads: { select: { id: true, loadCode: true, status: true, destination: true, quantity: true, eta: true } },
        _count: { select: { loads: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ lots });
  } catch (error) {
    console.error('Get org lots error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createLot = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.params['id'] as string;
    const { requestId, notes } = req.body;

    if (!requestId) return res.status(400).json({ error: 'requestId is required' });

    const request = await prisma.sourcingRequest.findFirst({
      where: { id: requestId, organizationId: orgId },
    });
    if (!request) return res.status(404).json({ error: 'Sourcing request not found' });

    const existing = await prisma.lot.findUnique({ where: { requestId } });
    if (existing) return res.status(400).json({ error: 'Lot already exists for this request' });

    const lotCode = `LOT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const lot = await prisma.lot.create({
      data: {
        lotCode,
        requestId,
        organizationId: orgId,
        buyerOrgId: request.buyerOrgId,
        totalQuantity: request.quantity,
        notes: notes ?? null,
      },
      include: {
        request: { select: { id: true, product: { select: { name: true } }, requester: { select: { id: true, name: true } } } },
        _count: { select: { loads: true } },
      },
    });

    // Notify requester
    emitToUser(request.requesterId, 'sourcing:lot_created', { lotId: lot.id, lotCode: lot.lotCode });

    res.status(201).json({ lot });
  } catch (error) {
    console.error('Create lot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateLotStatus = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.params['id'] as string;
    const lotId = req.params['lotId'] as string;
    const { status, notes } = req.body;

    const lot = await prisma.lot.findFirst({ where: { id: lotId, organizationId: orgId } });
    if (!lot) return res.status(404).json({ error: 'Lot not found' });

    const updated = await prisma.lot.update({
      where: { id: lotId },
      data: { status, ...(notes !== undefined ? { notes } : {}) },
    });

    res.json({ lot: updated });
  } catch (error) {
    console.error('Update lot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Loads ──────────────────────────────────────────────

export const getOrgLoads = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.params['id'] as string;
    const { status } = req.query;

    const loads = await prisma.load.findMany({
      where: {
        lot: { organizationId: orgId },
        ...(status ? { status: status as LoadStatus } : {}),
      },
      include: {
        lot: {
          select: {
            id: true, lotCode: true, status: true,
            request: { select: { product: { select: { id: true, name: true } }, requester: { select: { id: true, name: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ loads });
  } catch (error) {
    console.error('Get org loads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createLoad = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.params['id'] as string;
    const { lotId, destination, quantity, eta, notes } = req.body;

    if (!lotId || !destination || !quantity) {
      return res.status(400).json({ error: 'lotId, destination, and quantity are required' });
    }

    const lot = await prisma.lot.findFirst({ where: { id: lotId, organizationId: orgId } });
    if (!lot) return res.status(404).json({ error: 'Lot not found' });

    const loadCode = `LOAD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const load = await prisma.load.create({
      data: {
        loadCode,
        lotId,
        destination,
        quantity: quantity,
        eta: eta ? new Date(eta) : null,
        notes: notes ?? null,
      },
      include: {
        lot: { select: { id: true, lotCode: true, organizationId: true } },
      },
    });

    res.status(201).json({ load });
  } catch (error) {
    console.error('Create load error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateLoadStatus = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.params['id'] as string;
    const loadId = req.params['loadId'] as string;
    const { status, eta, notes } = req.body;

    const load = await prisma.load.findFirst({
      where: { id: loadId, lot: { organizationId: orgId } },
    });
    if (!load) return res.status(404).json({ error: 'Load not found' });

    const updated = await prisma.load.update({
      where: { id: loadId },
      data: {
        status,
        ...(eta !== undefined ? { eta: new Date(eta) } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    });

    res.json({ load: updated });
  } catch (error) {
    console.error('Update load error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Followers ──────────────────────────────────────────

export const getOrgFollowers = async (req: Request, res: Response) => {
  try {
    const orgId = req.params['id'] as string;

    const followers = await prisma.follow.findMany({
      where: { followingOrgId: orgId },
      include: {
        follower: { select: { id: true, name: true, avatarUrl: true, role: true, organizationId: true } },
      },
      orderBy: { id: 'desc' },
    });

    res.json({ followers: followers.map(f => f.follower), total: followers.length });
  } catch (error) {
    console.error('Get org followers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Verify Organization (ADMIN only) ───────────────────

export const verifyOrg = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.params['id'] as string;
    const { verified } = req.body;

    const org = await prisma.organization.update({
      where: { id: orgId },
      data: {
        isVerified: Boolean(verified),
        verifiedAt: verified ? new Date() : null,
        verifiedBy: verified ? req.user.id : null,
      },
      select: { id: true, name: true, isVerified: true, verifiedAt: true },
    });

    res.json({ organization: org });
  } catch (error) {
    console.error('Verify org error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Review Sourcing Request (confirm/reject + lot) ──────

export const reviewSourcingRequest = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.params['id'] as string;
    const requestId = req.params['requestId'] as string;
    const { action, supplierNotes } = req.body; // action: 'approve' | 'reject' | 'confirm'

    const request = await prisma.sourcingRequest.findFirst({
      where: { id: requestId, organizationId: orgId },
    });
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const statusMap: Record<string, SourcingStatus> = {
      approve: SourcingStatus.APPROVED,
      reject: SourcingStatus.REJECTED,
      confirm: SourcingStatus.CONFIRMED,
      close: SourcingStatus.CLOSED,
    };
    const newStatus = statusMap[action];
    if (!newStatus) return res.status(400).json({ error: 'Invalid action' });

    const updated = await prisma.sourcingRequest.update({
      where: { id: requestId },
      data: { status: newStatus, ...(supplierNotes !== undefined ? { supplierNotes } : {}) },
    });

    const full = await prisma.sourcingRequest.findUnique({
      where: { id: requestId },
      include: {
        product: { select: { name: true } },
        requester: { select: { id: true, name: true } },
      },
    });

    // Notify requester
    emitToUser(updated.requesterId, 'sourcing:request_updated', {
      requestId, status: newStatus, productName: full?.product.name ?? '',
    });

    res.json({ request: full });
  } catch (error) {
    console.error('Review request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
