import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { roleVariant } from '../styles/design-system';
import toast from 'react-hot-toast';

interface ProfileData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  organizationId?: string | null;
  organization?: { id: string; name: string; type: string } | null;
  createdAt: string;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getProfile()
      .then((data) => setProfile(data.user))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <Avatar name={display?.name ?? display?.email} size="xl" src={display?.avatarUrl ?? undefined} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{display?.name ?? 'No name set'}</h2>
              <Badge variant={roleVariant[role] ?? 'blue'}>{role}</Badge>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{display?.email}</p>
            {profile?.organization && (
              <p className="text-sm text-blue-600 mt-1 font-medium">{profile.organization.name}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-4">Account Details</p>
          <div className="space-y-3">
            {[
              { label: 'Full Name', value: display?.name ?? '—' },
              { label: 'Email', value: display?.email ?? '—' },
              { label: 'Role', value: role },
              { label: 'Member since', value: joinDate },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-sm py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <span className="text-slate-400">{row.label}</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium text-right max-w-[60%] truncate">{row.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-4">Organization</p>
          {profile?.organization ? (
            <div className="space-y-3">
              {[
                { label: 'Name', value: profile.organization.name },
                { label: 'Type', value: profile.organization.type.charAt(0) + profile.organization.type.slice(1).toLowerCase() },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
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
