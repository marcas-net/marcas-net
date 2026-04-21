import { z } from 'zod';
import { OrgType } from '@prisma/client';

export const createOrgSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.nativeEnum(OrgType, { message: 'Invalid organization type' }),
  country: z.string().optional(),
  description: z.string().max(500, 'Description must be under 500 characters').optional(),
  logoUrl: z.string().url('logoUrl must be a valid URL').optional(),
  coverImageUrl: z.string().url('coverImageUrl must be a valid URL').optional(),
  website: z.string().url('website must be a valid URL').optional(),
  industry: z.string().max(120, 'Industry must be under 120 characters').optional(),
  technology: z.string().max(120, 'Technology must be under 120 characters').optional(),
  certifications: z.array(z.string().min(1)).max(20).optional(),
});

export const updateOrgSchema = createOrgSchema.partial();