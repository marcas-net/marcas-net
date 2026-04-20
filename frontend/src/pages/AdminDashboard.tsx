import { useState, useEffect, useCallback } from 'react';
import {
  getPlatformStats, getAdminUsers, getAdminOrganizations, updateUserRole, verifyOrganization, getAuditLogs,
  type PlatformStats, type AdminUser, type AdminOrg,
} from '../services/adminService';
import toast from 'react-hot-toast';

type Tab = 'overview' | 'users' | 'organizations' | 'audit';

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Platform management and analytics</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {([
          { key: 'overview' as Tab, label: 'Overview', icon: '📊' },
          { key: 'users' as Tab, label: 'Users', icon: '👤' },
          { key: 'organizations' as Tab, label: 'Organizations', icon: '🏢' },
          { key: 'audit' as Tab, label: 'Audit Logs', icon: '📋' },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              tab === t.key
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'organizations' && <OrganizationsTab />}
      {tab === 'audit' && <AuditTab />}
    </div>
  );
}

// ─── Overview Tab ───────────────────────────────────────

function OverviewTab() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlatformStats().then(setStats).catch(() => toast.error('Failed to load stats')).finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>;
  }

  const cards = [
    { label: 'Total Users', value: stats.totals.users, icon: '👤', color: 'blue' },
    { label: 'Organizations', value: stats.totals.organizations, icon: '🏢', color: 'green' },
    { label: 'Products', value: stats.totals.products, icon: '📦', color: 'purple' },
    { label: 'Posts', value: stats.totals.posts, icon: '📝', color: 'orange' },
    { label: 'Jobs', value: stats.totals.jobs, icon: '💼', color: 'teal' },
    { label: 'Documents', value: stats.totals.documents, icon: '📄', color: 'red' },
    { label: 'Form Templates', value: stats.totals.formTemplates, icon: '📋', color: 'indigo' },
    { label: 'Form Entries', value: stats.totals.formEntries, icon: '✅', color: 'pink' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{c.icon}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{c.label}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{c.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* New Users Badge */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3">
        <span className="text-2xl">🆕</span>
        <div>
          <p className="font-semibold text-blue-900 dark:text-blue-200">{stats.recentUsers7d} new users in the last 7 days</p>
        </div>
      </div>

      {/* Role Distribution + Org Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">User Roles</h3>
          <div className="space-y-2">
            {stats.roleDistribution.map(r => (
              <div key={r.role} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">{r.role}</span>
                <span className="font-medium text-gray-900 dark:text-white">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Organization Types</h3>
          <div className="space-y-2">
            {stats.orgTypes.map(o => (
              <div key={o.type} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">{o.type}</span>
                <span className="font-medium text-gray-900 dark:text-white">{o.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Users Tab ──────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers({ search: search || undefined, role: roleFilter || undefined });
      setUsers(data.users);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load users');
    }
    setLoading(false);
  }, [search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      toast.success('Role updated');
      load();
    } catch {
      toast.error('Failed to update role');
    }
  };

  const roles = ['USER', 'PROFESSIONAL', 'UNIVERSITY', 'REGULATOR', 'LAB', 'ORG_ADMIN', 'ADMIN'];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">All Roles</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="text-xs text-gray-500">{total} users total</div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Org</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-xs font-bold text-gray-500">{u.name?.charAt(0)}</span>}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.organization?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Organizations Tab ──────────────────────────────────

function OrganizationsTab() {
  const [orgs, setOrgs] = useState<AdminOrg[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminOrganizations({ search: search || undefined });
      setOrgs(data.orgs);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load organizations');
    }
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleVerify = async (id: string, verified: boolean) => {
    try {
      await verifyOrganization(id, verified);
      toast.success(verified ? 'Organization verified' : 'Verification removed');
      load();
    } catch {
      toast.error('Failed to update verification');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          placeholder="Search organizations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      <div className="text-xs text-gray-500">{total} organizations total</div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Organization</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Members</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Products</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Verified</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {orgs.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          {o.logoUrl ? <img src={o.logoUrl} alt="" className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-xs font-bold text-gray-500">{o.name?.charAt(0)}</span>}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{o.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{o.type}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{o._count.members}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{o._count.products}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleVerify(o.id, !o.verified)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          o.verified ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {o.verified ? '✓ Verified' : 'Unverified'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Audit Tab ──────────────────────────────────────────

function AuditTab() {
  const [logs, setLogs] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs({ limit: 100 }).then(d => setLogs(d.logs ?? (d as unknown as unknown[]))).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" /></div>;

  const items = logs as Array<{ id: string; action: string; userId: string; user?: { name: string }; details?: string; createdAt: string }>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <span className="text-5xl mb-3">📋</span>
          <p className="text-sm">No audit logs</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Action</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Details</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {items.map((l, i) => (
                <tr key={l.id ?? i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white text-xs">{l.action}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{l.user?.name ?? l.userId}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{l.details ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{l.createdAt ? new Date(l.createdAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
