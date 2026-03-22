import { Request, Response } from 'express';
import { OrgType } from '@prisma/client';
import {
  createOrganization,
  findAllOrganizations,
  findOrganizationById,
  updateOrganization,
  joinOrganization,
} from '../models/organization';
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
    const org = await findOrganizationById(req.params['id'] as string);
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    await joinOrganization(req.user.id, req.params['id'] as string);
    res.json({ message: `Joined organization: ${org.name}` });
  } catch (error) {
    console.error('Join organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};