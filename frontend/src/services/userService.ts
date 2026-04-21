import api from './api';
import type { Post } from './feedService';

export interface PublicUser {
  id: string;
  name: string | null;
  bio: string | null;
  headline: string | null;
  skills: string[];
  role: string;
  avatarUrl?: string | null;
  coverImageUrl?: string | null;
  organizationId: string | null;
  organization: { id: string; name: string; type: string } | null;
  documents: { id: string; title: string; fileType: string | null; createdAt: string }[];
  activityLogs: { id: string; action: string; entityType: string; createdAt: string }[];
  createdAt: string;
}

export interface UserListItem {
  id: string;
  name: string | null;
  bio: string | null;
  role: string;
  avatarUrl?: string | null;
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

export const updateProfile = async (data: { name?: string; email?: string; bio?: string; country?: string; headline?: string; skills?: string[] }) => {
  const res = await api.put('/users/profile', data);
  return res.data;
};

export const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
  const res = await api.put('/users/password', data);
  return res.data;
};

export const uploadAvatar = async (file: File): Promise<{ avatarUrl: string }> => {
  const formData = new FormData();
  formData.append('avatar', file);
  const res = await api.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const uploadCoverImage = async (file: File): Promise<{ coverImageUrl: string }> => {
  const formData = new FormData();
  formData.append('cover', file);
  const res = await api.post('/users/cover', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const getUserPosts = async (userId: string, tab: 'posts' | 'media' = 'posts'): Promise<Post[]> => {
  const res = await api.get(`/users/${userId}/posts`, { params: { tab } });
  return res.data.posts;
};
