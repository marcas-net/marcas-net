import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getOrgMembers, inviteMember, removeMember, updateMemberRole, getOrganization } from '../services/orgService';
import type { OrgMember } from '../services/orgService';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';
import { roleVariant } from '../styles/design-system';

const ASSIGNABLE_ROLES = [
  { value: 'USER', label: 'Member' },
  { value: 'ORG_ADMIN', label: 'Org Admin' },
  { value: 'LAB', label: 'Lab' },
  { value: 'REGULATOR', label: 'Regulator' },
  { value: 'PROFESSIONAL', label: 'Professional' },
];

export default function OrgMembers() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(true);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('USER');
  const [inviting, setInviting] = useState(false);

  // Inline role editing
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState<string | null>(null);

  const canManage = user?.role === 'ORG_ADMIN' || user?.role === 'ADMIN';

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
      const updated = await getOrgMembers(id);
      setMembers(updated);
    } catch {
      toast.error('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!id) return;
    setSavingRole(memberId);
    try {
      await updateMemberRole(id, memberId, newRole);
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    } finally {
      setSavingRole(null);
      setEditingRole(null);
    }
  };

  const handleRemove = async (memberId: string, memberName: string) => {
    if (!id) return;
    if (!confirm(`Remove ${memberName} from the organization?`)) return;
    try {
      await removeMember(id, memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/orgs/${id}`} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Team & Permissions</h1>
          {orgName && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{orgName}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member list */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {loading ? 'Loading…' : `${members.length} member${members.length !== 1 ? 's' : ''}`}
            </h2>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-neutral-700 flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-gray-100 dark:bg-neutral-700 rounded w-1/2" />
                    <div className="h-2.5 bg-gray-100 dark:bg-neutral-700 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">No members yet.</div>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-neutral-700/50">
              {members.map((member) => {
                const joinDate = new Date(member.createdAt).toLocaleDateString('en-US', {
                  day: 'numeric', month: 'short', year: 'numeric',
                });
                const isSelf = member.id === user?.id;
                const isEditing = editingRole === member.id;
                const isSaving = savingRole === member.id;

                return (
                  <li key={member.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                    <Avatar src={member.avatarUrl ?? undefined} name={member.name ?? 'User'} size="sm" />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {member.name ?? '—'}
                        {isSelf && <span className="ml-1.5 text-[10px] text-blue-500 font-semibold">(you)</span>}
                      </p>
                      <p className="text-xs text-gray-400 truncate">Joined {joinDate}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Role: editable for admins, badge for others */}
                      {canManage && !isSelf ? (
                        isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              defaultValue={member.role}
                              onChange={e => handleRoleChange(member.id, e.target.value)}
                              disabled={isSaving}
                              className="px-2 py-1 text-xs border border-blue-400 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                              autoFocus
                            >
                              {ASSIGNABLE_ROLES.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => setEditingRole(null)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingRole(member.id)}
                            className="flex items-center gap-1 group"
                            title="Click to change role"
                          >
                            <Badge variant={roleVariant[member.role] ?? 'gray'}>
                              {member.role.replace('_', ' ')}
                            </Badge>
                            <svg className="w-3 h-3 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        )
                      ) : (
                        <Badge variant={roleVariant[member.role] ?? 'gray'}>
                          {member.role.replace('_', ' ')}
                        </Badge>
                      )}

                      {/* Remove button */}
                      {canManage && !isSelf && (
                        <button
                          onClick={() => handleRemove(member.id, member.name ?? 'User')}
                          className="p-1.5 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Remove member"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6h12a6 6 0 00-6-6zm6-4l2 2m0 0l2 2m-2-2l-2 2m2-2l2-2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Invite card */}
          {canManage && (
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Invite Member</h2>
              <form onSubmit={handleInvite} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email address</label>
                  <input
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Role</label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ASSIGNABLE_ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={inviting}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {inviting ? 'Sending…' : 'Send Invitation'}
                </button>
              </form>
              <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                If the user already has an account they'll be added immediately. Otherwise an invitation email is sent.
              </p>
            </div>
          )}

          {/* Role guide */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Role Guide</h3>
            <div className="space-y-2">
              {[
                { role: 'ORG_ADMIN', label: 'Org Admin', desc: 'Full org management' },
                { role: 'USER', label: 'Member', desc: 'Standard access' },
                { role: 'LAB', label: 'Lab', desc: 'Lab operations' },
                { role: 'REGULATOR', label: 'Regulator', desc: 'Compliance access' },
              ].map(r => (
                <div key={r.role} className="flex items-center gap-2">
                  <Badge variant={roleVariant[r.role] ?? 'gray'}>{r.label}</Badge>
                  <span className="text-xs text-gray-400">{r.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
