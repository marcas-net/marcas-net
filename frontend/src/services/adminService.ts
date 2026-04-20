import api from './api';

export interface PlatformStats {
  totals: {
    users: number;
    organizations: number;
    products: number;
    posts: number;
    jobs: number;
    documents: number;
    formTemplates: number;
    formEntries: number;
  };
  recentUsers7d: number;
  roleDistribution: { role: string; count: number }[];
  orgTypes: { type: string; count: number }[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  country: string | null;
  avatarUrl: string | null;
  organizationId: string | null;
  createdAt: string;
  organization: { id: string; name: string } | null;
}

export interface AdminOrg {
  id: string;
  name: string;
  type: string;
  country: string | null;
  logoUrl: string | null;
  verified: boolean;
  createdAt: string;
  _count: { members: number; products: number };
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const { data } = await api.get('/admin/stats');
  return data;
}

export async function getAdminUsers(params?: { search?: string; role?: string; limit?: number; offset?: number }): Promise<{ users: AdminUser[]; total: number }> {
  const { data } = await api.get('/admin/users', { params });
  return data;
}

export async function getAdminOrganizations(params?: { search?: string; type?: string; limit?: number; offset?: number }): Promise<{ orgs: AdminOrg[]; total: number }> {
  const { data } = await api.get('/admin/organizations', { params });
  return data;
}

export async function updateUserRole(id: string, role: string): Promise<void> {
  await api.put(`/admin/users/${id}/role`, { role });
}

export async function verifyOrganization(id: string, verified: boolean): Promise<void> {
  await api.put(`/admin/organizations/${id}/verify`, { verified });
}

export async function getAuditLogs(params?: { limit?: number; offset?: number }): Promise<{ logs: unknown[]; total: number }> {
  const { data } = await api.get('/admin/audit-logs', { params });
  return data;
}
