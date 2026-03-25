import api from './api';

export interface InvitationInfo {
  id: string;
  email: string;
  role: string;
  organization: {
    id: string;
    name: string;
    type: string;
  };
  expiresAt: string;
}

export const getInvitation = async (token: string): Promise<InvitationInfo> => {
  const res = await api.get(`/invitations/${token}`);
  return res.data.invitation;
};

export const acceptInvitation = async (token: string): Promise<{ message: string; organizationId: string }> => {
  const res = await api.post(`/invitations/${token}/accept`);
  return res.data;
};

export const getDashboardStats = async (): Promise<{
  totalOrgs: number;
  userDocuments: number;
  orgDocuments: number;
  orgMembers: number;
  recentActivityCount: number;
}> => {
  const res = await api.get('/orgs/dashboard-stats');
  return res.data.stats;
};
