import api from './api';

export interface SearchResults {
  organizations: { id: string; name: string; type: string; _count: { members: number } }[];
  documents: { id: string; title: string; fileType: string | null; organizationId: string; organization: { name: string } }[];
  users: { id: string; name: string | null; email: string; role: string }[];
}

export const search = async (q: string): Promise<SearchResults> => {
  const res = await api.get('/search', { params: { q } });
  return res.data;
};
