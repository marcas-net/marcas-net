import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/Card';
import { roleVariant } from '../styles/design-system';
import { ActivityFeed } from '../components/ActivityFeed';

const Dashboard = () => {
  const { user } = useAuth();
  const role = user?.role ?? 'USER';

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Here's your MARCAS platform overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={roleVariant[role] ?? 'blue'}>{role}</Badge>
          {user?.organization && (
            <Badge variant="gray">{user.organization.name}</Badge>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Organizations"
          value={user?.organization ? 1 : 0}
          color="blue"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <StatCard
          label="Documents"
          value="—"
          color="green"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          label="Members"
          value="—"
          color="purple"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Account Status"
          value="Active"
          color="orange"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: 'Browse Organizations', desc: 'Find and join organizations', href: '/orgs', color: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400' },
                { label: 'Create Organization', desc: 'Start a new organization', href: '/orgs/create', color: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' },
                { label: 'My Profile', desc: 'View and update your profile', href: '/profile', color: 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400' },
              ].map((a) => (
                <Link
                  key={a.href}
                  to={a.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-150 group"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${a.color}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">{a.label}</p>
                    <p className="text-xs text-slate-400">{a.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Account info */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Account Information</h2>
            <div className="space-y-3">
              {[
                { label: 'Name', value: user?.name ?? '—' },
                { label: 'Email', value: user?.email ?? '—' },
                { label: 'Role', value: role },
                { label: 'Organization', value: user?.organization?.name ?? 'Not joined yet' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">{row.label}</span>
                  <span className="text-sm text-slate-800 dark:text-slate-200 font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Getting started banner */}
      {!user?.organization && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-white font-semibold text-base">Get started — join an organization</h3>
            <p className="text-blue-200 text-sm mt-1">Connect with food industry companies, labs, and regulators</p>
          </div>
          <Link
            to="/orgs"
            className="flex-shrink-0 bg-white text-blue-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors"
          >
            Browse Organizations →
          </Link>
        </div>
      )}

      {/* Activity Feed */}
      <ActivityFeed />
    </div>
  );
};

export default Dashboard;
