import { z } from 'zod';
import { OrgType } from '@prisma/client';

export const createOrgSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.nativeEnum(OrgType, { message: 'Invalid organization type' }),
  country: z.string().optional(),
  description: z.string().max(500, 'Description must be under 500 characters').optional(),
});

export const updateOrgSchema = createOrgSchema.partial();