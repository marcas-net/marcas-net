import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyNetwork, followUser, type NetworkData, type NetworkPerson } from '../services/feedService';
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

const VERIFIED_ROLES = ['REGULATOR', 'LAB', 'UNIVERSITY', 'ADMIN'];

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
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <div className="p-4 animate-pulse flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-200 dark:bg-neutral-700 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-200 dark:bg-neutral-700 rounded w-40" />
                  <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-28" />
                  <div className="h-2.5 bg-gray-200 dark:bg-neutral-700 rounded w-24" />
                </div>
                <div className="w-20 h-8 bg-gray-200 dark:bg-neutral-700 rounded-full flex-shrink-0" />
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
        <div className="space-y-3">
          {people?.map((person) => (
            <NetworkCard
              key={person.id}
              person={person}
              isFollowing={followingIds.has(person.id)}
              onFollow={handleFollow}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Network Person Card ────────────────────────────────

function NetworkCard({
  person,
  isFollowing,
  onFollow,
}: {
  person: NetworkPerson;
  isFollowing: boolean;
  onFollow: (id: string) => void;
}) {
  const isVerified = VERIFIED_ROLES.includes(person.role);

  return (
    <Card hover>
      <div className="p-4 flex items-start gap-4">
        {/* Avatar */}
        <Link to={`/profile/${person.id}`} className="flex-shrink-0">
          <Avatar name={person.name ?? 'User'} size="lg" src={person.avatarUrl ?? undefined} />
        </Link>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Link
              to={`/profile/${person.id}`}
              className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 truncate transition-colors"
            >
              {person.name ?? 'User'}
            </Link>
            {isVerified && (
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
            {ROLE_LABELS[person.role] ?? person.role}
          </p>

          {person.organization && (
            <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
              {person.organization.name}
            </p>
          )}

          {person.country && (
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
              {person.country}
            </p>
          )}

          {/* Mutual connections */}
          {(person.mutualConnections ?? 0) > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex -space-x-1.5">
                {(person.mutualAvatars ?? []).slice(0, 3).map((ma) => (
                  <div key={ma.id} className="ring-2 ring-white dark:ring-neutral-800 rounded-full">
                    <Avatar name={ma.name ?? 'User'} size="xs" src={ma.avatarUrl ?? undefined} />
                  </div>
                ))}
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {person.mutualConnections} mutual connection{person.mutualConnections !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Follow Button */}
        <button
          onClick={() => onFollow(person.id)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex-shrink-0 mt-1 ${
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
}
