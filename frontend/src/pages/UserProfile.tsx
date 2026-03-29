import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserById, type PublicUser } from '../services/userService';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { roleVariant } from '../styles/design-system';
import toast from 'react-hot-toast';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  ORG_ADMIN: 'Org Admin',
  USER: 'Professional',
  LAB: 'Lab Professional',
  REGULATOR: 'Regulator',
};

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getUserById(id)
      .then(setUser)
      .catch(() => toast.error('User not found'))
      .finally(() => setLoading(false));
  }, [id]);

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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <Avatar name={user.name ?? user.email} size="xl" />
          <div className="flex-1">
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
            <p className="text-xs text-slate-400 mt-2">Joined {joinDate}</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              Connect
            </button>
            <button className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Message
            </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organization */}
        <Card>
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-3">Organization</p>
          {user.organization ? (
            <Link to={`/orgs/${user.organization.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user.organization.name}</p>
                <p className="text-xs text-slate-400">{user.organization.type.charAt(0) + user.organization.type.slice(1).toLowerCase()}</p>
              </div>
            </Link>
          ) : (
            <p className="text-sm text-slate-400">Not part of any organization</p>
          )}
        </Card>

        {/* Activity */}
        <Card>
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-3">Recent Activity</p>
          {user.activityLogs.length > 0 ? (
            <div className="space-y-2">
              {user.activityLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 capitalize">{log.action.replace(/_/g, ' ').toLowerCase()}</p>
                    <p className="text-xs text-slate-400">{log.entityType}</p>
                  </div>
                  <p className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No recent activity</p>
          )}
        </Card>
      </div>

      {/* Documents */}
      {user.documents.length > 0 && (
        <Card>
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-3">Documents</p>
          <div className="space-y-2">
            {user.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-sm">
                    {doc.fileType === 'pdf' ? '📄' : doc.fileType === 'doc' || doc.fileType === 'docx' ? '📝' : '📎'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{doc.title}</p>
                    {doc.fileType && <p className="text-xs text-slate-400 uppercase">{doc.fileType}</p>}
                  </div>
                </div>
                <p className="text-xs text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
