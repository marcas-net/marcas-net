import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  getPosts, createPost, deletePost, toggleLike, addComment, deleteComment,
  type Post, type Comment,
} from '../services/feedService';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'ALL', label: 'All' },
  { value: 'GENERAL', label: 'General' },
  { value: 'SUPPLY_OFFER', label: 'Supply Offers' },
  { value: 'PARTNERSHIP_REQUEST', label: 'Partnerships' },
  { value: 'INDUSTRY_ANNOUNCEMENT', label: 'Announcements' },
] as const;

const categoryVariant: Record<string, 'blue' | 'green' | 'yellow' | 'purple' | 'gray'> = {
  SUPPLY_OFFER: 'green',
  PARTNERSHIP_REQUEST: 'blue',
  INDUSTRY_ANNOUNCEMENT: 'yellow',
  GENERAL: 'gray',
};

const categoryLabel: Record<string, string> = {
  SUPPLY_OFFER: 'Supply Offer',
  PARTNERSHIP_REQUEST: 'Partnership',
  INDUSTRY_ANNOUNCEMENT: 'Announcement',
  GENERAL: 'General',
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  ORG_ADMIN: 'Org Admin',
  USER: 'Food Producer',
  LAB: 'Nutrition Lab',
  UNIVERSITY: 'University',
  REGULATOR: 'Regulator',
  PROFESSIONAL: 'Consultant',
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

// ─── Post Card ──────────────────────────────────────────

function PostCard({ post, userId, onDelete, onLikeToggle, onCommentAdded, onCommentDeleted }: {
  post: Post;
  userId?: string;
  onDelete: (id: string) => void;
  onLikeToggle: (postId: string, liked: boolean, count: number) => void;
  onCommentAdded: (postId: string, comment: Comment) => void;
  onCommentDeleted: (postId: string, commentId: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liking, setLiking] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const { liked, likesCount } = await toggleLike(post.id);
      onLikeToggle(post.id, liked, likesCount);
    } catch {
      toast.error('Failed to like post');
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const comment = await addComment(post.id, commentText.trim());
      onCommentAdded(post.id, comment);
      setCommentText('');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(post.id, commentId);
      onCommentDeleted(post.id, commentId);
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  return (
    <Card padding="none">
      <div className="p-5">
        {/* Author Row */}
        <div className="flex items-start gap-3 mb-3">
          <Link to={`/profile/${post.author.id}`}>
            <Avatar name={post.author.name} size="md" src={post.author.avatarUrl ?? undefined} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                to={`/profile/${post.author.id}`}
                className="text-sm font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate"
              >
                {post.author.name}
              </Link>
              <span className="text-xs text-slate-400">&middot;</span>
              <span className="text-xs text-slate-400">{timeAgo(post.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {ROLE_LABELS[post.author.role] ?? post.author.role}
              </span>
              {post.organization && (
                <>
                  <span className="text-xs text-slate-300 dark:text-slate-600">·</span>
                  <Link to={`/orgs/${post.organizationId}`} className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 truncate">
                    {post.organization.name}
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={categoryVariant[post.category] || 'gray'}>
              {categoryLabel[post.category] || post.category}
            </Badge>
            {(post.authorId === userId) && (
              <button
                onClick={() => onDelete(post.id)}
                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                title="Delete post"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>

        {/* Stats Row */}
        {(post.likesCount > 0 || post.commentsCount > 0) && (
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
            {post.likesCount > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                {post.likesCount}
              </span>
            )}
            {post.commentsCount > 0 && (
              <button onClick={() => setShowComments(!showComments)} className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                {post.commentsCount} comment{post.commentsCount !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="border-t border-slate-100 dark:border-slate-800 px-2 py-1 flex">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-colors ${
            post.likedByMe
              ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <svg className="w-4 h-4" fill={post.likedByMe ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          Like
        </button>
        <button
          onClick={() => {
            setShowComments(!showComments);
            if (!showComments) setTimeout(() => commentInputRef.current?.focus(), 100);
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Comment
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-3 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
          {/* Existing comments */}
          {post.comments.map((c) => (
            <div key={c.id} className="flex gap-2.5 group">
              <Link to={`/profile/${c.user.id}`} className="flex-shrink-0 mt-0.5">
                <Avatar name={c.user.name} size="xs" src={c.user.avatarUrl ?? undefined} />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="bg-white dark:bg-slate-800 rounded-xl px-3 py-2 inline-block max-w-full">
                  <Link to={`/profile/${c.user.id}`} className="text-xs font-semibold text-slate-900 dark:text-white hover:text-blue-600">
                    {c.user.name}
                  </Link>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{c.content}</p>
                </div>
                <div className="flex items-center gap-3 mt-1 px-1">
                  <span className="text-[10px] text-slate-400">{timeAgo(c.createdAt)}</span>
                  {c.userId === userId && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-[10px] text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Comment input */}
          <form onSubmit={handleComment} className="flex gap-2.5">
            <Avatar name={undefined} size="xs" />
            <input
              ref={commentInputRef}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              disabled={submittingComment}
              className="flex-1 px-3 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
            {commentText.trim() && (
              <button
                type="submit"
                disabled={submittingComment}
                className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Post
              </button>
            )}
          </form>
        </div>
      )}
    </Card>
  );
}

// ─── Main Feed ──────────────────────────────────────────

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('ALL');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('GENERAL');
  const [submitting, setSubmitting] = useState(false);
  const [showCategorySelect, setShowCategorySelect] = useState(false);

  const loadPosts = (cat?: string) => {
    setLoading(true);
    getPosts(cat)
      .then(setPosts)
      .catch(() => toast.error('Failed to load posts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts(category);
  }, [category]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    setSubmitting(true);
    try {
      const post = await createPost({ content: newPostContent.trim(), category: newPostCategory });
      setPosts((prev) => [post, ...prev]);
      setNewPostContent('');
      setNewPostCategory('GENERAL');
      setShowCategorySelect(false);
      toast.success('Post published');
    } catch {
      toast.error('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Post deleted');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const handleLikeToggle = (postId: string, liked: boolean, count: number) => {
    setPosts((prev) =>
      prev.map((p) => p.id === postId ? { ...p, likedByMe: liked, likesCount: count } : p)
    );
  };

  const handleCommentAdded = (postId: string, comment: Comment) => {
    setPosts((prev) =>
      prev.map((p) => p.id === postId
        ? { ...p, comments: [...p.comments, comment], commentsCount: p.commentsCount + 1 }
        : p
      )
    );
  };

  const handleCommentDeleted = (postId: string, commentId: string) => {
    setPosts((prev) =>
      prev.map((p) => p.id === postId
        ? { ...p, comments: p.comments.filter((c) => c.id !== commentId), commentsCount: p.commentsCount - 1 }
        : p
      )
    );
  };

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-6">
      {/* ─── Left Sidebar ─── */}
      <aside className="hidden lg:block space-y-4">
        {/* Profile Card */}
        <Card padding="none">
          <div className="bg-gradient-to-r from-blue-600 to-emerald-500 h-16 rounded-t-2xl" />
          <div className="px-4 pb-4 -mt-5">
            <Link to="/profile">
              <Avatar name={user?.name ?? user?.email} size="lg" src={user?.avatarUrl ?? undefined} className="ring-3 ring-white dark:ring-gray-900" />
            </Link>
            <Link to="/profile" className="block mt-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                {user?.name ?? 'User'}
              </p>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
            </p>
            {user?.organization && (
              <Link to={`/orgs/${user.organizationId}`} className="text-xs text-blue-600 hover:underline mt-1 block">
                {user.organization.name}
              </Link>
            )}
          </div>
        </Card>

        {/* Quick Nav */}
        <Card padding="sm">
          <nav className="space-y-0.5">
            {[
              { href: '/orgs', label: 'My Organizations', icon: '🏢' },
              { href: '/jobs', label: 'Job Board', icon: '💼' },
              { href: '/profile', label: 'My Profile', icon: '👤' },
            ].map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </Card>
      </aside>

      {/* ─── Center Feed ─── */}
      <div className="space-y-4 min-w-0">
        {/* Create Post */}
        <Card padding="none">
          <form onSubmit={handleCreate} className="p-4">
            <div className="flex gap-3">
              <Avatar name={user?.name ?? user?.email} size="md" src={user?.avatarUrl ?? undefined} />
              <div className="flex-1">
                <textarea
                  placeholder="What's happening in the industry?"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={newPostContent ? 3 : 1}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition-all"
                />
                {newPostContent.trim() && (
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCategorySelect(!showCategorySelect)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {categoryLabel[newPostCategory] || 'General'}
                      </button>
                      {showCategorySelect && (
                        <div className="flex gap-1">
                          {['GENERAL', 'SUPPLY_OFFER', 'PARTNERSHIP_REQUEST', 'INDUSTRY_ANNOUNCEMENT'].map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => { setNewPostCategory(cat); setShowCategorySelect(false); }}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                                newPostCategory === cat
                                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                            >
                              {categoryLabel[cat]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-xs font-semibold hover:shadow-md disabled:opacity-50 transition-all"
                    >
                      {submitting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </form>
        </Card>

        {/* Filter Tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                category === cat.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Posts */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} padding="none">
                <div className="p-5 animate-pulse space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <div className="space-y-1.5">
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32" />
                      <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                    </div>
                  </div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">No posts yet</p>
              <p className="text-xs text-slate-400">Be the first to share something with the industry!</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                userId={user?.id}
                onDelete={handleDelete}
                onLikeToggle={handleLikeToggle}
                onCommentAdded={handleCommentAdded}
                onCommentDeleted={handleCommentDeleted}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── Right Sidebar ─── */}
      <aside className="hidden lg:block space-y-4">
        {/* Trending */}
        <Card padding="sm">
          <p className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wide mb-3 px-1">
            Industry Highlights
          </p>
          <div className="space-y-2.5">
            {[
              { label: 'Food Safety Compliance 2025', tag: 'Regulation' },
              { label: 'Sustainable Packaging Trends', tag: 'Industry' },
              { label: 'Nutrition Label Requirements', tag: 'Compliance' },
            ].map((item, i) => (
              <div key={i} className="px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{item.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{item.tag}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Links */}
        <Card padding="sm">
          <p className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wide mb-3 px-1">
            Quick Links
          </p>
          <div className="space-y-1">
            {[
              { to: '/orgs', label: 'Browse Organizations' },
              { to: '/jobs', label: 'Find Opportunities' },
              { to: '/dashboard/settings', label: 'Account Settings' },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block px-3 py-2 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </Card>

        {/* Footer */}
        <div className="px-3 text-[10px] text-slate-400 space-y-1">
          <p>&copy; {new Date().getFullYear()} MarcasNet. All rights reserved.</p>
        </div>
      </aside>
    </div>
  );
}
