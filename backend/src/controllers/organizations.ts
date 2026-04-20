import { Request, Response } from 'express';
import crypto from 'crypto';
import { OrgType, Role } from '@prisma/client';
import {
  createOrganization,
  findAllOrganizations,
  findOrganizationById,
  updateOrganization,
  joinOrganization,
  findOrgMembers,
} from '../models/organization';
import { findUserByEmail } from '../models/user';
import { createInvitation } from '../models/invitation';
import { logActivity } from '../models/activityLog';
import { createNotification } from '../models/notification';
import { sendInvitationEmail } from '../utils/email';
import { emitToUser } from '../utils/socket';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const getOrganizations = async (_req: Request, res: Response) => {
  try {
    const orgs = await findAllOrganizations();
    res.json({ organizations: orgs });
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrganization = async (req: Request, res: Response) => {
  try {
    const org = await findOrganizationById(req.params['id'] as string);
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    res.json({ organization: org });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrgMembers = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.params['id'] as string;

    // Only members of this org can see the member list
    if (req.user.organizationId !== orgId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only organization members can view this list' });
    }

    const members = await findOrgMembers(orgId);
    res.json({ members });
  } catch (error) {
    console.error('Get org members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const inviteMember = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.params['id'] as string;
    const { email, role } = req.body;

    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Only ORG_ADMIN or ADMIN can invite
    if (req.user.role !== 'ORG_ADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only organization admins can invite members' });
    }

    const org = await findOrganizationById(orgId);
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    const inviteRole = (role as Role) || Role.USER;

    // Check if user already exists and is already in this org
    const existingUser = await findUserByEmail(email);
    if (existingUser && existingUser.organizationId === orgId) {
      return res.status(400).json({ error: 'User is already a member of this organization' });
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await createInvitation({
      email,
      organizationId: orgId,
      role: inviteRole,
      token,
      expiresAt,
    });

    // Send invitation email
    const emailSent = await sendInvitationEmail(
      email,
      org.name,
      token,
      req.user.name || req.user.email
    );

    // Notify existing user if they have an account
    if (existingUser) {
      const notification = await createNotification({
        userId: existingUser.id,
        type: 'INVITATION',
        title: 'New Invitation',
        message: `You've been invited to join ${org.name}`,
        link: `/accept-invitation/${token}`,
      });
      emitToUser(existingUser.id, 'notification', notification);
    }

    await logActivity({
      userId: req.user.id,
      action: 'member_invited',
      entityType: 'organization',
      entityId: orgId,
    });

    res.status(201).json({
      message: emailSent ? 'Invitation sent via email' : 'Invitation created (email delivery failed)',
      invitation: { id: invitation.id, email, role: inviteRole },
      type: 'invited',
    });
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createOrg = async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, country, description, logoUrl } = req.body;
    const org = await createOrganization({ name, type: type as OrgType, country, description, logoUrl });
    res.status(201).json({ message: 'Organization created', organization: org });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateOrg = async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, country, description, logoUrl, isVerified } = req.body;
    const org = await updateOrganization(req.params['id'] as string, {
      name,
      type: type as OrgType | undefined,
      country,
      description,
      logoUrl,
      isVerified,
    });
    res.json({ message: 'Organization updated', organization: org });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const joinOrg = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.params['id'] as string;
    const org = await findOrganizationById(orgId);
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    await joinOrganization(req.user.id, orgId);

    await logActivity({
      userId: req.user.id,
      action: 'organization_joined',
      entityType: 'organization',
      entityId: orgId,
    });

    res.json({ message: `Joined organization: ${org.name}` });
  } catch (error) {
    console.error('Join organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const orgId = req.user.organizationId;

    const [totalOrgs, userDocuments, orgMembers, recentActivity] = await Promise.all([
      prisma.organization.count(),
      prisma.document.count({ where: { uploadedById: userId } }),
      orgId ? prisma.user.count({ where: { organizationId: orgId } }) : Promise.resolve(0),
      prisma.activityLog.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const orgDocuments = orgId
      ? await prisma.document.count({ where: { organizationId: orgId } })
      : 0;

    res.json({
      stats: {
        totalOrgs,
        userDocuments,
        orgDocuments,
        orgMembers,
        recentActivityCount: recentActivity.length,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrgStats = async (req: Request, res: Response) => {
  try {
    const orgId = req.params['id'] as string;
    const org = await findOrganizationById(orgId);
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      membersCount,
      productsCount,
      activeBatches,
      pendingRequests,
      totalRequests,
      documentsCount,
      followersCount,
      recentMembers,
      recentProducts,
      recentRequests,
      confirmedOrders,
      onHoldBatches,
      activeBatchesForStock,
    ] = await Promise.all([
      prisma.user.count({ where: { organizationId: orgId } }),
      prisma.product.count({ where: { organizationId: orgId } }),
      prisma.batch.count({
        where: { product: { organizationId: orgId }, status: 'ACTIVE' },
      }),
      prisma.sourcingRequest.count({
        where: { organizationId: orgId, status: 'PENDING' },
      }),
      prisma.sourcingRequest.count({ where: { organizationId: orgId } }),
      prisma.document.count({ where: { organizationId: orgId } }),
      prisma.follow.count({ where: { followingOrgId: orgId } }),
      prisma.user.count({ where: { organizationId: orgId, createdAt: { gte: oneWeekAgo } } }),
      prisma.product.count({ where: { organizationId: orgId, createdAt: { gte: oneWeekAgo } } }),
      prisma.sourcingRequest.count({ where: { organizationId: orgId, createdAt: { gte: oneWeekAgo } } }),
      prisma.sourcingRequest.count({ where: { organizationId: orgId, status: 'CONFIRMED' } }),
      prisma.batch.count({ where: { product: { organizationId: orgId }, status: 'ON_HOLD' } }),
      prisma.batch.findMany({
        where: { product: { organizationId: orgId }, status: 'ACTIVE' },
        select: { availableQuantity: true },
      }),
    ]);

    const totalStockQty = activeBatchesForStock.reduce((sum, b) => sum + Number(b.availableQuantity), 0);
    const activeOffers = productsCount; // products with isPublished (already counted)

    res.json({
      stats: {
        membersCount,
        productsCount,
        activeBatches,
        pendingRequests,
        totalRequests,
        documentsCount,
        followersCount,
        recentMembers,
        recentProducts,
        recentRequests,
        activeOffers,
        confirmedOrders,
        onHoldBatches,
        totalStockQty,
      },
    });
  } catch (error) {
    console.error('Get org stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteOrg = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.params['id'] as string;
    const org = await findOrganizationById(orgId);
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    // Remove all members from the org first
    await prisma.user.updateMany({
      where: { organizationId: orgId },
      data: { organizationId: null },
    });

    // Delete related records
    await prisma.invitation.deleteMany({ where: { organizationId: orgId } });
    await prisma.document.deleteMany({ where: { organizationId: orgId } });
    await prisma.organization.delete({ where: { id: orgId } });

    await logActivity({
      userId: req.user.id,
      action: 'organization_deleted',
      entityType: 'organization',
      entityId: orgId,
    });

    res.json({ message: 'Organization deleted' });
  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeMember = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.params['id'] as string;
    const memberId = req.params['memberId'] as string;

    const member = await prisma.user.findUnique({ where: { id: memberId } });
    if (!member || member.organizationId !== orgId) {
      return res.status(404).json({ error: 'Member not found in this organization' });
    }

    await prisma.user.update({
      where: { id: memberId },
      data: { organizationId: null, role: 'USER' },
    });

    await logActivity({
      userId: req.user.id,
      action: 'member_removed',
      entityType: 'organization',
      entityId: orgId,
    });

    res.json({ message: 'Member removed from organization' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrgPosts = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const orgId = req.params.id;

    let mediaTableExists = true;
    try {
      await prisma.$queryRawUnsafe(`SELECT 1 FROM "post_media" LIMIT 0`);
    } catch {
      mediaTableExists = false;
    }

    const include: any = {
      author: { select: { id: true, name: true, role: true, avatarUrl: true } },
      organization: { select: { id: true, name: true, type: true } },
      comments: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'asc' as const },
      },
      _count: { select: { comments: true, likes: true, reposts: true } },
      repostOf: {
        include: {
          author: { select: { id: true, name: true, role: true, avatarUrl: true } },
          organization: { select: { id: true, name: true, type: true } },
          _count: { select: { likes: true, comments: true, reposts: true } },
        },
      },
      pollOptions: { include: { _count: { select: { votes: true } } } },
    };
    if (mediaTableExists) {
      include.media = { select: { id: true, url: true, type: true, filename: true, size: true } };
      if (include.repostOf?.include) {
        include.repostOf.include.media = { select: { id: true, url: true, type: true, filename: true, size: true } };
      }
    }

    const posts = await prisma.post.findMany({
      where: { organizationId: orgId },
      include,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5000';
    const baseUrl = `${proto}://${host}`;

    const mapped = posts.map((p: any) => ({
      ...p,
      media: (p.media ?? []).map((m: any) => ({
        ...m,
        url: m.url?.startsWith('http') ? m.url : `${baseUrl}${m.url}`,
      })),
      editedAt: p.editedAt ?? null,
      likedByMe: false,
      likesCount: p._count?.likes ?? 0,
      commentsCount: p._count?.comments ?? 0,
      repostsCount: p._count?.reposts ?? 0,
      pollOptions: (p.pollOptions ?? []).map((o: any) => ({
        id: o.id,
        text: o.text,
        votesCount: o._count?.votes ?? 0,
        votedByMe: false,
      })),
      likes: undefined,
      _count: undefined,
    }));

    res.json({ posts: mapped });
  } catch (error) {
    console.error('Get org posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
