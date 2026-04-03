import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import api from '../../services/api';

interface SuggestedUser {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  organization?: { name: string } | null;
}

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null };
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  ORG_ADMIN: 'Org Admin',
  USER: 'Food Producer',
  LAB: 'Nutrition Lab',
  UNIVERSITY: 'University',
  REGULATOR: 'Regulator',
  PROFESSIONAL: 'Consultant',
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
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    // Load suggested users
    api.get('/users', { params: { limit: 5 } })
      .then((res) => setUsers((res.data.users || res.data || []).slice(0, 5)))
      .catch(() => {});
    // Load recent activity
    api.get('/activity', { params: { limit: 5 } })
      .then((res) => setActivity((res.data.activities || res.data || []).slice(0, 5)))
      .catch(() => {});
  }, []);

  return (
    <aside className="space-y-3">
      {/* Suggested Connections */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 shadow-sm p-4">
        <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide mb-3">
          People You May Know
        </h3>
        <div className="space-y-3">
          {users.length > 0 ? (
            users.map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <Link to={`/profile/${u.id}`} className="flex-shrink-0">
                  <Avatar name={u.name} size="sm" src={u.avatarUrl ?? undefined} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/profile/${u.id}`}
                    className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 truncate block transition-colors"
                  >
                    {u.name}
                  </Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {ROLE_LABELS[u.role] ?? u.role}
                    {u.organization && ` · ${u.organization.name}`}
                  </p>
                </div>
                <button className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
                  Connect
                </button>
              </div>
            ))
          ) : (
            [1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-700" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-24" />
                  <div className="h-2.5 bg-gray-200 dark:bg-neutral-700 rounded w-16" />
                </div>
              </div>
            ))
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
              <div key={a.id} className="flex items-start gap-2.5 group">
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

      {/* Industry Insights */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 shadow-sm p-4">
        <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide mb-3">
          Industry Highlights
        </h3>
        <div className="space-y-2">
          {[
            { label: 'Food Safety Compliance 2026', tag: 'Regulation' },
            { label: 'Sustainable Packaging Trends', tag: 'Industry' },
            { label: 'Nutrition Label Requirements', tag: 'Compliance' },
          ].map((item, i) => (
            <div key={i} className="px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer">
              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{item.label}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{item.tag}</p>
            </div>
          ))}
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
