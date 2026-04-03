import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/Card';
import { roleVariant } from '../styles/design-system';
import { ActivityFeed } from '../components/ActivityFeed';
import { getDashboardStats } from '../services/invitationService';

const Dashboard = () => {
  const { user } = useAuth();
  const role = user?.role ?? 'USER';
  const [stats, setStats] = useState<{ totalOrgs: number; userDocuments: number; orgDocuments: number; orgMembers: number } | null>(null);

  useEffect(() => {
    getDashboardStats().then(setStats).catch(() => {});
  }, []);

  const onboardingSteps = useMemo(() => [
    { key: 'profile', label: 'Complete your profile', desc: 'Add your name and bio', href: '/profile', done: !!(user?.name) },
    { key: 'org', label: 'Create or join an organization', desc: 'Set up your company, lab, or institution', href: '/orgs/create', done: !!(user?.organizationId) },
    { key: 'doc', label: 'Upload your first document', desc: 'Add a lab report, certificate, or compliance record', href: user?.organizationId ? `/orgs/${user.organizationId}/documents` : '/orgs', done: (stats?.userDocuments ?? 0) > 0 },
    { key: 'team', label: 'Invite a teammate', desc: 'Grow your organization by inviting colleagues', href: user?.organizationId ? `/orgs/${user.organizationId}/members` : '/orgs', done: (stats?.orgMembers ?? 0) > 1 },
    { key: 'connect', label: 'Connect with a partner', desc: 'Discover labs, regulators, or producers', href: '/orgs', done: false },
  ], [user, stats]);

  const completedCount = onboardingSteps.filter(s => s.done).length;
  const showOnboarding = completedCount < onboardingSteps.length;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Here's your MarcasNet platform overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={roleVariant[role] ?? 'blue'}>{role}</Badge>
          {user?.organization && (
            <Badge variant="gray">{user.organization.name}</Badge>
          )}
        </div>
      </div>

      {/* Onboarding Checklist */}
      {showOnboarding && (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-300">Getting Started</h2>
              <p className="text-xs text-slate-400 mt-0.5">{completedCount} of {onboardingSteps.length} completed</p>
            </div>
            <div className="w-24 h-2 rounded-full bg-gray-100 dark:bg-neutral-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                style={{ width: `${(completedCount / onboardingSteps.length) * 100}%` }}
              />
            </div>
          </div>
          <div className="space-y-1">
            {onboardingSteps.map((step) => (
              <Link
                key={step.key}
                to={step.href}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-150 group ${
                  step.done
                    ? 'opacity-60'
                    : 'hover:bg-gray-50 dark:hover:bg-neutral-700'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  step.done
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300 dark:border-neutral-600 group-hover:border-blue-400'
                }`}>
                  {step.done && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className={`text-[13px] font-semibold ${step.done ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>{step.label}</p>
                  <p className="text-xs text-slate-400">{step.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Organizations"
          value={stats?.totalOrgs ?? '—'}
          color="blue"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <StatCard
          label="My Documents"
          value={stats?.userDocuments ?? '—'}
          color="green"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          label="Org Members"
          value={stats?.orgMembers ?? '—'}
          color="purple"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Org Documents"
          value={stats?.orgDocuments ?? '—'}
          color="orange"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700/80 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: 'Browse Organizations', desc: 'Find and join organizations', href: '/orgs', color: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400' },
                { label: 'Create Organization', desc: 'Start a new organization', href: '/orgs/create', color: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' },
                ...(user?.organization
                  ? [{ label: 'Org Documents', desc: `View ${user.organization.name} files`, href: `/orgs/${user.organizationId}/documents`, color: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' }]
                  : []),
                { label: 'My Profile', desc: 'View and update your profile', href: '/profile', color: 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400' },
              ].map((a) => (
                <Link
                  key={a.href}
                  to={a.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all duration-150 group"
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
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700/80 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-4">Account Information</h2>
            <div className="space-y-3">
              {[
                { label: 'Name', value: user?.name ?? '—' },
                { label: 'Email', value: user?.email ?? '—' },
                { label: 'Role', value: role },
                { label: 'Organization', value: user?.organization?.name ?? 'Not joined yet' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-neutral-700 last:border-0">
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
