import api from './api';

export interface Organization {
  id: string;
  name: string;
  type: string;
  country?: string;
  description?: string;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  isVerified?: boolean;
  _count?: { members: number };
  members?: { id: string; name: string | null; role: string }[];
  createdAt: string;
}

export interface OrgMember {
  id: string;
  name: string | null;
  role: string;
  headline?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
}

export const getOrganizations = async (): Promise<Organization[]> => {
  const res = await api.get('/orgs');
  return res.data.organizations;
};

export const getOrganization = async (id: string): Promise<Organization> => {
  const res = await api.get(`/orgs/${id}`);
  return res.data.organization;
};

export const getOrgMembers = async (id: string): Promise<OrgMember[]> => {
  const res = await api.get(`/orgs/${id}/members`);
  return res.data.members;
};

export const createOrganization = async (data: {
  name: string;
  type: string;
  country?: string;
  description?: string;
}): Promise<Organization> => {
  const res = await api.post('/orgs', data);
  return res.data.organization;
};

export const joinOrganization = async (id: string): Promise<void> => {
  await api.post(`/orgs/${id}/join`);
};

export const inviteMember = async (
  orgId: string,
  email: string,
  role?: string
): Promise<{ message: string; type: 'added' | 'invited' }> => {
  const res = await api.post(`/orgs/${orgId}/invite`, { email, role });
  return res.data;
};

export const updateOrganization = async (
  id: string,
  data: { name?: string; type?: string; country?: string; description?: string; logoUrl?: string; isVerified?: boolean }
): Promise<Organization> => {
  const res = await api.put(`/orgs/${id}`, data);
  return res.data.organization;
};

export const deleteOrganization = async (id: string): Promise<void> => {
  await api.delete(`/orgs/${id}`);
};

export const removeMember = async (orgId: string, memberId: string): Promise<void> => {
  await api.delete(`/orgs/${orgId}/members/${memberId}`);
};

export const updateMemberRole = async (orgId: string, memberId: string, role: string): Promise<void> => {
  await api.put(`/orgs/${orgId}/members/${memberId}/role`, { role });
};

export const getOrgPosts = async (orgId: string) => {
  const res = await api.get(`/orgs/${orgId}/posts`);
  return res.data.posts;
};

export interface OrgStats {
  membersCount: number;
  productsCount: number;
  activeBatches: number;
  pendingRequests: number;
  totalRequests: number;
  documentsCount: number;
  followersCount: number;
  recentMembers: number;
  recentProducts: number;
  recentRequests: number;
  activeOffers: number;
  confirmedOrders: number;
  onHoldBatches: number;
  totalStockQty: number;
}

export const getOrgStats = async (orgId: string): Promise<OrgStats> => {
  const res = await api.get(`/orgs/${orgId}/stats`);
  return res.data.stats;
};

// ─── Org Admin ──────────────────────────────────────────

export interface OrgAdminStats {
  stats: {
    totalRequests: number;
    pendingRequests: number;
    activeRequests: number;
    confirmedRequests: number;
    totalBatches: number;
    activeBatches: number;
    totalLots: number;
    pendingLots: number;
    totalLoads: number;
    transitLoads: number;
    availableStock: number;
    totalStock: number;
  };
  recentRequests: {
    id: string; status: string; quantity: number; unit: string | null; createdAt: string; updatedAt: string;
    product: { id: string; name: string; category: string | null };
    requester: { id: string; name: string | null; avatarUrl: string | null };
  }[];
  recentActivity: {
    id: string; action: string; entityType: string; createdAt: string;
    user: { id: string; name: string | null; avatarUrl: string | null } | null;
  }[];
}

export interface Lot {
  id: string;
  lotCode: string;
  requestId: string;
  organizationId: string;
  buyerOrgId: string | null;
  totalQuantity: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  request?: {
    id: string; quantity: number; unit: string | null; status: string;
    product: { id: string; name: string; category: string | null };
    requester: { id: string; name: string | null; avatarUrl: string | null };
  };
  loads?: { id: string; loadCode: string; status: string; destination: string; quantity: number; eta: string | null }[];
  _count?: { loads: number };
}

export interface Load {
  id: string;
  loadCode: string;
  lotId: string;
  destination: string;
  quantity: number;
  status: string;
  eta: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lot?: {
    id: string; lotCode: string; status: string;
    request?: { product: { id: string; name: string }; requester: { id: string; name: string | null } };
  };
}

export const getOrgAdminDashboard = async (orgId: string): Promise<OrgAdminStats> => {
  const res = await api.get(`/orgs/${orgId}/admin/dashboard`);
  return res.data;
};

export const getOrgLots = async (orgId: string, status?: string): Promise<Lot[]> => {
  const res = await api.get(`/orgs/${orgId}/lots`, { params: status ? { status } : undefined });
  return res.data.lots;
};

export const createLot = async (orgId: string, data: { requestId: string; notes?: string }): Promise<Lot> => {
  const res = await api.post(`/orgs/${orgId}/lots`, data);
  return res.data.lot;
};

export const updateLotStatus = async (orgId: string, lotId: string, status: string, notes?: string): Promise<Lot> => {
  const res = await api.put(`/orgs/${orgId}/lots/${lotId}`, { status, notes });
  return res.data.lot;
};

export const getOrgLoads = async (orgId: string, status?: string): Promise<Load[]> => {
  const res = await api.get(`/orgs/${orgId}/loads`, { params: status ? { status } : undefined });
  return res.data.loads;
};

export const createLoad = async (orgId: string, data: { lotId: string; destination: string; quantity: number; eta?: string; notes?: string }): Promise<Load> => {
  const res = await api.post(`/orgs/${orgId}/loads`, data);
  return res.data.load;
};

export const updateLoadStatus = async (orgId: string, loadId: string, status: string, eta?: string): Promise<Load> => {
  const res = await api.put(`/orgs/${orgId}/loads/${loadId}`, { status, eta });
  return res.data.load;
};

export const getOrgFollowers = async (orgId: string): Promise<{ id: string; name: string | null; avatarUrl: string | null; role: string }[]> => {
  const res = await api.get(`/orgs/${orgId}/followers`);
  return res.data.followers;
};

export const reviewSourcingRequest = async (orgId: string, requestId: string, action: string, supplierNotes?: string) => {
  const res = await api.post(`/orgs/${orgId}/requests/${requestId}/review`, { action, supplierNotes });
  return res.data.request;
};

export const uploadOrgCoverImage = async (orgId: string, file: File): Promise<{ coverImageUrl: string }> => {
  const formData = new FormData();
  formData.append('cover', file);
  const res = await api.post(`/orgs/${orgId}/cover`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const uploadOrgLogoImage = async (orgId: string, file: File): Promise<{ logoUrl: string }> => {
  const formData = new FormData();
  formData.append('logo', file);
  const res = await api.post(`/orgs/${orgId}/logo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};
