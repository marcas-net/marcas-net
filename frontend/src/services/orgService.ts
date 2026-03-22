import api from './api';

export interface Organization {
  id: string;
  name: string;
  type: string;
  country?: string;
  description?: string;
  _count?: { members: number };
  members?: { id: string; name: string | null; email: string; role: string }[];
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
