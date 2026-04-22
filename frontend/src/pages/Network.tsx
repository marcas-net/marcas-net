import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyNetwork, followUser, type NetworkData, type NetworkPerson } from '../services/feedService';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Platform Administrator',
  ORG_ADMIN: 'Organization Admin',
  USER: 'Food Producer',
  LAB: 'Nutrition Laboratory',
  UNIVERSITY: 'University Researcher',
  REGULATOR: 'Food Regulator',
  PROFESSIONAL: 'Food Consultant',
};

const VERIFIED_ROLES = new Set(['REGULATOR', 'LAB', 'UNIVERSITY', 'ADMIN']);

type Tab = 'suggestions' | 'following' | 'followers';

// ─── Skeleton ─────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-neutral-700 flex-shrink-0" />
        <div className="flex-1 space-y-2.5 pt-1">
          <div className="h-3.5 bg-gray-200 dark:bg-neutral-700 rounded-full w-36" />
          <div className="h-2.5 bg-gray-100 dark:bg-neutral-800 rounded-full w-28" />
          <div className="h-2.5 bg-gray-100 dark:bg-neutral-800 rounded-full w-24" />
          <div className="h-2.5 bg-gray-100 dark:bg-neutral-800 rounded-full w-20" />
        </div>
        <div className="w-[72px] h-8 bg-gray-200 dark:bg-neutral-700 rounded-full flex-shrink-0" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────

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
    // Optimistic update
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
    try {
      const { following } = await followUser(userId);
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (following) next.add(userId);
        else next.delete(userId);
        return next;
      });
    } catch {
      // Revert optimistic update
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (next.has(userId)) next.delete(userId);
        else next.add(userId);
        return next;
      });
      toast.error('Failed to update follow');
    }
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'suggestions', label: 'People you may know', count: data?.suggestions.length ?? 0 },
    { key: 'following', label: 'Following', count: data?.following.length ?? 0 },
    { key: 'followers', label: 'Followers', count: data?.followers.length ?? 0 },
  ];

  const people =
    tab === 'following' ? data?.following
    : tab === 'followers' ? data?.followers
    : data?.suggestions;

  return (
    <div className="max-w-2xl mx-auto space-y-7 pb-10">

      {/* ── Header ────────────────────────────────── */}
      <div className="pt-1">
        <h1 className="text-[26px] font-bold tracking-tight text-gray-900 dark:text-white">
          My Network
        </h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Grow your professional connections in the food &amp; nutrition industry
        </p>
      </div>

      {/* ── Tabs ──────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`
              px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 outline-none
              ${tab === t.key
                ? 'bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-[0_2px_12px_rgba(59,130,246,0.35)]'
                : 'bg-white dark:bg-neutral-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400'
              }
            `}
          >
            {t.label}
            <span className={`ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-px text-[10px] font-bold ${
              tab === t.key
                ? 'bg-white/25 text-white'
                : 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Content ───────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : (people?.length ?? 0) === 0 ? (
        <EmptyState tab={tab} />
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

// ─── Empty State ──────────────────────────────────────────

function EmptyState({ tab }: { tab: Tab }) {
  const messages: Record<Tab, { title: string; sub: string }> = {
    suggestions: { title: 'No suggestions right now', sub: 'Check back later as your network grows' },
    following: { title: "You're not following anyone yet", sub: 'Explore suggestions to start connecting' },
    followers: { title: 'No followers yet', sub: 'Share your profile to attract followers' },
  };
  const { title, sub } = messages[tab];
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-14 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-50 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

// ─── Network Card ─────────────────────────────────────────

function NetworkCard({
  person,
  isFollowing,
  onFollow,
}: {
  person: NetworkPerson;
  isFollowing: boolean;
  onFollow: (id: string) => void;
}) {
  const isVerifiedUser = VERIFIED_ROLES.has(person.role);
  const isVerifiedOrg = Boolean(person.organization?.isVerified);
  const hasMutual = (person.mutualConnections ?? 0) > 0;
  const visibleAvatars = (person.mutualAvatars ?? []).slice(0, 3);
  const extraMutual = (person.mutualConnections ?? 0) - visibleAvatars.length;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-5 hover:shadow-[0_4px_24px_rgba(0,0,0,0.07)] dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.25)] transition-shadow duration-200">
      <div className="flex items-start gap-4">

        {/* ── Profile Image ── */}
        <Link to={`/profile/${person.id}`} className="flex-shrink-0 mt-0.5">
          <div className="relative">
            <img
              src={person.avatarUrl ?? '/user-avatar.svg'}
              alt={person.name ?? 'User'}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-100 dark:ring-neutral-700 bg-gray-100 dark:bg-neutral-800"
            />
            {isVerifiedUser && (
              <span className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-neutral-900 rounded-full p-px">
                <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>
        </Link>

        {/* ── Info + Button ── */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Top row: info + button */}
          <div className="flex items-start justify-between gap-3">
            {/* Name + meta */}
            <div className="min-w-0 flex-1">
              {/* Name + verified inline badge */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  to={`/profile/${person.id}`}
                  className="text-[15px] font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-snug"
                >
                  {person.name ?? 'User'}
                </Link>
                {isVerifiedUser && (
                  <svg className="w-[15px] h-[15px] text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              {/* Job Title */}
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {ROLE_LABELS[person.role] ?? person.role}
              </p>

              {/* Company */}
              {person.organization && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Link
                    to={`/orgs/${person.organization.id}`}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                  >
                    {person.organization.name}
                  </Link>
                  {isVerifiedOrg && (
                    <svg className="w-3 h-3 text-emerald-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              )}

              {/* Location */}
              {person.country && (
                <div className="flex items-center gap-1 mt-0.5">
                  <svg className="w-3 h-3 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{person.country}</span>
                </div>
              )}
            </div>

            {/* Follow Button */}
            <button
              onClick={() => onFollow(person.id)}
              className={`
                flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-150 outline-none
                ${isFollowing
                  ? 'border border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-gray-400 hover:border-red-300 dark:hover:border-red-700 hover:text-red-500 dark:hover:text-red-400 bg-transparent'
                  : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-sm hover:shadow-[0_2px_8px_rgba(59,130,246,0.4)] active:scale-95'
                }
              `}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>

          {/* Mutual connections — separated by divider */}
          {hasMutual && (
            <>
              <div className="my-3 border-t border-gray-100 dark:border-neutral-800" />
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {visibleAvatars.map((ma) => (
                    <img
                      key={ma.id}
                      src={ma.avatarUrl ?? '/user-avatar.svg'}
                      alt={ma.name ?? 'User'}
                      title={ma.name ?? 'User'}
                      className="w-5 h-5 rounded-full object-cover ring-[1.5px] ring-white dark:ring-neutral-900 bg-gray-100 dark:bg-neutral-800"
                    />
                  ))}
                  {extraMutual > 0 && (
                    <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-neutral-800 ring-[1.5px] ring-white dark:ring-neutral-900 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-gray-500 dark:text-gray-400">+{extraMutual}</span>
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                  {person.mutualConnections} mutual connection{(person.mutualConnections ?? 0) !== 1 ? 's' : ''}
                </span>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
