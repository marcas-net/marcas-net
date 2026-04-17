import api from './api';

export interface Job {
  id: string;
  title: string;
  description: string;
  location: string | null;
  salary: string | null;
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'COLLABORATION';
  isOpen: boolean;
  organizationId: string;
  organization: { id: string; name: string; type: string };
  postedBy: { id: string; name: string; avatarUrl: string | null } | null;
  applicationsCount: number;
  applied: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  coverLetter: string | null;
  status: string;
  createdAt: string;
  job?: Job;
  user?: { id: string; name: string; avatarUrl: string | null; role: string };
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
  salary?: string;
  type?: string;
}): Promise<Job> => {
  const res = await api.post('/jobs', data);
  return res.data.job;
};

export const closeJob = async (id: string): Promise<Job> => {
  const res = await api.patch(`/jobs/${id}/close`);
  return res.data.job;
};

export const applyToJob = async (id: string, coverLetter?: string): Promise<JobApplication> => {
  const res = await api.post(`/jobs/${id}/apply`, { coverLetter });
  return res.data.application;
};

export const getMyApplications = async (): Promise<JobApplication[]> => {
  const res = await api.get('/jobs/my-applications');
  return res.data.applications;
};
