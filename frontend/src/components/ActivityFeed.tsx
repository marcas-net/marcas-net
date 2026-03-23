import { useEffect, useState } from 'react';
import type { ActivityLog } from '../services/activityService';
import { getActivity } from '../services/activityService';

const ACTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  document_uploaded: { label: 'uploaded a document', icon: '📄', color: 'bg-blue-50 text-blue-600' },
  document_deleted: { label: 'deleted a document', icon: '🗑️', color: 'bg-red-50 text-red-500' },
  organization_joined: { label: 'joined an organization', icon: '🏢', color: 'bg-green-50 text-green-600' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ActivityFeed() {
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActivity()
      .then(setActivity)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
      </div>

      {loading ? (
        <div className="px-5 py-8 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
              <div className="flex-1 space-y-1.5 pt-1">
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : activity.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-gray-400">
          No activity yet. Start uploading documents or joining organizations.
        </div>
      ) : (
        <ul className="divide-y divide-gray-50 dark:divide-gray-800">
          {activity.map((item) => {
            const meta = ACTION_LABELS[item.action] ?? {
              label: item.action.replace(/_/g, ' '),
              icon: '🔔',
              color: 'bg-gray-50 text-gray-500',
            };
            const displayName = item.user.name ?? item.user.email.split('@')[0];

            return (
              <li key={item.id} className="flex gap-3 items-start px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${meta.color}`}>
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{displayName}</span>
                    {' '}{meta.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(item.createdAt)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
