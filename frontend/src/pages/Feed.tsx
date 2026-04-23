import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getPosts, getRankedFeed, getFollowingFeed, logFeedEvent, createPost, deletePost,
  type Post, type Comment,
} from '../services/feedService';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { RightPanel } from '../components/feed/RightPanel';
import { CreatePostCard } from '../components/feed/CreatePostCard';
import { PostCard } from '../components/feed/PostCard';
import { StoryCircles } from '../components/feed/StoryCircles';
import { Avatar } from '../components/ui/Avatar';
import toast from 'react-hot-toast';

type FeedTab = 'foryou' | 'following' | 'sourcing';

const FEED_TABS: { value: FeedTab; label: string }[] = [
  { value: 'foryou', label: 'For You' },
  { value: 'following', label: 'Following' },
  { value: 'sourcing', label: 'Sourcing' },
];

const CATEGORIES = [
  { value: 'ALL', label: 'All' },
  { value: 'GENERAL', label: 'General' },
  { value: 'SUPPLY_OFFER', label: 'Supply Offers' },
  { value: 'PARTNERSHIP_REQUEST', label: 'Partnerships' },
  { value: 'INDUSTRY_ANNOUNCEMENT', label: 'Announcements' },
] as const;

export default function Feed() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedTab, setFeedTab] = useState<FeedTab>('foryou');
  const [category, setCategory] = useState('ALL');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newPostAuthors, setNewPostAuthors] = useState<{ id: string; name: string; avatarUrl?: string }[]>([]);
  const [mobilePostOpen, setMobilePostOpen] = useState(false);
  const tabRef = useRef<FeedTab>('foryou');
  const categoryRef = useRef<string>('ALL');

  tabRef.current = feedTab;
  categoryRef.current = category;

  const fetchFeed = useCallback((tab: FeedTab, cat: string, pg: number) => {
    if (tab === 'following') {
      return getFollowingFeed(pg, 20).then(r => ({ posts: r.posts, hasMore: r.hasMore }));
    }
    if (tab === 'sourcing') {
      return getPosts('SUPPLY_OFFER').then(posts => ({ posts, hasMore: false }));
    }
    // For You
    if (!cat || cat === 'ALL') {
      return getRankedFeed(pg, 20).then(r => ({ posts: r.posts, hasMore: r.hasMore }));
    }
    return getPosts(cat).then(posts => ({ posts, hasMore: false }));
  }, []);

  const loadPosts = useCallback((tab?: FeedTab, cat?: string) => {
    const t = tab ?? tabRef.current;
    const c = cat ?? categoryRef.current;
    setLoading(true);
    setNewPostAuthors([]);
    setPage(1);
    fetchFeed(t, c, 1)
      .then(({ posts: fetched, hasMore: more }) => {
        setPosts(fetched);
        setHasMore(more);
      })
      .catch(() => toast.error('Failed to load posts'))
      .finally(() => setLoading(false));
  }, [fetchFeed]);

  const loadMorePosts = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    fetchFeed(tabRef.current, categoryRef.current, nextPage)
      .then(({ posts: more, hasMore: stillMore }) => {
        setPosts(prev => [...prev, ...more]);
        setHasMore(stillMore);
        setPage(nextPage);
      })
      .catch(() => toast.error('Failed to load more posts'))
      .finally(() => setLoadingMore(false));
  }, [page, hasMore, loadingMore, fetchFeed]);

  // Reload when tab or category changes
  useEffect(() => {
    loadPosts(feedTab, category);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedTab, category]);

  // WebSocket: track new post authors
  useEffect(() => {
    if (!socket) return;
    const handler = (data: { postId: string; author: { id: string; name: string; avatarUrl?: string } }) => {
      if (data.author.id === user?.id) return;
      setNewPostAuthors(prev => {
        if (prev.some(a => a.id === data.author.id)) return prev;
        return [data.author, ...prev].slice(0, 8);
      });
    };
    socket.on('post:created', handler);
    return () => { socket.off('post:created', handler); };
  }, [socket, user?.id]);

  // Mobile: open post modal when FAB fires event
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth < 768) setMobilePostOpen(true);
    };
    window.addEventListener('openCreatePost', handler);
    return () => window.removeEventListener('openCreatePost', handler);
  }, []);

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
    setPosts(prev => [post, ...prev]);
    toast.success('Post published');
    setMobilePostOpen(false);
  };

  const handleRepost = (post: Post) => {
    setPosts(prev => [post, ...prev]);
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
      toast.success('Post deleted');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const handleLikeToggle = (postId: string, liked: boolean, count: number) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likedByMe: liked, likesCount: count } : p));
    logFeedEvent(postId, liked ? 'LIKE' : 'CLICK');
  };

  const handleCommentAdded = (postId: string, comment: Comment) => {
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments: [...p.comments, comment], commentsCount: p.commentsCount + 1 } : p
    ));
    logFeedEvent(postId, 'COMMENT');
  };

  const handleCommentDeleted = (postId: string, commentId: string) => {
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments: p.comments.filter(c => c.id !== commentId), commentsCount: p.commentsCount - 1 } : p
    ));
  };

  const showCategoryFilters = feedTab !== 'sourcing';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
      {/* ─── Center Feed ─── */}
      <div className="space-y-3 min-w-0">
        {/* Story Circles */}
        <StoryCircles
          newPostAuthors={newPostAuthors}
          onRefresh={() => loadPosts(feedTab, category)}
        />

        {/* Create Post — hidden on mobile (FAB handles it) */}
        <div className="hidden md:block">
          <CreatePostCard onSubmit={handleCreate} />
        </div>

        {/* Feed Source Tabs */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100 dark:border-neutral-700/60">
            {FEED_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => {
                  if (tab.value !== feedTab) {
                    setFeedTab(tab.value);
                    setCategory('ALL');
                  }
                }}
                className={`flex-1 py-3 text-sm font-semibold transition-all relative ${
                  feedTab === tab.value
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700/30'
                }`}
              >
                {tab.label}
                {feedTab === tab.value && (
                  <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Category filters — not shown on Sourcing tab */}
          {showCategoryFilters && (
            <div className="flex gap-1.5 p-3 overflow-x-auto scrollbar-hide">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    category === cat.value
                      ? 'bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-600 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* New Posts Indicator */}
        {newPostAuthors.length > 0 && (
          <button
            onClick={() => loadPosts(feedTab, category)}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-neutral-800 rounded-xl border border-blue-200 dark:border-blue-900/50 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800 transition-all group"
          >
            <div className="flex -space-x-2">
              {newPostAuthors.slice(0, 5).map(a => (
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
            {[1, 2, 3].map(i => (
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
              {feedTab === 'following' ? (
                <>
                  <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">No posts from your network</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Follow users and organizations to see their posts here.</p>
                </>
              ) : feedTab === 'sourcing' ? (
                <>
                  <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">No sourcing offers yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Supply offers from organizations will appear here.</p>
                </>
              ) : (
                <>
                  <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">No posts yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Be the first to share something with the industry!</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => (
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

      {/* ─── Mobile Post Modal ─── */}
      {mobilePostOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-neutral-900 md:hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-neutral-700 flex-shrink-0">
            <button
              onClick={() => setMobilePostOpen(false)}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">New Post</span>
            <div className="w-8" />
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <CreatePostCard onSubmit={handleCreate} defaultExpanded />
          </div>
        </div>
      )}
    </div>
  );
}
