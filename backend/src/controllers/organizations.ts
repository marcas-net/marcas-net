import { Request, Response } from 'express';
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
import { AuthRequest } from '../middleware/auth';

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

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      // If they exist, add them directly
      await joinOrganization(existingUser.id, orgId);
      return res.json({ message: 'User added to organization directly', type: 'added' });
    }

    // Otherwise create an invitation record
    const invitation = await createInvitation({ email, organizationId: orgId, role: inviteRole });
    res.status(201).json({ message: 'Invitation sent', invitation, type: 'invited' });
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createOrg = async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, country, description } = req.body;
    const org = await createOrganization({ name, type: type as OrgType, country, description });
    res.status(201).json({ message: 'Organization created', organization: org });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateOrg = async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, country, description } = req.body;
    const org = await updateOrganization(req.params['id'] as string, {
      name,
      type: type as OrgType | undefined,
      country,
      description,
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
