import { OrgType } from '@prisma/client';
import prisma from '../config/database';

type OrganizationRow = {
  id: string;
  name: string;
  type: OrgType;
  country: string | null;
  description: string | null;
  logoUrl: string | null;
  isVerified: boolean;
  createdAt: Date;
  coverImageUrl: string | null;
};

let organizationColumnsCache: Set<string> | null = null;

async function getOrganizationColumns(): Promise<Set<string>> {
  if (organizationColumnsCache) return organizationColumnsCache;

  const rows = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'organizations'`
  );

  organizationColumnsCache = new Set(rows.map((row) => row.column_name));
  return organizationColumnsCache;
}

function mapOrganizationRow(row: OrganizationRow & { membersCount?: number }) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    country: row.country,
    description: row.description,
    logoUrl: row.logoUrl,
    isVerified: row.isVerified,
    createdAt: row.createdAt,
    coverImageUrl: row.coverImageUrl,
    ...(typeof row.membersCount === 'number'
      ? { _count: { members: row.membersCount } }
      : {}),
  };
}

async function filterOrganizationWriteData(data: {
  name?: string;
  type?: OrgType;
  country?: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  isVerified?: boolean;
}) {
  const columns = await getOrganizationColumns();

  return {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.type !== undefined ? { type: data.type } : {}),
    ...(data.country !== undefined ? { country: data.country } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(columns.has('logoUrl') && data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
    ...(columns.has('cover_image_url') && data.coverImageUrl !== undefined ? { coverImageUrl: data.coverImageUrl } : {}),
    ...(columns.has('isVerified') && data.isVerified !== undefined ? { isVerified: data.isVerified } : {}),
  };
}

export const createOrganization = async (data: {
  name: string;
  type: OrgType;
  country?: string;
  description?: string;
  logoUrl?: string;
}) => {
  const filteredData = await filterOrganizationWriteData({
    country: data.country,
    description: data.description,
    logoUrl: data.logoUrl,
  });

  return await prisma.organization.create({
    data: {
      name: data.name,
      type: data.type,
      ...filteredData,
    },
  });
};

export const findAllOrganizations = async () => {
  const columns = await getOrganizationColumns();

  const organizations = await prisma.$queryRawUnsafe<Array<OrganizationRow & { membersCount: number }>>(
    `
      SELECT
        o."id",
        o."name",
        o."type",
        o."country",
        o."description",
        ${columns.has('logoUrl') ? 'o."logoUrl"' : 'NULL::TEXT AS "logoUrl"'},
        ${columns.has('isVerified') ? 'o."isVerified"' : 'false AS "isVerified"'},
        o."createdAt",
        ${columns.has('cover_image_url') ? 'o."cover_image_url" AS "coverImageUrl"' : 'NULL::TEXT AS "coverImageUrl"'},
        (
          SELECT COUNT(*)::int
          FROM "users" u
          WHERE u."organizationId" = o."id"
        ) AS "membersCount"
      FROM "organizations" o
      ORDER BY o."createdAt" DESC
    `
  );

  return organizations.map(mapOrganizationRow);
};

export const findOrganizationById = async (id: string) => {
  const columns = await getOrganizationColumns();

  const organizations = await prisma.$queryRawUnsafe<Array<OrganizationRow>>(
    `
      SELECT
        o."id",
        o."name",
        o."type",
        o."country",
        o."description",
        ${columns.has('logoUrl') ? 'o."logoUrl"' : 'NULL::TEXT AS "logoUrl"'},
        ${columns.has('isVerified') ? 'o."isVerified"' : 'false AS "isVerified"'},
        o."createdAt",
        ${columns.has('cover_image_url') ? 'o."cover_image_url" AS "coverImageUrl"' : 'NULL::TEXT AS "coverImageUrl"'}
      FROM "organizations" o
      WHERE o."id" = $1
      LIMIT 1
    `,
    id
  );

  const organization = organizations[0];
  if (!organization) return null;

  const members = await prisma.user.findMany({
    where: { organizationId: id },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { createdAt: 'asc' },
  });

  return {
    ...mapOrganizationRow(organization),
    members,
  };
};

export const updateOrganization = async (
  id: string,
  data: { name?: string; type?: OrgType; country?: string; description?: string; logoUrl?: string; coverImageUrl?: string; isVerified?: boolean }
) => {
  const filteredData = await filterOrganizationWriteData(data);
  return await prisma.organization.update({ where: { id }, data: filteredData });
};

export const joinOrganization = async (userId: string, orgId: string) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { organizationId: orgId },
  });
};

export const findOrgMembers = async (orgId: string) => {
  return await prisma.user.findMany({
    where: { organizationId: orgId },
    select: { id: true, name: true, role: true, avatarUrl: true, headline: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
};
