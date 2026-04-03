import api from './api';

export interface Comment {
  id: string;
  content: string;
  userId: string;
  user: { id: string; name: string; avatarUrl: string | null };
  postId: string;
  createdAt: string;
}

export interface PostMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  filename: string;
  size: number;
}

export interface Post {
  id: string;
  content: string;
  category: 'SUPPLY_OFFER' | 'PARTNERSHIP_REQUEST' | 'INDUSTRY_ANNOUNCEMENT' | 'GENERAL';
  authorId: string;
  author: { id: string; name: string; role: string; avatarUrl: string | null };
  organizationId: string | null;
  organization: { id: string; name: string; type: string } | null;
  media: PostMedia[];
  comments: Comment[];
  likedByMe: boolean;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Posts ───────────────────────────────────────────────

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
  content: string;
  category?: string;
  media?: File[];
}): Promise<Post> => {
  const formData = new FormData();
  formData.append('content', data.content);
  if (data.category) formData.append('category', data.category);
  if (data.media) {
    data.media.forEach((file) => formData.append('media', file));
  }
  const res = await api.post('/feed', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.post;
};

export const deletePost = async (id: string): Promise<void> => {
  await api.delete(`/feed/${id}`);
};

// ─── Comments ────────────────────────────────────────────

export const addComment = async (postId: string, content: string): Promise<Comment> => {
  const res = await api.post(`/feed/${postId}/comments`, { content });
  return res.data.comment;
};

export const deleteComment = async (postId: string, commentId: string): Promise<void> => {
  await api.delete(`/feed/${postId}/comments/${commentId}`);
};

// ─── Likes ───────────────────────────────────────────────

export const toggleLike = async (postId: string): Promise<{ liked: boolean; likesCount: number }> => {
  const res = await api.post(`/feed/${postId}/like`);
  return res.data;
};

// ─── Follows ─────────────────────────────────────────────

export const followUser = async (userId: string): Promise<{ following: boolean }> => {
  const res = await api.post(`/feed/social/follow/user/${userId}`);
  return res.data;
};

export const followOrg = async (orgId: string): Promise<{ following: boolean }> => {
  const res = await api.post(`/feed/social/follow/org/${orgId}`);
  return res.data;
};

export const getFollowStatus = async (params: { userId?: string; orgId?: string }): Promise<{ following: boolean }> => {
  const res = await api.get('/feed/social/follow-status', { params });
  return res.data;
};

export const getFollowCounts = async (params: { userId?: string; orgId?: string }): Promise<{ followers: number; following: number }> => {
  const res = await api.get('/feed/social/follow-counts', { params });
  return res.data;
};
