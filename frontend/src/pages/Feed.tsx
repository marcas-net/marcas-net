import { useEffect, useState, useCallback } from 'react';
import {
  getPosts, getRankedFeed, logFeedEvent, createPost, deletePost,
  type Post, type Comment,
} from '../services/feedService';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { RightPanel } from '../components/feed/RightPanel';
import { CreatePostCard } from '../components/feed/CreatePostCard';
import { PostCard } from '../components/feed/PostCard';
import { Avatar } from '../components/ui/Avatar';
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
  const { socket } = useSocket();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('ALL');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newPostAuthors, setNewPostAuthors] = useState<{ id: string; name: string; avatarUrl?: string }[]>([]);

  const loadPosts = useCallback((cat?: string) => {
    setLoading(true);
    setNewPostAuthors([]);
    setPage(1);

    // Use ranked feed for "ALL", fallback to category-filtered
    const fetchPromise = (!cat || cat === 'ALL')
      ? getRankedFeed(1, 20).then(result => {
          setHasMore(result.hasMore);
          return result.posts;
        })
      : getPosts(cat).then(posts => {
          setHasMore(false);
          return posts;
        });

    fetchPromise
      .then(setPosts)
      .catch(() => toast.error('Failed to load posts'))
      .finally(() => setLoading(false));
  }, []);

  const loadMorePosts = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    getRankedFeed(nextPage, 20)
      .then(result => {
        setPosts(prev => [...prev, ...result.posts]);
        setHasMore(result.hasMore);
        setPage(nextPage);
      })
      .catch(() => toast.error('Failed to load more posts'))
      .finally(() => setLoadingMore(false));
  }, [page, hasMore, loadingMore]);

  useEffect(() => {
    loadPosts(category);
  }, [category, loadPosts]);

  // Listen for new posts from other users
  useEffect(() => {
    if (!socket) return;
    const handler = (data: { postId: string; author: { id: string; name: string; avatarUrl?: string } }) => {
      if (data.author.id === user?.id) return; // Skip own posts
      setNewPostAuthors(prev => {
        if (prev.some(a => a.id === data.author.id)) return prev;
        return [data.author, ...prev].slice(0, 8);
      });
    };
    socket.on('post:created', handler);
    return () => { socket.off('post:created', handler); };
  }, [socket, user?.id]);

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
    logFeedEvent(postId, liked ? 'LIKE' : 'CLICK');
  };

  const handleCommentAdded = (postId: string, comment: Comment) => {
    setPosts((prev) =>
      prev.map((p) => p.id === postId
        ? { ...p, comments: [...p.comments, comment], commentsCount: p.commentsCount + 1 }
        : p
      )
    );
    logFeedEvent(postId, 'COMMENT');
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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
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

        {/* New Posts Indicator */}
        {newPostAuthors.length > 0 && (
          <button
            onClick={() => loadPosts(category)}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-neutral-800 rounded-xl border border-blue-200 dark:border-blue-900/50 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800 transition-all group"
          >
            <div className="flex -space-x-2">
              {newPostAuthors.slice(0, 5).map((a) => (
                <div key={a.id} className="ring-2 ring-white dark:ring-neutral-800 rounded-full">
                  <Avatar name={a.name} size="xs" src={a.avatarUrl ?? undefined} />
                </div>
              ))}
            </div>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
              {newPostAuthors.length === 1
                ? `${newPostAuthors[0].name} posted`
                : `${newPostAuthors[0].name} and ${newPostAuthors.length - 1} other${newPostAuthors.length > 2 ? 's' : ''} posted`
              } — tap to refresh
            </span>
            <svg className="w-4 h-4 ml-auto text-blue-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}

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
                onPostEdited={(postId, updated) =>
                  setPosts(prev => prev.map(p => p.id === postId ? updated : p))
                }
              />
            ))}
            {hasMore && (
              <div className="flex justify-center py-4">
                <button
                  onClick={loadMorePosts}
                  disabled={loadingMore}
                  className="px-6 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
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
