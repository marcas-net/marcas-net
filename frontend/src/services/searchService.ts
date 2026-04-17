import api from './api';

export interface SearchResults {
  organizations: { id: string; name: string; type: string; _count: { members: number } }[];
  documents: { id: string; title: string; fileType: string | null; organizationId: string; organization: { name: string } }[];
  users: { id: string; name: string | null; role: string; avatarUrl?: string | null }[];
  posts: { id: string; content: string; category: string; author: { id: string; name: string | null }; createdAt: string }[];
  jobs: { id: string; title: string; location: string | null; type: string; organization: { name: string } }[];
}

export const search = async (q: string): Promise<SearchResults> => {
  const res = await api.get('/search', { params: { q } });
  return res.data;
};
