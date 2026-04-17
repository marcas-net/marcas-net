import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getOrgMembers, inviteMember, getOrganization } from '../services/orgService';
import type { OrgMember } from '../services/orgService';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { roleVariant } from '../styles/design-system';

export default function OrgMembers() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(true);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('USER');
  const [inviting, setInviting] = useState(false);

  const canInvite = user?.role === 'ORG_ADMIN' || user?.role === 'ADMIN';

  useEffect(() => {
    if (!id) return;
    Promise.all([getOrgMembers(id), getOrganization(id)])
      .then(([m, org]) => {
        setMembers(m);
        setOrgName(org.name);
      })
      .catch(() => toast.error('Failed to load members'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      const result = await inviteMember(id, inviteEmail.trim(), inviteRole);
      toast.success(result.message);
      setInviteEmail('');
      // Refresh member list
      const updated = await getOrgMembers(id);
      setMembers(updated);
    } catch {
      toast.error('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to={`/orgs/${id}`}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Members</h1>
          {orgName && <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{orgName}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member list */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-700/80 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 dark:border-neutral-700/80 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {loading ? 'Loading…' : `${members.length} member${members.length !== 1 ? 's' : ''}`}
            </h2>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-neutral-800 flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-gray-100 dark:bg-neutral-800 rounded w-1/2" />
                    <div className="h-2.5 bg-gray-100 dark:bg-neutral-800 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">
              No members yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-neutral-700/80">
              {members.map((member) => {
                const initials = (member.name ?? 'User')
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                const joinDate = new Date(member.createdAt).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                return (
                  <li key={member.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {member.name ?? '—'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{member.role}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge variant={roleVariant[member.role] ?? 'blue'}>
                        {member.role}
                      </Badge>
                      <span className="text-xs text-gray-400 hidden sm:block">
                        Joined {joinDate}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Invite panel */}
        {canInvite && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-700/80 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Invite Member</h2>
            <form onSubmit={handleInvite} className="space-y-3">
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                label="Email address"
              />
              <Select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                label="Role"
                options={[
                  { value: 'USER', label: 'User' },
                  { value: 'ORG_ADMIN', label: 'Org Admin' },
                  { value: 'LAB', label: 'Lab' },
                  { value: 'REGULATOR', label: 'Regulator' },
                ]}
              />
              <Button type="submit" loading={inviting} className="w-full" variant="primary" size="sm">
                Send Invitation
              </Button>
            </form>
            <p className="text-xs text-gray-400 mt-3 leading-relaxed">
              If the user already has an account, they will be added immediately. Otherwise an invitation will be stored for when they register.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
