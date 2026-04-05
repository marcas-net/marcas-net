import { useEffect, useState } from 'react';
import {
  getPosts, createPost, deletePost,
  type Post, type Comment,
} from '../services/feedService';
import { useAuth } from '../context/AuthContext';
import { LeftSidebar } from '../components/feed/LeftSidebar';
import { RightPanel } from '../components/feed/RightPanel';
import { CreatePostCard } from '../components/feed/CreatePostCard';
import { PostCard } from '../components/feed/PostCard';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'ALL', label: 'All' },
  { value: 'GENERAL', label: 'General' },
  { value: 'SUPPLY_OFFER', label: 'Supply Offers' },
  { value: 'PARTNERSHIP_REQUEST', label: 'Partnerships' },
  { value: 'INDUSTRY_ANNOUNCEMENT', label: 'Announcements' },
] as const;

// ─── Main Feed ──────────────────────────────────────────

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('ALL');

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

  const handleCreate = async (data: {
    content: string;
    category: string;
    type?: 'POST' | 'POLL' | 'EVENT';
    media?: File[];
    pollQuestion?: string;
    pollOptions?: string[];
    pollDuration?: number;
    eventTitle?: string;
    eventDate?: string;
    eventLocation?: string;
    eventLink?: string;
  }) => {
    const post = await createPost(data);
    setPosts((prev) => [post, ...prev]);
    toast.success('Post published');
  };

  const handleRepost = (post: Post) => {
    setPosts((prev) => [post, ...prev]);
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
    <div className="max-w-[1128px] mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr_300px] gap-5">
      {/* ─── Left Sidebar (hidden on mobile/tablet) ─── */}
      <div className="hidden lg:block">
        <div className="sticky top-[68px]">
          <LeftSidebar />
        </div>
      </div>

      {/* ─── Center Feed ─── */}
      <div className="space-y-3 min-w-0">
        {/* Create Post */}
        <CreatePostCard onSubmit={handleCreate} />

        {/* Filter Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                category === cat.value
                  ? 'bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-sm'
                  : 'bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Posts */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 shadow-sm">
                <div className="p-5 animate-pulse space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-neutral-700 rounded-full" />
                    <div className="space-y-1.5">
                      <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-32" />
                      <div className="h-2.5 bg-gray-200 dark:bg-neutral-700 rounded w-20" />
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-full" />
                  <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 shadow-sm">
            <div className="p-12 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">No posts yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Be the first to share something with the industry!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                userId={user?.id}
                onDelete={handleDelete}
                onLikeToggle={handleLikeToggle}
                onCommentAdded={handleCommentAdded}
                onCommentDeleted={handleCommentDeleted}
                onRepost={handleRepost}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── Right Panel (hidden on mobile/tablet) ─── */}
      <div className="hidden lg:block">
        <div className="sticky top-[68px]">
          <RightPanel />
        </div>
      </div>
    </div>
  );
}
