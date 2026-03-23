import api from './api';

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export const getActivity = async (): Promise<ActivityLog[]> => {
  const res = await api.get('/activity');
  return res.data.activity;
};
