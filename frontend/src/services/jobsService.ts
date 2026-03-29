import api from './api';

export interface Job {
  id: string;
  title: string;
  description: string;
  location: string | null;
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'COLLABORATION';
  isOpen: boolean;
  organizationId: string;
  organization: { id: string; name: string; type: string };
  createdAt: string;
  updatedAt: string;
}

export const getJobs = async (type?: string): Promise<Job[]> => {
  const params = type && type !== 'ALL' ? { type } : {};
  const res = await api.get('/jobs', { params });
  return res.data.jobs;
};

export const getJobById = async (id: string): Promise<Job> => {
  const res = await api.get(`/jobs/${id}`);
  return res.data.job;
};

export const createJob = async (data: {
  title: string;
  description: string;
  location?: string;
  type?: string;
}): Promise<Job> => {
  const res = await api.post('/jobs', data);
  return res.data.job;
};

export const closeJob = async (id: string): Promise<Job> => {
  const res = await api.patch(`/jobs/${id}/close`);
  return res.data.job;
};
