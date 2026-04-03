import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { followOrg, getFollowStatus } from '../../services/feedService';
import toast from 'react-hot-toast';

interface SuggestedOrg {
  id: string;
  name: string;
  type: string;
  description: string | null;
  _memberCount?: number;
  following?: boolean;
}

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null };
}

interface HighlightPost {
  id: string;
  content: string;
  category: string;
  likesCount: number;
  commentsCount: number;
}

const ORG_TYPE_LABELS: Record<string, string> = {
  COMPANY: 'Food Producer',
  LABORATORY: 'Nutrition Lab',
  UNIVERSITY: 'University',
  REGULATOR: 'Regulator',
  PROFESSIONAL: 'Professional',
};

const ORG_TYPE_COLORS: Record<string, string> = {
  COMPANY: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
  LABORATORY: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  UNIVERSITY: 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300',
  REGULATOR: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300',
  PROFESSIONAL: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
};

const CATEGORY_LABELS: Record<string, string> = {
  SUPPLY_OFFER: 'Supply',
  PARTNERSHIP_REQUEST: 'Partnership',
  INDUSTRY_ANNOUNCEMENT: 'Industry',
  GENERAL: 'General',
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export function RightPanel() {
  const [orgs, setOrgs] = useState<SuggestedOrg[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [highlights, setHighlights] = useState<HighlightPost[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load organizations
    api.get('/orgs')
      .then(async (res) => {
        const allOrgs: SuggestedOrg[] = (res.data.organizations || res.data || []).slice(0, 5);
        setOrgs(allOrgs);
        // Check follow status for each org
        const statusMap: Record<string, boolean> = {};
        await Promise.all(
          allOrgs.map(async (org) => {
            try {
              const { following } = await getFollowStatus({ orgId: org.id });
              statusMap[org.id] = following;
            } catch {
              statusMap[org.id] = false;
            }
          })
        );
        setFollowingMap(statusMap);
      })
      .catch(() => {})
      .finally(() => setLoadingOrgs(false));

    // Load recent activity
    api.get('/activity', { params: { limit: 5 } })
      .then((res) => setActivity((res.data.activities || res.data || []).slice(0, 5)))
      .catch(() => {});

    // Load trending/popular posts for industry highlights
    api.get('/feed')
      .then((res) => {
        const posts = res.data.posts || [];
        // Sort by engagement (likes + comments) and pick top 4
        const sorted = [...posts]
          .map((p: any) => ({
            id: p.id,
            content: p.content,
            category: p.category,
            likesCount: p.likesCount || p._count?.likes || 0,
            commentsCount: p.commentsCount || p._count?.comments || 0,
          }))
          .sort((a: HighlightPost, b: HighlightPost) => (b.likesCount + b.commentsCount) - (a.likesCount + a.commentsCount))
          .slice(0, 4);
        setHighlights(sorted);
      })
      .catch(() => {});
  }, []);

  const handleFollowOrg = async (orgId: string) => {
    try {
      const { following } = await followOrg(orgId);
      setFollowingMap((prev) => ({ ...prev, [orgId]: following }));
      toast.success(following ? 'Following organization' : 'Unfollowed organization');
    } catch {
      toast.error('Failed to update follow status');
    }
  };

  return (
    <aside className="space-y-3">
      {/* Organizations You May Know */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 shadow-sm p-4">
        <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide mb-3">
          Organizations You May Know
        </h3>
        <div className="space-y-3">
          {loadingOrgs ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-neutral-700" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-24" />
                  <div className="h-2.5 bg-gray-200 dark:bg-neutral-700 rounded w-16" />
                </div>
              </div>
            ))
          ) : orgs.length > 0 ? (
            orgs.map((org) => (
              <div key={org.id} className="flex items-center gap-3">
                <Link
                  to={`/orgs/${org.id}`}
                  className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${ORG_TYPE_COLORS[org.type] || 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300'}`}
                >
                  {org.name.charAt(0).toUpperCase()}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/orgs/${org.id}`}
                    className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 truncate block transition-colors"
                  >
                    {org.name}
                  </Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {ORG_TYPE_LABELS[org.type] ?? org.type}
                  </p>
                </div>
                <button
                  onClick={() => handleFollowOrg(org.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    followingMap[org.id]
                      ? 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
                      : 'border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                  }`}
                >
                  {followingMap[org.id] ? 'Following' : 'Follow'}
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">
              No organizations found
            </p>
          )}
        </div>
        {orgs.length > 0 && (
          <Link
            to="/orgs"
            className="block mt-3 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline text-center"
          >
            View all organizations →
          </Link>
        )}
      </div>

      {/* Industry Highlights — dynamic from trending posts */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 shadow-sm p-4">
        <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide mb-3">
          Industry Highlights
        </h3>
        <div className="space-y-2">
          {highlights.length > 0 ? (
            highlights.map((h) => (
              <div key={h.id} className="px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer">
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                  {h.content}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {CATEGORY_LABELS[h.category] ?? h.category}
                  </span>
                  {(h.likesCount > 0 || h.commentsCount > 0) && (
                    <>
                      <span className="text-[10px] text-gray-300 dark:text-gray-600">·</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {h.likesCount > 0 && `${h.likesCount} like${h.likesCount !== 1 ? 's' : ''}`}
                        {h.likesCount > 0 && h.commentsCount > 0 && ', '}
                        {h.commentsCount > 0 && `${h.commentsCount} comment${h.commentsCount !== 1 ? 's' : ''}`}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-3">
              No highlights yet — start posting!
            </p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 shadow-sm p-4">
        <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide mb-3">
          Recent Activity
        </h3>
        <div className="space-y-2.5">
          {activity.length > 0 ? (
            activity.map((a) => (
              <div key={a.id} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    <span className="font-medium">{a.user?.name ?? 'Someone'}</span>{' '}
                    {a.action.toLowerCase().replace(/_/g, ' ')}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {timeAgo(a.createdAt)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-3">
              No recent activity
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-2 text-[10px] text-gray-400 dark:text-gray-500 space-y-1">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <Link to="/feed" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About</Link>
          <Link to="/feed" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Help</Link>
          <Link to="/feed" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy</Link>
          <Link to="/feed" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms</Link>
        </div>
        <p>&copy; {new Date().getFullYear()} MarcasNet. All rights reserved.</p>
      </div>
    </aside>
  );
}
