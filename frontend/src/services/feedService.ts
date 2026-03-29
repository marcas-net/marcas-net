import api from './api';

export interface Post {
  id: string;
  title: string;
  content: string;
  category: 'SUPPLY_OFFER' | 'PARTNERSHIP_REQUEST' | 'INDUSTRY_ANNOUNCEMENT' | 'GENERAL';
  authorId: string;
  author: { id: string; name: string; role: string };
  organizationId: string | null;
  organization: { id: string; name: string; type: string } | null;
  createdAt: string;
  updatedAt: string;
}

export const getPosts = async (category?: string): Promise<Post[]> => {
  const params = category && category !== 'ALL' ? { category } : {};
  const res = await api.get('/feed', { params });
  return res.data.posts;
};

export const getPostById = async (id: string): Promise<Post> => {
  const res = await api.get(`/feed/${id}`);
  return res.data.post;
};

export const createPost = async (data: {
  title: string;
  content: string;
  category?: string;
}): Promise<Post> => {
  const res = await api.post('/feed', data);
  return res.data.post;
};

export const deletePost = async (id: string): Promise<void> => {
  await api.delete(`/feed/${id}`);
};
