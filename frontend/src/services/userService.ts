import api from './api';

export const updateProfile = async (data: { name?: string; email?: string }) => {
  const res = await api.put('/users/profile', data);
  return res.data;
};

export const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
  const res = await api.put('/users/password', data);
  return res.data;
};
