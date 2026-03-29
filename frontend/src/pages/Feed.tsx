import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPosts, createPost, deletePost, type Post } from '../services/feedService';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'ALL', label: 'All Posts' },
  { value: 'SUPPLY_OFFER', label: 'Supply Offers' },
  { value: 'PARTNERSHIP_REQUEST', label: 'Partnership Requests' },
  { value: 'INDUSTRY_ANNOUNCEMENT', label: 'Announcements' },
  { value: 'GENERAL', label: 'General' },
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

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'GENERAL' });
  const [submitting, setSubmitting] = useState(false);

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
    if (!form.title.trim() || !form.content.trim()) {
      return toast.error('Title and content are required');
    }
    setSubmitting(true);
    try {
      const post = await createPost(form);
      setPosts((prev) => [post, ...prev]);
      setForm({ title: '', content: '', category: 'GENERAL' });
      setShowForm(false);
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

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Industry Feed</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Stay updated with supply offers, partnerships, and industry news
          </p>
        </div>
        <Button size="md" onClick={() => setShowForm(!showForm)}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Post
        </Button>
      </div>

      {/* Create Post Form */}
      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Create Post</h3>
            <Input
              placeholder="Post title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <textarea
              placeholder="What would you like to share with the industry?"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
              rows={4}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            />
            <div className="flex items-center gap-3">
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              >
                <option value="GENERAL">General</option>
                <option value="SUPPLY_OFFER">Supply Offer</option>
                <option value="PARTNERSHIP_REQUEST">Partnership Request</option>
                <option value="INDUSTRY_ANNOUNCEMENT">Announcement</option>
              </select>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <Button size="md" disabled={submitting}>
                {submitting ? 'Publishing…' : 'Publish'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Category Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              category === cat.value
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
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
            <Card key={i}>
              <div className="p-5 animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
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
            <p className="text-slate-500 dark:text-slate-400 text-sm">No posts yet. Be the first to share!</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <div className="p-5">
                {/* Post Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={post.author.name} size="sm" />
                    <div>
                      <Link
                        to={`/profile/${post.author.id}`}
                        className="text-sm font-semibold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        {post.author.name}
                      </Link>
                      {post.organization && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {post.organization.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={categoryVariant[post.category] || 'gray'}>
                      {categoryLabel[post.category] || post.category}
                    </Badge>
                    <span className="text-xs text-slate-400">{timeAgo(post.createdAt)}</span>
                  </div>
                </div>

                {/* Post Content */}
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5">
                  {post.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </p>

                {/* Post Actions */}
                {(post.authorId === user?.id || user?.role === 'ADMIN') && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-xs text-red-500 hover:text-red-600 font-medium"
                    >
                      Delete Post
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
