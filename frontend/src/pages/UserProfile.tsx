import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getUserById, getUserPosts, type PublicUser } from '../services/userService';
import { followUser, getFollowStatus, getFollowCounts, type Post, type Comment } from '../services/feedService';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { PostCard } from '../components/feed/PostCard';
import { roleVariant } from '../styles/design-system';
import toast from 'react-hot-toast';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  ORG_ADMIN: 'Org Admin',
  USER: 'Food Producer',
  LAB: 'Nutrition Lab',
  UNIVERSITY: 'University / Research',
  REGULATOR: 'Regulator',
  PROFESSIONAL: 'Professional / Consultant',
};

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'media'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getUserById(id),
      getFollowCounts({ userId: id }),
      me?.id !== id ? getFollowStatus({ userId: id }) : Promise.resolve({ following: false }),
    ])
      .then(([userData, counts, status]) => {
        setUser(userData);
        setFollowCounts(counts);
        setIsFollowing(status.following);
      })
      .catch(() => toast.error('User not found'))
      .finally(() => setLoading(false));
  }, [id, me?.id]);

  useEffect(() => {
    if (!id) return;
    setPostsLoading(true);
    getUserPosts(id, activeTab)
      .then(setPosts)
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  }, [id, activeTab]);

  const handleFollow = async () => {
    if (!id || followLoading) return;
    setFollowLoading(true);
    try {
      const { following } = await followUser(id);
      setIsFollowing(following);
      setFollowCounts((prev) => ({
        ...prev,
        followers: following ? prev.followers + 1 : prev.followers - 1,
      }));
    } catch {
      toast.error('Failed to follow user');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="text-center py-20 text-slate-400">User not found.</div>
  );

  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const isMe = me?.id === id;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card padding="none">
        <div className="bg-gradient-to-r from-blue-600 to-emerald-500 h-24 rounded-t-2xl" />
        <div className="px-6 pb-6 -mt-8">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <Avatar name={user.name ?? user.email} size="xl" src={user.avatarUrl ?? undefined} className="ring-4 ring-white dark:ring-neutral-800" />
            <div className="flex-1 mt-2 sm:mt-8">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{user.name ?? 'Unnamed'}</h1>
                <Badge variant={roleVariant[user.role] ?? 'blue'}>{ROLE_LABELS[user.role] ?? user.role}</Badge>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{user.email}</p>
              {user.organization && (
                <Link to={`/orgs/${user.organization.id}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1 inline-block">
                  {user.organization.name} · {user.organization.type.charAt(0) + user.organization.type.slice(1).toLowerCase()}
                </Link>
              )}
              <div className="flex items-center gap-4 mt-3">
                <span className="text-sm text-slate-900 dark:text-white font-semibold">{followCounts.followers} <span className="font-normal text-slate-500 dark:text-slate-400">followers</span></span>
                <span className="text-sm text-slate-900 dark:text-white font-semibold">{followCounts.following} <span className="font-normal text-slate-500 dark:text-slate-400">following</span></span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Joined {joinDate}</p>
            </div>
            {!isMe && (
              <div className="flex gap-2 sm:mt-8">
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                    isFollowing
                      ? 'border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={() => navigate(`/messages?to=${id}`)}
                  className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Message
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Bio */}
      {user.bio && (
        <Card>
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-3">About</p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{user.bio}</p>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-neutral-700/80">
        {(['posts', 'media'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Posts / Media content */}
      {postsLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-sm">No {activeTab === 'media' ? 'media posts' : 'posts'} yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              userId={me?.id}
              onDelete={() => setPosts(prev => prev.filter(p => p.id !== post.id))}
              onLikeToggle={(postId, liked, count) =>
                setPosts(prev => prev.map(p => p.id === postId ? { ...p, likedByMe: liked, likesCount: count } : p))
              }
              onCommentAdded={(postId, comment: Comment) =>
                setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, comment], commentsCount: p.commentsCount + 1 } : p))
              }
              onCommentDeleted={(postId, commentId) =>
                setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: p.comments.filter(c => c.id !== commentId), commentsCount: p.commentsCount - 1 } : p))
              }
              onPostEdited={(postId, updated) =>
                setPosts(prev => prev.map(p => p.id === postId ? updated : p))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
