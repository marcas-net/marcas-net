import api from './api';

export interface PublicUser {
  id: string;
  name: string | null;
  email: string;
  bio: string | null;
  role: string;
  avatarUrl?: string | null;
  organizationId: string | null;
  organization: { id: string; name: string; type: string } | null;
  documents: { id: string; title: string; fileType: string | null; createdAt: string }[];
  activityLogs: { id: string; action: string; entityType: string; createdAt: string }[];
  createdAt: string;
}

export interface UserListItem {
  id: string;
  name: string | null;
  email: string;
  bio: string | null;
  role: string;
  organization: { id: string; name: string; type: string } | null;
  createdAt: string;
}

export const getUserById = async (id: string): Promise<PublicUser> => {
  const res = await api.get(`/users/${id}`);
  return res.data.user;
};

export const listUsers = async (): Promise<UserListItem[]> => {
  const res = await api.get('/users/list');
  return res.data.users;
};

export const updateProfile = async (data: { name?: string; email?: string; bio?: string }) => {
  const res = await api.put('/users/profile', data);
  return res.data;
};

export const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
  const res = await api.put('/users/password', data);
  return res.data;
};
