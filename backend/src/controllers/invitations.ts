import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { joinOrganization } from '../models/organization';
import { createNotification } from '../models/notification';
import { logActivity } from '../models/activityLog';
import { emitToAll, emitToUser } from '../utils/socket';

export const getInvitationByToken = async (req: Request, res: Response) => {
  try {
    const token = req.params['token'] as string;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { organization: { select: { id: true, name: true, type: true } } },
    }) as any;

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ error: 'Invitation has already been used' });
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    res.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        organization: invitation.organization,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error('Get invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const acceptInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const token = req.params['token'] as string;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { organization: true },
    }) as any;

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ error: 'Invitation has already been used' });
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Check email matches
    if (invitation.email !== req.user.email) {
      return res.status(403).json({ error: 'This invitation was sent to a different email address' });
    }

    // Join organization and update role
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        organizationId: invitation.organizationId,
        role: invitation.role,
      },
    });

    // Mark invitation as accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    });

    // Create notification
    const notification = await createNotification({
      userId: req.user.id,
      type: 'ORGANIZATION',
      title: 'Welcome!',
      message: `You've joined ${invitation.organization.name}`,
      link: `/orgs/${invitation.organizationId}`,
    });

    emitToUser(req.user.id, 'notification', notification);
    emitToAll('organization:memberJoined', { organizationId: invitation.organizationId, userId: req.user.id });

    // Log activity
    await logActivity({
      userId: req.user.id,
      action: 'invitation_accepted',
      entityType: 'organization',
      entityId: invitation.organizationId,
    });

    res.json({
      message: `Successfully joined ${invitation.organization.name}`,
      organizationId: invitation.organizationId,
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
