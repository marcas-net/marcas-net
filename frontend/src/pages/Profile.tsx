import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { getUserPosts } from '../services/userService';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { PostCard } from '../components/feed/PostCard';
import { roleVariant } from '../styles/design-system';
import type { Post, Comment } from '../services/feedService';
import toast from 'react-hot-toast';

interface ProfileData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatarUrl?: string | null;
  organizationId?: string | null;
  organization?: { id: string; name: string; type: string } | null;
  createdAt: string;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'media'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  useEffect(() => {
    authService.getProfile()
      .then((data) => setProfile(data.user))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    setPostsLoading(true);
    getUserPosts(user.id, activeTab)
      .then(setPosts)
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  }, [user?.id, activeTab]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const display = profile ?? user;
  const role = display?.role ?? 'USER';
  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your account information</p>
      </div>

      {/* Profile card */}
      <Card padding="lg">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={display?.name ?? display?.email} size="xl" src={display?.avatarUrl ?? undefined} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{display?.name ?? 'No name set'}</h2>
              <Badge variant={roleVariant[role] ?? 'blue'}>{role}</Badge>
            </div>
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
              {display?.name ?? display?.email}
            </p>
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">{display?.email}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
              <span>{role}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span>Member since {joinDate}</span>
              {profile?.organization && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="font-medium text-blue-600">{profile.organization.name}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Organization */}
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-4">Organization</p>
          {profile?.organization ? (
            <div className="space-y-3">
              {[
                { label: 'Name', value: profile.organization.name },
                { label: 'Type', value: profile.organization.type.charAt(0) + profile.organization.type.slice(1).toLowerCase() },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm py-1.5 border-b border-gray-50 dark:border-neutral-700/80 last:border-0">
                  <span className="text-slate-400">{row.label}</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-slate-400 mb-4">Not part of any organization</p>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/orgs'}>
                Browse Organizations
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Posts / Media Tabs */}
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

      {postsLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-sm">No {activeTab === 'media' ? 'media posts' : 'posts'} yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              userId={user?.id}
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

      {/* Danger zone */}
      <Card>
        <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-4">Session</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Sign out</p>
            <p className="text-xs text-slate-400">End your current session</p>
          </div>
          <Button variant="danger" size="sm" onClick={logout}>Sign out</Button>
        </div>
      </Card>
    </div>
  );
}
