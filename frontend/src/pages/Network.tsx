import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyNetwork, followUser, type NetworkData } from '../services/feedService';
import { Avatar } from '../components/ui/Avatar';
import { Card } from '../components/ui/Card';
import toast from 'react-hot-toast';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  ORG_ADMIN: 'Org Admin',
  USER: 'Food Producer',
  LAB: 'Nutrition Lab',
  UNIVERSITY: 'University',
  REGULATOR: 'Regulator',
  PROFESSIONAL: 'Consultant',
};

type Tab = 'following' | 'followers' | 'suggestions';

export default function Network() {
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('suggestions');
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getMyNetwork()
      .then((d) => {
        setData(d);
        setFollowingIds(new Set(d.following.map((u) => u.id)));
      })
      .catch(() => toast.error('Failed to load network'))
      .finally(() => setLoading(false));
  }, []);

  const handleFollow = async (userId: string) => {
    try {
      const { following } = await followUser(userId);
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (following) next.add(userId);
        else next.delete(userId);
        return next;
      });
    } catch {
      toast.error('Failed to follow');
    }
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'suggestions', label: 'People you may know', count: data?.suggestions.length ?? 0 },
    { key: 'following', label: 'Following', count: data?.following.length ?? 0 },
    { key: 'followers', label: 'Followers', count: data?.followers.length ?? 0 },
  ];

  const people = tab === 'following' ? data?.following : tab === 'followers' ? data?.followers : data?.suggestions;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Network</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Grow your professional connections in food & nutrition
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              tab === t.key
                ? 'bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-sm'
                : 'bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <div className="p-5 animate-pulse flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 dark:bg-neutral-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-2/3" />
                  <div className="h-2.5 bg-gray-200 dark:bg-neutral-700 rounded w-1/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (people?.length ?? 0) === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">No connections yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start following people to build your network</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {people?.map((person) => {
            const isFollowing = followingIds.has(person.id);
            return (
              <Card key={person.id} hover>
                <div className="p-4 flex items-center gap-3">
                  <Link to={`/profile/${person.id}`} className="flex-shrink-0">
                    <Avatar name={person.name} size="lg" src={person.avatarUrl ?? undefined} />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/profile/${person.id}`}
                      className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 truncate block transition-colors"
                    >
                      {person.name}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {ROLE_LABELS[person.role] ?? person.role}
                    </p>
                  </div>
                  <button
                    onClick={() => handleFollow(person.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${
                      isFollowing
                        ? 'border border-gray-300 dark:border-neutral-600 text-gray-600 dark:text-gray-400 hover:border-red-300 hover:text-red-500'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
