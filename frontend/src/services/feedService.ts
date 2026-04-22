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

export interface PollOption {
  id: string;
  text: string;
  votesCount: number;
  votedByMe?: boolean;
}

export interface Post {
  id: string;
  content: string;
  type: 'POST' | 'POLL' | 'EVENT';
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
  repostsCount: number;
  // Repost fields
  repostOfId: string | null;
  repostOf: Post | null;
  // Poll fields
  pollQuestion: string | null;
  pollOptions: PollOption[];
  pollEndsAt: string | null;
  // Event fields
  eventTitle: string | null;
  eventDate: string | null;
  eventLocation: string | null;
  eventLink: string | null;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NetworkPerson {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  bio: string | null;
  country: string | null;
  organization: { id: string; name: string; type: string; isVerified: boolean } | null;
  followersCount: number;
  mutualConnections?: number;
  mutualAvatars?: { id: string; name: string; avatarUrl: string | null }[];
}

export interface NetworkData {
  following: NetworkPerson[];
  followers: NetworkPerson[];
  suggestions: NetworkPerson[];
}

// ─── Posts ───────────────────────────────────────────────

export const getPosts = async (category?: string): Promise<Post[]> => {
  const params = category && category !== 'ALL' ? { category } : {};
  const res = await api.get('/feed', { params });
  return res.data.posts;
};

export const getFollowingFeed = async (page = 1, limit = 20): Promise<{
  posts: Post[];
  page: number;
  hasMore: boolean;
  total: number;
}> => {
  const res = await api.get('/feed/following', { params: { page: String(page), limit: String(limit) } });
  return res.data;
};

export const getRankedFeed = async (page = 1, limit = 20, searches?: string[]): Promise<{
  posts: Post[];
  page: number;
  hasMore: boolean;
  total: number;
}> => {
  const params: Record<string, string> = { page: String(page), limit: String(limit) };
  if (searches?.length) params.searches = searches.join(',');
  const res = await api.get('/feed/ranked', { params });
  return res.data;
};

export const logFeedEvent = async (postId: string, action: 'VIEW' | 'CLICK' | 'LIKE' | 'COMMENT' | 'HIDE' | 'SHARE'): Promise<void> => {
  await api.post('/feed/event', { postId, action }).catch(() => {});
};

export const getPostById = async (id: string): Promise<Post> => {
  const res = await api.get(`/feed/${id}`);
  return res.data.post;
};

export const createPost = async (data: {
  content: string;
  category?: string;
  type?: 'POST' | 'POLL' | 'EVENT';
  media?: File[];
  pollQuestion?: string;
  pollOptions?: string[];
  pollDuration?: number;
  eventTitle?: string;
  eventDate?: string;
  eventLocation?: string;
  eventLink?: string;
}): Promise<Post> => {
  const formData = new FormData();
  formData.append('content', data.content);
  if (data.category) formData.append('category', data.category);
  if (data.type) formData.append('type', data.type);
  if (data.media) {
    data.media.forEach((file) => formData.append('media', file));
  }
  if (data.pollQuestion) formData.append('pollQuestion', data.pollQuestion);
  if (data.pollOptions) formData.append('pollOptions', JSON.stringify(data.pollOptions));
  if (data.pollDuration) formData.append('pollDuration', String(data.pollDuration));
  if (data.eventTitle) formData.append('eventTitle', data.eventTitle);
  if (data.eventDate) formData.append('eventDate', data.eventDate);
  if (data.eventLocation) formData.append('eventLocation', data.eventLocation);
  if (data.eventLink) formData.append('eventLink', data.eventLink);
  const res = await api.post('/feed', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000, // 2 min for large video uploads
  });
  return res.data.post;
};

export const deletePost = async (id: string): Promise<void> => {
  await api.delete(`/feed/${id}`);
};

export const editPost = async (id: string, content: string): Promise<Post> => {
  const res = await api.put(`/feed/${id}`, { content });
  return res.data.post;
};

// ─── Reposts ─────────────────────────────────────────────

export const repostPost = async (postId: string, content?: string): Promise<Post> => {
  const res = await api.post(`/feed/${postId}/repost`, { content });
  return res.data.post;
};

// ─── Polls ───────────────────────────────────────────────

export const votePoll = async (optionId: string): Promise<{ option: PollOption }> => {
  const res = await api.post(`/feed/poll/${optionId}/vote`);
  return res.data;
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

export const followUser = async (userId: string): Promise<{ following: boolean; isConnected: boolean }> => {
  const res = await api.post(`/feed/social/follow/user/${userId}`);
  return res.data;
};

export const followOrg = async (orgId: string): Promise<{ following: boolean }> => {
  const res = await api.post(`/feed/social/follow/org/${orgId}`);
  return res.data;
};

export const getFollowStatus = async (params: { userId?: string; orgId?: string }): Promise<{ following: boolean; isConnected: boolean }> => {
  const res = await api.get('/feed/social/follow-status', { params });
  return res.data;
};

export const getFollowCounts = async (params: { userId?: string; orgId?: string }): Promise<{ followers: number; following: number }> => {
  const res = await api.get('/feed/social/follow-counts', { params });
  return res.data;
};

// ─── Network ─────────────────────────────────────────────

export const getMyNetwork = async (): Promise<NetworkData> => {
  const res = await api.get('/feed/social/network');
  return res.data;
};
